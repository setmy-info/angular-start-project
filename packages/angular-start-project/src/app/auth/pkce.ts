// PKCE (RFC 7636), OAuth `state` and OIDC `nonce` primitives — built ONLY on the browser's
// Web Crypto API (crypto.getRandomValues + crypto.subtle.digest) and btoa/atob. No library.
//
// crypto.subtle exists only in a secure context (https:// or localhost). On a plain
// http://<lan-ip> origin it is undefined — the same restriction the geolocation example hits
// (see app.config.ts) — so createCodeChallenge() fails loudly instead of silently degrading to
// the `plain` challenge method, which Keycloak should not be asked to accept.

export interface PkcePair {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
}

// base64url = base64 with +/ swapped for -_ and the = padding removed (RFC 7515 §2). Both the
// code_challenge and every JWT segment use it.
export function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

// Cryptographically random, URL-safe token. 32 bytes -> 43 base64url characters, which is also
// exactly the minimum length RFC 7636 requires of a code_verifier (43..128).
export function randomUrlSafeString(byteLength = 32): string {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
}

export async function createCodeChallenge(codeVerifier: string): Promise<string> {
    if (!crypto?.subtle) {
        throw new Error(
            'Web Crypto (crypto.subtle) is unavailable — PKCE requires a secure context (https:// or localhost).',
        );
    }
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return base64UrlEncode(new Uint8Array(digest));
}

// One PKCE transaction. The verifier stays in the browser until the token request; only its
// SHA-256 hash (the challenge) travels in the authorization redirect, so an attacker who steals
// the authorization code out of the redirect URL still cannot exchange it for tokens.
export async function createPkcePair(): Promise<PkcePair> {
    const codeVerifier = randomUrlSafeString(32);
    return {
        codeVerifier,
        codeChallenge: await createCodeChallenge(codeVerifier),
        codeChallengeMethod: 'S256',
    };
}
