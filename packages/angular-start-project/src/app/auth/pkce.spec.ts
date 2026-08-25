import {
    base64UrlDecode,
    base64UrlEncode,
    createCodeChallenge,
    createPkcePair,
    randomUrlSafeString,
} from './pkce';

describe('pkce', () => {
    it('round-trips bytes through base64url without padding or unsafe characters', () => {
        const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255, 62, 63]);
        const encoded = base64UrlEncode(bytes);

        expect(encoded).not.toContain('=');
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(Array.from(base64UrlDecode(encoded))).toEqual(Array.from(bytes));
    });

    // RFC 7636 Appendix B — the canonical S256 test vector. If this passes, the challenge this
    // app sends to Keycloak is computed exactly the way the spec requires.
    it('computes the RFC 7636 Appendix B code challenge', async () => {
        const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
        await expect(createCodeChallenge(verifier)).resolves.toBe(
            'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        );
    });

    it('creates a verifier within the RFC 7636 length range and an S256 challenge for it', async () => {
        const pair = await createPkcePair();

        expect(pair.codeVerifier.length).toBeGreaterThanOrEqual(43);
        expect(pair.codeVerifier.length).toBeLessThanOrEqual(128);
        expect(pair.codeChallengeMethod).toBe('S256');
        await expect(createCodeChallenge(pair.codeVerifier)).resolves.toBe(pair.codeChallenge);
    });

    it('never repeats a random value', () => {
        const values = new Set(Array.from({ length: 50 }, () => randomUrlSafeString(16)));
        expect(values.size).toBe(50);
    });
});
