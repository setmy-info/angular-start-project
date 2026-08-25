import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { keycloakConfig, keycloakEndpoints } from './auth.config';
import { base64UrlEncode } from './pkce';

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

function runGuard(url = '/profile'): Promise<boolean> {
    return TestBed.runInInjectionContext(
        () =>
            authGuard(
                {} as ActivatedRouteSnapshot,
                { url } as RouterStateSnapshot,
            ) as Promise<boolean>,
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

describe('authGuard', () => {
    it('lets everything through when the feature flag is off', async () => {
        keycloakConfig.enabled = false;

        await expect(runGuard()).resolves.toBe(true);
        expect(assignMock).not.toHaveBeenCalled();
    });

    it('allows navigation for a live session', async () => {
        await signIn(TestBed.inject(AuthService));

        await expect(runGuard()).resolves.toBe(true);
        expect(assignMock).not.toHaveBeenCalled();
    });

    // Access-token lifetime is ~5 minutes; the SSO session lives for weeks. Hitting a protected
    // route with a stale access token must renew silently, never show a login screen.
    it('renews an expired access token without a login screen', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse()));

        await expect(runGuard()).resolves.toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(assignMock).not.toHaveBeenCalled();
    });

    it('sends an anonymous visitor to Keycloak, remembering the route they wanted', async () => {
        TestBed.inject(AuthService);

        await expect(runGuard('/profile?tab=roles')).resolves.toBe(false);

        expect(assignMock).toHaveBeenCalledTimes(1);
        expect(assignMock.mock.calls[0][0]).toContain(keycloakEndpoints.authorization);
        const stored = JSON.parse(sessionStorage.getItem('angularStartProject.auth.transaction'));
        expect(stored.returnUrl).toBe('/profile?tab=roles');
    });

    // SSO Session Idle/Max expired at Keycloak: clear the unusable tokens, then log in again.
    it('clears a dead session and redirects to Keycloak', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'invalid_grant' }),
        } as Response);

        await expect(runGuard()).resolves.toBe(false);
        expect(service.isAuthenticated()).toBe(false);
        expect(assignMock).toHaveBeenCalledTimes(1);
    });

    it('does not throw the user out when Keycloak is unreachable', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(runGuard()).resolves.toBe(true);
        expect(service.isAuthenticated()).toBe(true);
        expect(assignMock).not.toHaveBeenCalled();
    });
});
