import { base64UrlDecode } from './pkce';

// Reading claims out of a Keycloak JWT, for UI purposes ONLY.
//
// NOTHING here validates anything. The payload is base64url-decoded and parsed; the signature is
// not checked, and cannot be meaningfully checked in a browser that also holds the token. Treat
// every value below as a display hint:
//   - hasRole() decides whether to render a menu entry, not whether an operation is allowed.
//   - The API gateway / backend performs the authoritative validation (signature, issuer,
//     audience, expiry, roles) on every request. If Angular's view of the roles is wrong, the
//     backend answers 403 and the UI is simply out of step — nothing is bypassed.
// Signature validation is deliberately NOT implemented here (see README.md "Keycloak
// authentication -> Roles are a UI concern").

export interface KeycloakJwtClaims {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    iat?: number;
    azp?: string;
    nonce?: string;
    session_state?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    email?: string;
    email_verified?: boolean;
    // Realm roles — Keycloak puts them here for every client in the realm.
    realm_access?: { roles?: string[] };
    // Client ("resource") roles, keyed by client id, e.g. resource_access['angular-start-project'].
    resource_access?: Record<string, { roles?: string[] }>;
}

// Returns null for anything that is not a well-formed three-segment JWT with JSON in the middle.
// A malformed token is treated as "no claims", never as an exception thrown at a caller.
export function decodeJwtPayload(token: string): KeycloakJwtClaims | null {
    if (!token) {
        return null;
    }
    const segments = token.split('.');
    if (segments.length !== 3) {
        return null;
    }
    try {
        // TextDecoder, not atob alone: usernames and names are UTF-8 (õ, ä, ö, ü).
        const json = new TextDecoder().decode(base64UrlDecode(segments[1]));
        return JSON.parse(json) as KeycloakJwtClaims;
    } catch {
        return null;
    }
}

// Realm roles: token.realm_access.roles — a flat list of role names granted realm-wide.
export function realmRolesOf(claims: KeycloakJwtClaims | null): string[] {
    return claims?.realm_access?.roles ?? [];
}

// Client roles: token.resource_access[<clientId>].roles — roles defined ON one client.
// Keycloak only includes these when the client has roles assigned and the scope allows them.
export function clientRolesOf(claims: KeycloakJwtClaims | null, clientId: string): string[] {
    return claims?.resource_access?.[clientId]?.roles ?? [];
}
