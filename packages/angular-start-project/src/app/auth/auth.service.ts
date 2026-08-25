import { Injectable, computed, signal } from '@angular/core';

import { TOKEN_EXPIRY_SKEW_MS, keycloakConfig, keycloakEndpoints } from './auth.config';
import { KeycloakJwtClaims, clientRolesOf, decodeJwtPayload, realmRolesOf } from './jwt';
import { createPkcePair, randomUrlSafeString } from './pkce';
import {
    AuthSession,
    AuthTokenEndpointError,
    AuthTransaction,
    AuthTransientError,
    CallbackFailureReason,
    CallbackResult,
    TokenEndpointResponse,
    TokenSet,
} from './auth.model';

// The ONLY thing this app persists across the redirect: the in-flight authorization transaction
// (PKCE verifier + state + nonce + the route to come back to). It has to survive a full page
// navigation to Keycloak and back, so it cannot live in memory; sessionStorage (per tab, dropped
// when the tab closes) is the narrowest place that survives it. It is deleted the moment the
// callback is processed — successfully or not — so it exists for seconds, not for a session.
const TRANSACTION_STORAGE_KEY = 'angularStartProject.auth.transaction';

// Marks "this tab already tried a prompt=none probe". Without it, a realm with no SSO session
// answers `error=login_required`, the app lands back on the start page and immediately probes
// again — a redirect loop. Cleared on a real login and on logout.
const SILENT_SSO_STORAGE_KEY = 'angularStartProject.auth.silentSsoAttempted';

/**
 * Keycloak OpenID Connect authentication — Authorization Code Flow with PKCE, public client,
 * no client secret, no third-party library. Angular + TypeScript + Web APIs only.
 *
 * TOKEN STORAGE — deliberate consequence
 * --------------------------------------
 * Access, refresh and id tokens live in a private field of this singleton, i.e. in runtime
 * memory. They are never written to localStorage and never written to sessionStorage. A tab
 * close, a hard reload or an F5 therefore throws the tokens away. That is not a bug: it is the
 * chosen trade-off, because a refresh token in localStorage is readable by any XSS on the origin
 * and stays valid for as long as Keycloak's SSO Session Idle (~14 days).
 *
 * The cost of that choice is paid by Keycloak's SSO cookie, not by the user: after a reload the
 * app has no tokens, the route guard calls login(), the browser bounces through Keycloak, and
 * because the SSO session cookie is still there Keycloak redirects straight back with a fresh
 * code — no login screen, no credentials, typically a flash of the browser's loading bar. Set
 * `keycloak.silentSsoOnStartup` to do that probe once at bootstrap instead of on first
 * protected navigation.
 *
 * WHO OWNS THE SESSION
 * --------------------
 * Keycloak does. The signals below are a cache of what Keycloak last told this tab, never the
 * authority on whether the user is still logged in. SSO Session Idle (~14 days) and SSO Session
 * Max (~30 days) are enforced entirely by Keycloak; this class implements neither and only
 * reacts to a refresh succeeding or failing. That is what lets a user stay logged in for weeks
 * and still be forced through a new login once the session max is reached.
 *
 * NO TIMERS
 * ---------
 * There is no setInterval, no setTimeout, no background refresh loop. Renewal happens lazily,
 * at the moment an outgoing request needs a token that is expired or within
 * TOKEN_EXPIRY_SKEW_MS (30s) of expiring — see getAccessToken() and refresh().
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    /** The feature flag from the environment. Everything below no-ops when it is false. */
    readonly enabled = keycloakConfig.enabled;

    /** Runtime memory only — see the class comment. Never serialised anywhere. */
    private tokens: TokenSet | null = null;

    /**
     * SINGLE-FLIGHT REFRESH LATCH.
     *
     * Holds the one in-progress refresh promise, or null when no refresh is running. Every
     * concurrent caller receives THIS promise rather than starting a second refresh — see
     * refresh() for the full explanation.
     */
    private refreshInFlight: Promise<string | null> | null = null;

    /** Set once a redirect to Keycloak has been started, so N failures cause 1 redirect. */
    private redirecting = false;

    private readonly sessionSignal = signal<AuthSession | null>(null);

    /** Claims of the current access token, for templates. Null when nobody is signed in. */
    readonly session = this.sessionSignal.asReadonly();

    /**
     * True when this tab holds a token set. NOT proof that the Keycloak session is still alive —
     * only the next refresh can establish that. Used for rendering, and by authGuard as the
     * cheap first check.
     */
    readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

    readonly userName = computed(() => this.sessionSignal()?.userName ?? null);

    readonly displayName = computed(() => this.sessionSignal()?.displayName ?? null);

    /** Realm roles of the current access token. UI use only — see jwt.ts. */
    readonly roles = computed(() => this.sessionSignal()?.realmRoles ?? []);

    // ---------------------------------------------------------------------------------------
    // Authorization Code Flow with PKCE — step 1 and 2: build the transaction, leave the app.
    // ---------------------------------------------------------------------------------------

    /**
     * Sends the browser to Keycloak's authorization endpoint.
     *
     * @param returnUrl Angular route to come back to after login. Defaults to the current one,
     *                  which is what the route guard wants: land the user where they aimed.
     * @param options   `prompt: 'none'` asks Keycloak to answer from an existing SSO session
     *                  without ever showing UI; it responds with `error=login_required` instead
     *                  of a login form when there is no session.
     */
    async login(
        returnUrl: string = currentAppUrl(),
        options: { prompt?: 'none' } = {},
    ): Promise<void> {
        if (!this.enabled) {
            return;
        }
        // A full-page redirect is already under way; a second location.assign() would only race.
        if (this.redirecting) {
            return;
        }
        this.redirecting = true;

        const pkce = await createPkcePair();
        const transaction: AuthTransaction = {
            // CSRF protection for the callback: a random value that goes to Keycloak, comes back
            // in the redirect, and is compared in handleCallback(). A callback whose state does
            // not match a transaction this tab created is never exchanged for tokens.
            state: randomUrlSafeString(16),
            // Replay protection for the id_token; Keycloak echoes it back as the `nonce` claim.
            nonce: randomUrlSafeString(16),
            codeVerifier: pkce.codeVerifier,
            returnUrl,
            createdAt: Date.now(),
        };
        writeTransaction(transaction);

        // URLSearchParams percent-encodes every name and value, so redirect URIs with query
        // strings, scopes with spaces and non-ASCII values are all encoded correctly.
        const parameters = new URLSearchParams({
            response_type: 'code',
            client_id: keycloakConfig.clientId,
            redirect_uri: keycloakConfig.redirectUri,
            scope: keycloakConfig.scopes.join(' '),
            state: transaction.state,
            nonce: transaction.nonce,
            // Only the SHA-256 of the verifier travels; the verifier itself stays in this tab.
            code_challenge: pkce.codeChallenge,
            code_challenge_method: pkce.codeChallengeMethod,
        });
        if (options.prompt) {
            parameters.set('prompt', options.prompt);
        }

        const authorizationUrl = new URL(keycloakEndpoints.authorization);
        authorizationUrl.search = parameters.toString();
        window.location.assign(authorizationUrl.toString());
    }

    // ---------------------------------------------------------------------------------------
    // Steps 3 and 4: read the redirect back from Keycloak, exchange the code for tokens.
    // ---------------------------------------------------------------------------------------

    /**
     * Processes the redirect back from Keycloak. Called by AuthCallbackComponent, which owns the
     * `auth/callback` route. Never throws: every failure comes back as a typed result so the
     * callback view can show something and still send the user somewhere sensible.
     */
    async handleCallback(callbackUrl: string = window.location.href): Promise<CallbackResult> {
        if (!this.enabled) {
            return { ok: true, returnUrl: '/' };
        }

        const parameters = new URL(callbackUrl).searchParams;
        // One-shot: read and delete, whatever happens next. A transaction must never be usable
        // for a second callback.
        const transaction = readTransaction();
        clearTransaction();
        const returnUrl = transaction?.returnUrl || '/';

        const fail = (
            reason: CallbackFailureReason,
            error: string | null = null,
            errorDescription: string | null = null,
        ): CallbackResult => ({ ok: false, reason, error, errorDescription, returnUrl });

        // Keycloak reports authorization failures on the redirect itself (access_denied when the
        // user cancels, login_required from a prompt=none probe, invalid_scope, ...).
        const providerError = parameters.get('error');
        if (providerError) {
            return fail('provider_error', providerError, parameters.get('error_description'));
        }

        const code = parameters.get('code');
        const state = parameters.get('state');
        if (!code || !state) {
            return fail('invalid_response');
        }
        if (!transaction) {
            return fail('missing_transaction');
        }
        // CSRF / session-fixation check. An authorization code delivered to this route without a
        // matching state was not requested by this tab: refuse it before it reaches Keycloak.
        if (state !== transaction.state) {
            return fail('state_mismatch');
        }

        let response: TokenEndpointResponse;
        try {
            response = await requestTokens(
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    // Must be byte-identical to the one sent in the authorization request.
                    redirect_uri: keycloakConfig.redirectUri,
                    client_id: keycloakConfig.clientId,
                    // Proof that this is the same client that started the flow — replaces the
                    // client secret a confidential client would send here.
                    code_verifier: transaction.codeVerifier,
                }),
            );
        } catch (error) {
            return fail(
                'token_request_failed',
                error instanceof AuthTokenEndpointError ? error.error : null,
                error instanceof Error ? error.message : null,
            );
        }

        // Replay check on the id_token. Not a security boundary (the signature is not verified
        // here — the backend does that); it catches a stale or swapped id_token cheaply.
        if (response.id_token) {
            const idTokenClaims = decodeJwtPayload(response.id_token);
            if (idTokenClaims?.nonce !== transaction.nonce) {
                return fail('nonce_mismatch');
            }
        }

        this.applyTokenResponse(response);
        this.redirecting = false;
        removeItem(SILENT_SSO_STORAGE_KEY);
        return { ok: true, returnUrl };
    }

    // ---------------------------------------------------------------------------------------
    // Token access and lazy renewal.
    // ---------------------------------------------------------------------------------------

    /**
     * The token to put in an Authorization header, renewed on demand.
     *
     * Returns null when the feature flag is off, when nobody is signed in, or when the Keycloak
     * session turned out to be over (in which case the local state has already been cleared).
     * Throws AuthTransientError when Keycloak could not be reached — the caller should fail that
     * one request, NOT log the user out.
     */
    async getAccessToken(): Promise<string | null> {
        if (!this.enabled) {
            return null;
        }
        const tokens = this.tokens;
        if (!tokens) {
            return null;
        }
        // Lazy renewal: nothing refreshes until something actually needs a usable token.
        if (!isExpiringSoon(tokens)) {
            return tokens.accessToken;
        }
        return await this.refresh();
    }

    /**
     * Renews the access token from the refresh token — the ONLY place a refresh request is made.
     *
     * SINGLE FLIGHT / CONCURRENT REFRESH
     * ----------------------------------
     * Five HTTP requests firing at once against a token that expired a second ago would, done
     * naively, produce five refresh calls. With refresh-token rotation that is not merely
     * wasteful: Keycloak invalidates a rotated refresh token as soon as it is used, so calls
     * two through five would present a token that no longer exists and the session would be
     * destroyed by the app's own concurrency.
     *
     * The latch below prevents it. The first caller stores its promise in `refreshInFlight`;
     * every caller that arrives while that promise is pending gets the SAME promise object back
     * and therefore awaits the same single HTTP request and reads the same result. The `finally`
     * clears the latch once the request settles — success or failure — so every waiter is
     * released and the next expiry starts a fresh refresh. There is no lock to leak: even an
     * exception passes through `finally`.
     *
     * Note the ordering: the latch is assigned synchronously, before any await, so two callers
     * in the same task cannot both see null.
     */
    async refresh(): Promise<string | null> {
        if (!this.enabled) {
            return null;
        }
        if (this.refreshInFlight) {
            return await this.refreshInFlight;
        }
        const refreshToken = this.tokens?.refreshToken;
        if (!refreshToken) {
            // Nothing to renew from. Not an error — the caller decides whether that means
            // "anonymous" or "send them to Keycloak".
            return null;
        }

        this.refreshInFlight = this.performRefresh(refreshToken).finally(() => {
            this.refreshInFlight = null;
        });
        return await this.refreshInFlight;
    }

    private async performRefresh(refreshToken: string): Promise<string | null> {
        try {
            const response = await requestTokens(
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: keycloakConfig.clientId,
                    refresh_token: refreshToken,
                }),
            );
            this.applyTokenResponse(response, refreshToken);
            return response.access_token;
        } catch (error) {
            // Keycloak was unreachable, or answered 5xx/429. It never said the session is over,
            // so the tokens are LEFT UNTOUCHED and the caller sees a transient failure. This is
            // what keeps a flaky network from silently logging the user out.
            if (error instanceof AuthTransientError) {
                throw error;
            }
            if (error instanceof AuthTokenEndpointError && error.isTransient()) {
                throw new AuthTransientError(error.message, error);
            }
            // A 400 invalid_grant is Keycloak's definitive answer: the refresh token is expired,
            // revoked, already rotated away, or the SSO session hit Idle/Max. The session is
            // over — drop every local trace of it. Returning null (rather than throwing) lets
            // the guard and the interceptor treat this as "needs a new login".
            this.clearSession();
            return null;
        }
    }

    // ---------------------------------------------------------------------------------------
    // Logout and session teardown.
    // ---------------------------------------------------------------------------------------

    /**
     * RP-initiated logout. Clears the local state AND ends the session at Keycloak — deleting
     * only the Angular state would leave the SSO cookie alive, and the very next login() would
     * silently sign the same user back in without asking anything.
     */
    async logout(): Promise<void> {
        const idTokenHint = this.tokens?.idToken ?? null;
        this.clearSession();
        removeItem(SILENT_SSO_STORAGE_KEY);
        clearTransaction();

        if (!this.enabled) {
            return;
        }

        const parameters = new URLSearchParams({
            // Keycloak 18+ accepts the post-logout redirect when it is accompanied by either an
            // id_token_hint or a client_id, and only to a URI registered on that client.
            client_id: keycloakConfig.clientId,
            post_logout_redirect_uri: keycloakConfig.postLogoutRedirectUri,
        });
        if (idTokenHint) {
            parameters.set('id_token_hint', idTokenHint);
        }

        const logoutUrl = new URL(keycloakEndpoints.endSession);
        logoutUrl.search = parameters.toString();
        this.redirecting = true;
        window.location.assign(logoutUrl.toString());
    }

    /**
     * "This session is unusable — start a new login." Used when a refresh came back null while
     * the user was doing something that needs a token. Clears first, then redirects, so nothing
     * stale can be picked up by a listener in between.
     */
    async requireLogin(returnUrl: string = currentAppUrl()): Promise<void> {
        this.clearSession();
        await this.login(returnUrl);
    }

    /** Drops every token and claim from memory. Does not touch Keycloak. */
    clearSession(): void {
        this.tokens = null;
        this.sessionSignal.set(null);
    }

    // ---------------------------------------------------------------------------------------
    // Roles — UI only.
    // ---------------------------------------------------------------------------------------

    /**
     * Whether the current access token carries a role. Read from the token's claims:
     *   - realm roles from `realm_access.roles`
     *   - client roles from `resource_access[clientId].roles` (this app's own client id unless
     *     another one is passed)
     *
     * This is a rendering decision and nothing more. The backend re-checks the same roles from
     * the verified token on every call; an Angular check that says "yes" wrongly changes what is
     * drawn, never what is permitted. With the feature flag off it answers true so that
     * role-gated UI does not disappear when authentication is switched off.
     */
    hasRole(role: string, clientId: string = keycloakConfig.clientId): boolean {
        if (!this.enabled) {
            return true;
        }
        const session = this.sessionSignal();
        if (!session) {
            return false;
        }
        if (session.realmRoles.includes(role)) {
            return true;
        }
        return clientRolesOf(session.claims, clientId).includes(role);
    }

    // ---------------------------------------------------------------------------------------
    // Optional startup probe (keycloak.silentSsoOnStartup).
    // ---------------------------------------------------------------------------------------

    /**
     * Re-establishes the session after a reload without ever showing a login screen, by bouncing
     * once through Keycloak with prompt=none. Does nothing unless `silentSsoOnStartup` is on.
     * Runs at most once per tab (see SILENT_SSO_STORAGE_KEY) so that a realm without an SSO
     * session cannot turn into a redirect loop.
     */
    async restoreSessionSilently(): Promise<void> {
        if (!this.enabled || !keycloakConfig.silentSsoOnStartup) {
            return;
        }
        if (this.isAuthenticated() || isOnCallbackRoute()) {
            return;
        }
        if (readItem(SILENT_SSO_STORAGE_KEY)) {
            return;
        }
        writeItem(SILENT_SSO_STORAGE_KEY, '1');
        await this.login(currentAppUrl(), { prompt: 'none' });
    }

    // ---------------------------------------------------------------------------------------

    private applyTokenResponse(
        response: TokenEndpointResponse,
        previousRefreshToken: string | null = null,
    ): void {
        const claims = decodeJwtPayload(response.access_token);
        this.tokens = {
            accessToken: response.access_token,
            // REFRESH TOKEN ROTATION: Keycloak normally issues a new refresh token with every
            // renewal and invalidates the one just used. The new value replaces the old one here
            // and the old one is dropped on the spot — keeping it would guarantee an
            // invalid_grant on the next refresh. When the realm does not rotate, no
            // refresh_token comes back and the previous one stays in place.
            refreshToken: response.refresh_token ?? previousRefreshToken,
            idToken: response.id_token ?? this.tokens?.idToken ?? null,
            expiresAt: expiresAtFrom(response, claims),
            scope: response.scope ?? null,
        };
        this.sessionSignal.set(sessionFrom(claims));
    }
}

// -------------------------------------------------------------------------------------------
// Module-private helpers. Kept as functions rather than injectables: none of them need DI, and
// authentication should not grow a service graph of its own.
// -------------------------------------------------------------------------------------------

/** A token is treated as unusable once it is inside the 30s skew window. */
function isExpiringSoon(tokens: TokenSet): boolean {
    return tokens.expiresAt - TOKEN_EXPIRY_SKEW_MS <= Date.now();
}

function expiresAtFrom(response: TokenEndpointResponse, claims: KeycloakJwtClaims | null): number {
    if (typeof response.expires_in === 'number') {
        return Date.now() + response.expires_in * 1000;
    }
    // Keycloak always sends expires_in; the `exp` claim is a fallback, and a one-minute floor
    // guarantees the app never treats an unknown lifetime as "valid forever".
    if (typeof claims?.exp === 'number') {
        return claims.exp * 1000;
    }
    return Date.now() + 60_000;
}

function sessionFrom(claims: KeycloakJwtClaims | null): AuthSession {
    return {
        subject: claims?.sub ?? null,
        userName: claims?.preferred_username ?? null,
        displayName: claims?.name ?? claims?.preferred_username ?? null,
        email: claims?.email ?? null,
        realmRoles: realmRolesOf(claims),
        clientRoles: clientRolesOf(claims, keycloakConfig.clientId),
        claims,
    };
}

/**
 * POSTs to Keycloak's token endpoint with fetch, not HttpClient, on purpose: the token endpoint
 * must never pass through the auth interceptor (that would be circular), and this keeps the
 * whole authentication path free of Angular's HTTP stack.
 */
async function requestTokens(body: URLSearchParams): Promise<TokenEndpointResponse> {
    let response: Response;
    try {
        response = await fetch(keycloakEndpoints.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                Accept: 'application/json',
            },
            // URLSearchParams.toString() is already correct x-www-form-urlencoded.
            body: body.toString(),
            // A public client authenticates with PKCE or the refresh token, never with cookies.
            credentials: 'omit',
            cache: 'no-store',
        });
    } catch (cause) {
        // fetch only rejects on a network-level failure (offline, DNS, CORS, aborted).
        throw new AuthTransientError('Keycloak token endpoint could not be reached', cause);
    }

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
            error?: string;
            error_description?: string;
        } | null;
        throw new AuthTokenEndpointError(
            response.status,
            payload?.error ?? null,
            payload?.error_description ?? null,
        );
    }

    return (await response.json()) as TokenEndpointResponse;
}

/** Current Angular route, as the guard would express it, for use as a return URL. */
function currentAppUrl(): string {
    if (typeof window === 'undefined') {
        return '/';
    }
    return `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
}

function isOnCallbackRoute(): boolean {
    try {
        return window.location.pathname === new URL(keycloakConfig.redirectUri).pathname;
    } catch {
        return false;
    }
}

// sessionStorage throws in some privacy modes and is absent in non-browser contexts, so every
// access is guarded. Losing the transaction degrades to "callback rejected, log in again", which
// is exactly what the failure path already handles.
function writeTransaction(transaction: AuthTransaction): void {
    writeItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transaction));
}

function readTransaction(): AuthTransaction | null {
    const raw = readItem(TRANSACTION_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as AuthTransaction;
    } catch {
        return null;
    }
}

function clearTransaction(): void {
    removeItem(TRANSACTION_STORAGE_KEY);
}

function readItem(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeItem(key: string, value: string): void {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // Ignored on purpose — see the note above.
    }
}

function removeItem(key: string): void {
    try {
        sessionStorage.removeItem(key);
    } catch {
        // Ignored on purpose — see the note above.
    }
}
