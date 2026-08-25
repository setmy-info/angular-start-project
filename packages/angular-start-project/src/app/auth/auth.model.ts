import { KeycloakJwtClaims } from './jwt';

// Everything Keycloak handed back, kept in RUNTIME MEMORY ONLY (see auth.service.ts).
export interface TokenSet {
    accessToken: string;
    // May be absent if the realm/client is configured without refresh tokens; the app then simply
    // cannot renew and falls back to a redirect through Keycloak's SSO session.
    refreshToken: string | null;
    // Kept solely as the `id_token_hint` for RP-initiated logout.
    idToken: string | null;
    // Absolute epoch milliseconds, computed once from `expires_in` at the moment of the response.
    expiresAt: number;
    scope: string | null;
}

// The UI-facing projection of the access token's claims. Signals expose this, never the raw token.
export interface AuthSession {
    subject: string | null;
    userName: string | null;
    displayName: string | null;
    email: string | null;
    realmRoles: string[];
    clientRoles: string[];
    claims: KeycloakJwtClaims | null;
}

// Raw token endpoint response (RFC 6749 §5.1 plus Keycloak's extras).
export interface TokenEndpointResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    scope?: string;
    session_state?: string;
}

// What survives the redirect to Keycloak and back. Stored in sessionStorage — see auth.service.ts
// for why this one thing is persisted while tokens are not.
export interface AuthTransaction {
    state: string;
    nonce: string;
    codeVerifier: string;
    // Angular route to return to after a successful login.
    returnUrl: string;
    createdAt: number;
}

export type CallbackFailureReason =
    // Keycloak answered the authorization request with ?error=... (access_denied,
    // login_required from a prompt=none probe, invalid_scope, ...).
    | 'provider_error'
    // No ?code / ?state in the URL — the callback route was opened directly.
    | 'invalid_response'
    // No stored transaction (sessionStorage cleared, other tab, page restored from bfcache).
    | 'missing_transaction'
    // The returned `state` does not match the one generated locally: CSRF / session fixation
    // attempt, or a stale callback. Never exchanged for tokens.
    | 'state_mismatch'
    // id_token's `nonce` claim does not match — replayed id_token.
    | 'nonce_mismatch'
    // The token endpoint refused the code exchange or was unreachable.
    | 'token_request_failed';

export interface CallbackSuccess {
    ok: true;
    returnUrl: string;
}

export interface CallbackFailure {
    ok: false;
    reason: CallbackFailureReason;
    // Keycloak's `error` / `error_description` where it supplied them.
    error: string | null;
    errorDescription: string | null;
    returnUrl: string;
}

export type CallbackResult = CallbackSuccess | CallbackFailure;

// Explicit type guard rather than relying on `if (result.ok)`: this app compiles with
// strictNullChecks off (see tsconfig.json), where discriminated-union narrowing on a boolean
// literal is not applied.
export function isCallbackFailure(result: CallbackResult): result is CallbackFailure {
    return !result.ok;
}

// Distinguishes "the network/Keycloak hiccuped, the session is probably still fine" from
// "Keycloak rejected the refresh token, the session is over". Only the second one clears state.
export class AuthTransientError extends Error {
    constructor(
        message: string,
        override readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'AuthTransientError';
    }
}

// Keycloak answered the token endpoint with a non-2xx status. `error` is the OAuth error code
// ('invalid_grant' when the refresh token is expired, revoked, already used after rotation, or
// the SSO session hit its max lifetime).
export class AuthTokenEndpointError extends Error {
    constructor(
        readonly status: number,
        readonly error: string | null,
        readonly errorDescription: string | null,
    ) {
        super(`Keycloak token endpoint returned ${status}${error ? ` (${error})` : ''}`);
        this.name = 'AuthTokenEndpointError';
    }

    // 5xx and 429 say nothing about the session — Keycloak was simply unable to answer, so the
    // tokens must be kept and the caller must retry later rather than log the user out.
    isTransient(): boolean {
        return this.status >= 500 || this.status === 429;
    }
}
