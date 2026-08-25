import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

import { isProtectedResourceUrl } from './auth.config';
import { AuthService } from './auth.service';

/**
 * Attaches `Authorization: Bearer <access_token>` to protected API requests.
 *
 * Business services stay completely unaware of authentication: they inject HttpClient and call
 * their endpoint. Everything below happens underneath them.
 *
 * WHAT GETS A TOKEN
 * -----------------
 * Only URLs matching `keycloak.protectedResourceUrls`, and never a Keycloak URL — see
 * isProtectedResourceUrl() in auth.config.ts. With the feature flag off nothing is touched at
 * all, so the app behaves exactly as it did before Keycloak existed.
 *
 * THE REFRESH POINT
 * -----------------
 * getAccessToken() is awaited before the request is sent. That is where lazy renewal happens:
 * if the token is expired or within 30s of expiring, the request waits for a refresh instead of
 * being sent with a token the backend would reject. Concurrent requests all land on the same
 * single-flight refresh in AuthService (one HTTP call to Keycloak, N waiters), and every one of
 * them is released — with the new token or with the failure — when it settles.
 *
 * THE 401 PATH
 * ------------
 * A 401 can still arrive with a locally-valid token (Keycloak revoked it, the realm keys were
 * rotated, clocks disagree). The request is then retried EXACTLY ONCE after a refresh. The retry
 * is deliberately not wrapped in this catchError, which is what makes an infinite
 * 401 -> refresh -> 401 loop structurally impossible: a second 401 propagates to the caller.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(AuthService);

    if (!auth.enabled || !isProtectedResourceUrl(request.url)) {
        return next(request);
    }

    return from(auth.getAccessToken()).pipe(
        switchMap((token) => next(withBearerToken(request, token))),
        catchError((error: unknown) => {
            // Anything that is not a 401 — including the AuthTransientError thrown when Keycloak
            // could not be reached — is the caller's problem, not a reason to renew or to log
            // anybody out.
            if (!isUnauthorized(error)) {
                return throwError(() => error);
            }

            return from(auth.refresh()).pipe(
                switchMap((token) => {
                    if (!token) {
                        // Keycloak refused the refresh token: the SSO session is over (idle or
                        // max lifetime reached, or logged out elsewhere). AuthService has already
                        // dropped the local state; send the user through a new login and fail
                        // this request with the original 401.
                        void auth.requireLogin();
                        return throwError(() => error);
                    }
                    // The one and only retry.
                    return next(withBearerToken(request, token));
                }),
            );
        }),
    );
};

function withBearerToken(
    request: HttpRequest<unknown>,
    token: string | null,
): HttpRequest<unknown> {
    if (!token) {
        // No session at all. The request still goes out; the backend answers 401 and the branch
        // above turns that into a login redirect.
        return request;
    }
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
}

// Re-exported so a test or a custom pipeline can call the interceptor with an explicit handler.
export type AuthInterceptorHandler = (
    request: HttpRequest<unknown>,
    next: HttpHandlerFn,
) => Observable<HttpEvent<unknown>>;
