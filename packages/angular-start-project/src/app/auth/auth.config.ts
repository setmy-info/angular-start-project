import { environment } from '../../environments/environment';
import { KeycloakEnvironmentConfig } from '../../environments/environment.model';

// The ONE place Keycloak URLs are assembled. Everything else (service, interceptor, guard,
// callback component) asks this module, so re-pointing the app at another Keycloak server or
// realm is an environment-file change only — no URL is hard-coded anywhere else.

export const keycloakConfig: KeycloakEnvironmentConfig = environment.keycloak;

export interface KeycloakEndpoints {
    // OIDC issuer identifier — also the `iss` claim value Keycloak puts in its tokens.
    issuerUrl: string;
    authorization: string;
    token: string;
    // RP-initiated logout (OIDC front-channel logout endpoint).
    endSession: string;
    userInfo: string;
}

function withoutTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

export function buildKeycloakEndpoints(config: KeycloakEnvironmentConfig): KeycloakEndpoints {
    const issuerUrl = `${withoutTrailingSlash(config.issuer)}/realms/${encodeURIComponent(config.realm)}`;
    const openidConnect = `${issuerUrl}/protocol/openid-connect`;
    return {
        issuerUrl,
        authorization: `${openidConnect}/auth`,
        token: `${openidConnect}/token`,
        endSession: `${openidConnect}/logout`,
        userInfo: `${openidConnect}/userinfo`,
    };
}

export const keycloakEndpoints: KeycloakEndpoints = buildKeycloakEndpoints(keycloakConfig);

// Access tokens are treated as unusable this long before their real expiry, so a request never
// leaves the browser with a token that expires while it is in flight.
export const TOKEN_EXPIRY_SKEW_MS = 30_000;

// Decides whether a request may carry the bearer token.
//
// Two rules, in this order:
//   1. NEVER to Keycloak. The authorization/token/logout endpoints authenticate with the PKCE
//      verifier or the refresh token; adding an access token there is pointless and leaks it into
//      the identity provider's request logs.
//   2. Otherwise only to a configured protectedResourceUrls prefix. Anything else — a CDN, a
//      public JSON file under public/json, a third-party API — is sent untouched.
export function isProtectedResourceUrl(
    url: string,
    config: KeycloakEnvironmentConfig = keycloakConfig,
    endpoints: KeycloakEndpoints = keycloakEndpoints,
): boolean {
    const absolute = toAbsoluteUrl(url);
    if (!absolute) {
        return false;
    }
    if (config.issuer && absolute.startsWith(withoutTrailingSlash(config.issuer))) {
        return false;
    }
    if (absolute.startsWith(endpoints.issuerUrl)) {
        return false;
    }
    return config.protectedResourceUrls.some((prefix) => {
        const absolutePrefix = toAbsoluteUrl(prefix);
        return !!absolutePrefix && absolute.startsWith(absolutePrefix);
    });
}

// Relative request URLs ('rest/pages/1', the library's resource layer style) are resolved against
// the document base so that the prefix comparison above is done on like for like.
function toAbsoluteUrl(url: string): string | null {
    try {
        const base = typeof document !== 'undefined' ? document.baseURI : undefined;
        return new URL(url, base).href;
    } catch {
        return null;
    }
}
