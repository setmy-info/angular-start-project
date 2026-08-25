import { clientRolesOf, decodeJwtPayload, realmRolesOf } from './jwt';
import { base64UrlEncode } from './pkce';

function encodeSegment(value: object): string {
    return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

// Signature is a placeholder: nothing in the app verifies it, on purpose (see jwt.ts).
function makeJwt(claims: object): string {
    return `${encodeSegment({ alg: 'RS256', typ: 'JWT' })}.${encodeSegment(claims)}.signature`;
}

describe('jwt claim reading', () => {
    it('decodes a UTF-8 payload', () => {
        const token = makeJwt({ preferred_username: 'imre', name: 'Imre Tabur õäöü' });
        expect(decodeJwtPayload(token)?.name).toBe('Imre Tabur õäöü');
    });

    it('reads realm roles from realm_access.roles', () => {
        const claims = decodeJwtPayload(makeJwt({ realm_access: { roles: ['user', 'admin'] } }));
        expect(realmRolesOf(claims)).toEqual(['user', 'admin']);
    });

    it('reads client roles from resource_access[clientId].roles', () => {
        const claims = decodeJwtPayload(
            makeJwt({ resource_access: { 'angular-start-project': { roles: ['editor'] } } }),
        );
        expect(clientRolesOf(claims, 'angular-start-project')).toEqual(['editor']);
        expect(clientRolesOf(claims, 'other-client')).toEqual([]);
    });

    it('answers with empty lists rather than throwing when the claims are absent', () => {
        const claims = decodeJwtPayload(makeJwt({}));
        expect(realmRolesOf(claims)).toEqual([]);
        expect(clientRolesOf(claims, 'angular-start-project')).toEqual([]);
    });

    it('returns null for anything that is not a JWT', () => {
        expect(decodeJwtPayload('not-a-jwt')).toBeNull();
        expect(decodeJwtPayload('a.b.c')).toBeNull();
        expect(decodeJwtPayload('')).toBeNull();
    });
});
