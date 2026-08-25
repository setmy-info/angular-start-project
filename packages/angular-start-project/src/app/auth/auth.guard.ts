import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Protects a route. Usage in app.routes.ts:
 *
 *     { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
 *
 * Four cases, in order:
 *
 *  1. Feature flag off       -> everything is public, navigation proceeds untouched.
 *  2. Valid session          -> proceeds. If the access token is expired but the refresh token
 *                               still works, getAccessToken() renews it here and the user never
 *                               sees a login screen. This is the ordinary "access token lived 5
 *                               minutes, the SSO session lives 14-30 days" case.
 *  3. Keycloak session over  -> the refresh comes back null, AuthService has already cleared the
 *                               unusable tokens, and the browser is sent to Keycloak for a new
 *                               login. Same path as a cold page load, where the tokens are gone
 *                               because they were only ever in memory: Keycloak's SSO cookie
 *                               usually turns that redirect into an invisible round trip.
 *  4. Keycloak unreachable   -> navigation is ALLOWED. A blip in the network is not a reason to
 *                               throw someone out of the app; the individual API calls on that
 *                               page will fail and can be retried, and the session state is left
 *                               intact rather than corrupted.
 *
 * Angular's answer is never authoritative — the backend re-validates the token on every request.
 * This guard decides what gets rendered, not what is permitted.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
    const auth = inject(AuthService);

    if (!auth.enabled) {
        return true;
    }

    if (auth.isAuthenticated()) {
        try {
            if (await auth.getAccessToken()) {
                return true;
            }
        } catch {
            // Case 4: transient failure — keep the local state and let the user through.
            return true;
        }
        // Fell through: the session is genuinely over and has been cleared.
    }

    // state.url is the route the user actually asked for, so they land there after login
    // instead of on the start page.
    await auth.login(state.url);
    return false;
};
