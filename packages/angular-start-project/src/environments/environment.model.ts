// Keycloak / OpenID Connect settings for the Authorization Code Flow with PKCE.
//
// The Angular app is a PUBLIC OIDC client: it never holds a client secret, so every one of
// these values is safe to ship in the bundle. Security is enforced by Keycloak (which checks
// the PKCE code_verifier and the registered redirect URIs) and by the API gateway / backend
// (which validates the JWT signature). See README.md "Keycloak authentication".
export interface KeycloakEnvironmentConfig {
    // FEATURE FLAG. The single boolean that switches the whole Keycloak enhancement on or off.
    // false  -> AuthService.login()/refresh() are no-ops, the HTTP interceptor attaches nothing,
    //           authGuard lets every route through and hasRole() answers true, so role-gated UI
    //           stays visible. The app behaves exactly as it did before Keycloak existed.
    // true   -> the full Authorization Code + PKCE flow described in README.md.
    enabled: boolean;
    // Keycloak server base URL WITHOUT the /realms/... part, no trailing slash,
    // e.g. 'https://keycloak.example.com'. The OIDC issuer is derived as
    // `${issuer}/realms/${realm}` — see auth/auth.config.ts, the only place URLs are built.
    issuer: string;
    realm: string;
    // Public client id as registered in the realm ("Client authentication" OFF in Keycloak).
    clientId: string;
    // Absolute URL, must be listed in the client's "Valid redirect URIs". Its path has to be a
    // real Angular route (see app.routes.ts -> 'auth/callback').
    redirectUri: string;
    // Absolute URL, must be listed in the client's "Valid post logout redirect URIs".
    postLogoutRedirectUri: string;
    // 'openid' is required by OIDC; the rest is what the app wants in the token.
    scopes: string[];
    // Optional: on a cold page load with no tokens in memory, bounce once through Keycloak with
    // prompt=none to pick up an existing SSO session without showing anything to the user. Off by
    // default — the route guard already does this on demand for protected routes.
    silentSsoOnStartup: boolean;
    // URL prefixes that receive the `Authorization: Bearer` header. Anything not matching one of
    // these (including every Keycloak URL) is sent untouched — tokens must never leak to a
    // third-party host. Relative prefixes are resolved against document.baseURI.
    protectedResourceUrls: string[];
}

export interface Environment {
    envName: 'local' | 'dev' | 'ci' | 'test' | 'prelive' | 'live';
    production: boolean;
    apiBaseUrl: string;
    keycloak: KeycloakEnvironmentConfig;
}
