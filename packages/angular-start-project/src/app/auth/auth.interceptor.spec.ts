import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { keycloakConfig, keycloakEndpoints } from './auth.config';
import { base64UrlEncode } from './pkce';

const PROTECTED_URL = 'http://localhost:4200/rest/profile';
const PUBLIC_URL = 'http://localhost:4200/json/content/en.json';

function makeJwt(claims: object): string {
    const segment = (value: object) =>
        base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
    return `${segment({ alg: 'RS256' })}.${segment(claims)}.signature`;
}

function tokenResponse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        access_token: makeJwt({ preferred_username: 'imre' }),
        refresh_token: 'refresh-1',
        id_token: makeJwt({ nonce: 'test-nonce' }),
        expires_in: 300,
        ...overrides,
    };
}

function okResponse(body: unknown): Response {
    return { ok: true, status: 200, json: async () => body } as Response;
}

async function signIn(service: AuthService, response = tokenResponse()): Promise<void> {
    sessionStorage.setItem(
        'angularStartProject.auth.transaction',
        JSON.stringify({
            state: 'test-state',
            nonce: 'test-nonce',
            codeVerifier: 'test-verifier',
            returnUrl: '/profile',
            createdAt: Date.now(),
        }),
    );
    fetchMock.mockResolvedValueOnce(okResponse(response));
    const result = await service.handleCallback(
        `${keycloakConfig.redirectUri}?code=auth-code&state=test-state`,
    );
    expect(result.ok).toBe(true);
}

function intercept(url: string, next: HttpHandlerFn): Promise<HttpResponse<unknown>> {
    const request = new HttpRequest('GET', url);
    return firstValueFrom(
        TestBed.runInInjectionContext(
            () => authInterceptor(request, next) as Observable<HttpResponse<unknown>>,
        ),
    );
}

let fetchMock: ReturnType<typeof vi.fn>;
let assignMock: ReturnType<typeof vi.fn>;
let originalEnabled: boolean;
let originalLocation: PropertyDescriptor | undefined;

beforeEach(() => {
    originalEnabled = keycloakConfig.enabled;
    keycloakConfig.enabled = true;
    sessionStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    assignMock = vi.fn();
    // jsdom refuses real navigation, so the one call that would leave the page is replaced.
    // The original descriptor is put back in afterEach — other suites read window.location too.
    originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
            href: 'http://localhost:4200/profile',
            origin: 'http://localhost:4200',
            protocol: 'http:',
            host: 'localhost:4200',
            hostname: 'localhost',
            pathname: '/profile',
            search: '',
            hash: '',
            assign: assignMock,
        },
    });
});

afterEach(() => {
    keycloakConfig.enabled = originalEnabled;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
    if (originalLocation) {
        Object.defineProperty(window, 'location', originalLocation);
    }
});

describe('authInterceptor', () => {
    it('attaches the bearer token to a protected request', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        const next = vi.fn((request: HttpRequest<unknown>) =>
            of(new HttpResponse({ status: 200, url: request.url })),
        );

        await intercept(PROTECTED_URL, next as unknown as HttpHandlerFn);

        expect(next.mock.calls[0][0].headers.get('Authorization')).toBe(
            `Bearer ${tokenResponse()['access_token']}`,
        );
    });

    it('never sends the token to Keycloak', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        const next = vi.fn((request: HttpRequest<unknown>) =>
            of(new HttpResponse({ status: 200, url: request.url })),
        );

        await intercept(keycloakEndpoints.token, next as unknown as HttpHandlerFn);

        expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
    });

    it('leaves unprotected URLs alone', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        const next = vi.fn((request: HttpRequest<unknown>) =>
            of(new HttpResponse({ status: 200, url: request.url })),
        );

        await intercept(PUBLIC_URL, next as unknown as HttpHandlerFn);

        expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
    });

    it('adds nothing when the feature flag is off', async () => {
        keycloakConfig.enabled = false;
        TestBed.inject(AuthService);
        const next = vi.fn((request: HttpRequest<unknown>) =>
            of(new HttpResponse({ status: 200, url: request.url })),
        );

        await intercept(PROTECTED_URL, next as unknown as HttpHandlerFn);

        expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
    });

    it('renews an about-to-expire token before the request leaves', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        const renewed = tokenResponse({ access_token: makeJwt({ preferred_username: 'renewed' }) });
        fetchMock.mockResolvedValueOnce(okResponse(renewed));
        const next = vi.fn((request: HttpRequest<unknown>) =>
            of(new HttpResponse({ status: 200, url: request.url })),
        );

        await intercept(PROTECTED_URL, next as unknown as HttpHandlerFn);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].headers.get('Authorization')).toBe(
            `Bearer ${renewed['access_token']}`,
        );
    });

    it('refreshes once and retries the request exactly once on 401', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        fetchMock.mockClear();
        const renewed = tokenResponse({ access_token: makeJwt({ preferred_username: 'renewed' }) });
        fetchMock.mockResolvedValueOnce(okResponse(renewed));

        let call = 0;
        const next = vi.fn((request: HttpRequest<unknown>) => {
            call += 1;
            return call === 1
                ? throwError(() => new HttpErrorResponse({ status: 401, url: request.url }))
                : of(new HttpResponse({ status: 200, url: request.url }));
        });

        const response = await intercept(PROTECTED_URL, next as unknown as HttpHandlerFn);

        expect(response.status).toBe(200);
        expect(next).toHaveBeenCalledTimes(2);
        expect(next.mock.calls[1][0].headers.get('Authorization')).toBe(
            `Bearer ${renewed['access_token']}`,
        );
    });

    // The anti-loop guarantee: a backend that answers 401 no matter what must not make this
    // interceptor refresh and retry forever.
    it('gives up after a single retry when the API keeps answering 401', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        fetchMock.mockClear();
        fetchMock.mockResolvedValue(okResponse(tokenResponse()));
        const next = vi.fn((request: HttpRequest<unknown>) =>
            throwError(() => new HttpErrorResponse({ status: 401, url: request.url })),
        );

        await expect(
            intercept(PROTECTED_URL, next as unknown as HttpHandlerFn),
        ).rejects.toMatchObject({
            status: 401,
        });
        expect(next).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sends the user to Keycloak when the refresh token is no longer accepted', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'invalid_grant' }),
        } as Response);
        const next = vi.fn((request: HttpRequest<unknown>) =>
            throwError(() => new HttpErrorResponse({ status: 401, url: request.url })),
        );

        await expect(
            intercept(PROTECTED_URL, next as unknown as HttpHandlerFn),
        ).rejects.toMatchObject({
            status: 401,
        });
        expect(service.isAuthenticated()).toBe(false);
        // requireLogin() is deliberately not awaited by the interceptor — the failing request is
        // rejected at once while the redirect is being prepared — so wait for it here.
        await vi.waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
        expect(assignMock.mock.calls[0][0]).toContain(keycloakEndpoints.authorization);
    });

    it('does not log the user out when a non-401 error comes back', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        fetchMock.mockClear();
        const next = vi.fn((request: HttpRequest<unknown>) =>
            throwError(() => new HttpErrorResponse({ status: 500, url: request.url })),
        );

        await expect(
            intercept(PROTECTED_URL, next as unknown as HttpHandlerFn),
        ).rejects.toMatchObject({
            status: 500,
        });
        expect(next).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(service.isAuthenticated()).toBe(true);
    });
});
