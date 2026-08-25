import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AuthService } from './auth.service';
import { AuthTransientError } from './auth.model';
import { keycloakConfig, keycloakEndpoints } from './auth.config';
import { base64UrlEncode } from './pkce';

// ------------------------------------------------------------------------------------------
// Test doubles. Nothing here talks to a real Keycloak — the point of these tests is to pin the
// protocol details and the concurrency behaviour that cannot be eyeballed.
// ------------------------------------------------------------------------------------------

function makeJwt(claims: object): string {
    const segment = (value: object) =>
        base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
    return `${segment({ alg: 'RS256' })}.${segment(claims)}.signature`;
}

function tokenResponse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        access_token: makeJwt({
            preferred_username: 'imre',
            name: 'Imre Tabur',
            email: 'imre.tabur@mail.ee',
            realm_access: { roles: ['user'] },
            resource_access: { 'angular-start-project': { roles: ['editor'] } },
        }),
        refresh_token: 'refresh-1',
        id_token: makeJwt({ nonce: 'test-nonce' }),
        token_type: 'Bearer',
        expires_in: 300,
        ...overrides,
    };
}

function okResponse(body: unknown): Response {
    return { ok: true, status: 200, json: async () => body } as Response;
}

function errorResponse(status: number, body: unknown): Response {
    return { ok: false, status, json: async () => body } as Response;
}

// The transaction AuthService stores before redirecting. Writing it directly lets a test enter
// handleCallback() without going through a real browser redirect.
function seedTransaction(overrides: Record<string, unknown> = {}): void {
    sessionStorage.setItem(
        'angularStartProject.auth.transaction',
        JSON.stringify({
            state: 'test-state',
            nonce: 'test-nonce',
            codeVerifier: 'test-verifier',
            returnUrl: '/profile',
            createdAt: Date.now(),
            ...overrides,
        }),
    );
}

function callbackUrl(query: string): string {
    return `${keycloakConfig.redirectUri}?${query}`;
}

async function signIn(service: AuthService, response = tokenResponse()): Promise<void> {
    seedTransaction();
    fetchMock.mockResolvedValueOnce(okResponse(response));
    const result = await service.handleCallback(callbackUrl('code=auth-code&state=test-state'));
    expect(result.ok).toBe(true);
}

let fetchMock: ReturnType<typeof vi.fn>;
let assignMock: ReturnType<typeof vi.fn>;
let originalEnabled: boolean;
let originalLocation: PropertyDescriptor | undefined;

beforeEach(() => {
    originalEnabled = keycloakConfig.enabled;
    // The feature flag ships OFF; these tests exercise the ON behaviour.
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

// ------------------------------------------------------------------------------------------

describe('AuthService feature flag', () => {
    it('does nothing at all when keycloak.enabled is false', async () => {
        keycloakConfig.enabled = false;
        const service = TestBed.inject(AuthService);

        await service.login('/profile');

        expect(service.enabled).toBe(false);
        expect(assignMock).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
        await expect(service.getAccessToken()).resolves.toBeNull();
        await expect(service.refresh()).resolves.toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        // Role-gated UI must stay visible when authentication is switched off.
        expect(service.hasRole('admin')).toBe(true);
    });
});

describe('AuthService.login', () => {
    it('redirects to Keycloak with a PKCE S256 challenge and stores the transaction', async () => {
        const service = TestBed.inject(AuthService);

        await service.login('/profile');

        expect(assignMock).toHaveBeenCalledTimes(1);
        const url = new URL(assignMock.mock.calls[0][0] as string);
        expect(url.origin + url.pathname).toBe(keycloakEndpoints.authorization);
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('client_id')).toBe(keycloakConfig.clientId);
        expect(url.searchParams.get('redirect_uri')).toBe(keycloakConfig.redirectUri);
        expect(url.searchParams.get('scope')).toBe(keycloakConfig.scopes.join(' '));
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('code_challenge')).toBeTruthy();
        // No secret ever leaves the app, and the verifier stays behind.
        expect(url.searchParams.get('client_secret')).toBeNull();
        expect(url.searchParams.get('code_verifier')).toBeNull();

        const stored = JSON.parse(sessionStorage.getItem('angularStartProject.auth.transaction'));
        expect(stored.state).toBe(url.searchParams.get('state'));
        expect(stored.nonce).toBe(url.searchParams.get('nonce'));
        expect(stored.returnUrl).toBe('/profile');
        expect(stored.codeVerifier.length).toBeGreaterThanOrEqual(43);
    });

    it('adds prompt=none only when asked for a silent probe', async () => {
        const service = TestBed.inject(AuthService);

        await service.login('/profile', { prompt: 'none' });

        const url = new URL(assignMock.mock.calls[0][0] as string);
        expect(url.searchParams.get('prompt')).toBe('none');
    });

    it('starts one redirect even if called twice', async () => {
        const service = TestBed.inject(AuthService);

        await Promise.all([service.login('/a'), service.login('/b')]);

        expect(assignMock).toHaveBeenCalledTimes(1);
    });
});

describe('AuthService.handleCallback', () => {
    it('exchanges the code for tokens and exposes the claims', async () => {
        const service = TestBed.inject(AuthService);
        seedTransaction();
        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse()));

        const result = await service.handleCallback(callbackUrl('code=auth-code&state=test-state'));

        expect(result).toEqual({ ok: true, returnUrl: '/profile' });
        expect(service.isAuthenticated()).toBe(true);
        expect(service.userName()).toBe('imre');
        expect(service.roles()).toEqual(['user']);
        expect(service.hasRole('user')).toBe(true);
        expect(service.hasRole('editor')).toBe(true); // client role of this client id
        expect(service.hasRole('admin')).toBe(false);

        const [url, request] = fetchMock.mock.calls[0];
        expect(url).toBe(keycloakEndpoints.token);
        expect(request.method).toBe('POST');
        expect(request.headers['Content-Type']).toContain('application/x-www-form-urlencoded');
        const body = new URLSearchParams(request.body as string);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('code')).toBe('auth-code');
        expect(body.get('code_verifier')).toBe('test-verifier');
        expect(body.get('redirect_uri')).toBe(keycloakConfig.redirectUri);
        expect(body.get('client_secret')).toBeNull();
    });

    it('refuses a callback whose state does not match — never requesting a token', async () => {
        const service = TestBed.inject(AuthService);
        seedTransaction();

        const result = await service.handleCallback(
            callbackUrl('code=auth-code&state=forged-state'),
        );

        expect(result).toMatchObject({ ok: false, reason: 'state_mismatch' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(service.isAuthenticated()).toBe(false);
    });

    it('refuses a callback with no stored transaction', async () => {
        const service = TestBed.inject(AuthService);

        const result = await service.handleCallback(callbackUrl('code=auth-code&state=test-state'));

        expect(result).toMatchObject({ ok: false, reason: 'missing_transaction' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reports an OIDC error response from Keycloak', async () => {
        const service = TestBed.inject(AuthService);
        seedTransaction();

        const result = await service.handleCallback(
            callbackUrl('error=login_required&error_description=No+session&state=test-state'),
        );

        expect(result).toMatchObject({
            ok: false,
            reason: 'provider_error',
            error: 'login_required',
            errorDescription: 'No session',
            returnUrl: '/profile',
        });
    });

    it('rejects an id_token whose nonce was not the one requested', async () => {
        const service = TestBed.inject(AuthService);
        seedTransaction();
        fetchMock.mockResolvedValueOnce(
            okResponse(tokenResponse({ id_token: makeJwt({ nonce: 'someone-elses-nonce' }) })),
        );

        const result = await service.handleCallback(callbackUrl('code=auth-code&state=test-state'));

        expect(result).toMatchObject({ ok: false, reason: 'nonce_mismatch' });
        expect(service.isAuthenticated()).toBe(false);
    });

    it('consumes the transaction so a replayed callback cannot be used twice', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);

        expect(sessionStorage.getItem('angularStartProject.auth.transaction')).toBeNull();
    });
});

describe('AuthService token renewal', () => {
    it('reuses a token that is comfortably inside its lifetime', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);
        fetchMock.mockClear();

        await service.getAccessToken();
        await service.getAccessToken();

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('renews a token with less than 30 seconds left', async () => {
        const service = TestBed.inject(AuthService);
        // 20s of life: already inside the 30s skew window, so it counts as expired.
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce(
            okResponse(tokenResponse({ access_token: makeJwt({ preferred_username: 'renewed' }) })),
        );

        await service.getAccessToken();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = new URLSearchParams(fetchMock.mock.calls[0][1].body as string);
        expect(body.get('grant_type')).toBe('refresh_token');
        expect(service.userName()).toBe('renewed');
    });

    // The single-flight guarantee, stated as a test: N simultaneous consumers, 1 request.
    it('performs ONE refresh for many concurrent callers and gives them all the same token', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();

        let releaseRefresh: (value: Response) => void;
        const pending = new Promise<Response>((resolve) => {
            releaseRefresh = resolve;
        });
        fetchMock.mockReturnValueOnce(pending);

        const waiting = Promise.all([
            service.getAccessToken(),
            service.getAccessToken(),
            service.getAccessToken(),
            service.getAccessToken(),
            service.getAccessToken(),
        ]);

        const renewed = tokenResponse({ access_token: makeJwt({ preferred_username: 'single' }) });
        releaseRefresh(okResponse(renewed));
        const tokens = await waiting;

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(new Set(tokens).size).toBe(1);
        expect(tokens[0]).toBe(renewed['access_token']);
    });

    it('releases the latch so a later expiry refreshes again', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();

        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse({ expires_in: 20 })));
        await service.getAccessToken();
        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse({ expires_in: 300 })));
        await service.getAccessToken();

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('rotates the refresh token, sending the newest one on the next renewal', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20, refresh_token: 'refresh-1' }));
        fetchMock.mockClear();

        fetchMock.mockResolvedValueOnce(
            okResponse(tokenResponse({ expires_in: 20, refresh_token: 'refresh-2' })),
        );
        await service.getAccessToken();
        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse({ expires_in: 300 })));
        await service.getAccessToken();

        const firstBody = new URLSearchParams(fetchMock.mock.calls[0][1].body as string);
        const secondBody = new URLSearchParams(fetchMock.mock.calls[1][1].body as string);
        expect(firstBody.get('refresh_token')).toBe('refresh-1');
        // The rotated token replaced the old one; reusing refresh-1 would be invalid_grant.
        expect(secondBody.get('refresh_token')).toBe('refresh-2');
    });

    it('keeps the previous refresh token when the realm does not rotate', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20, refresh_token: 'refresh-1' }));
        fetchMock.mockClear();

        const withoutRotation = tokenResponse({ expires_in: 20 });
        delete withoutRotation['refresh_token'];
        fetchMock.mockResolvedValueOnce(okResponse(withoutRotation));
        await service.getAccessToken();
        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse({ expires_in: 300 })));
        await service.getAccessToken();

        const secondBody = new URLSearchParams(fetchMock.mock.calls[1][1].body as string);
        expect(secondBody.get('refresh_token')).toBe('refresh-1');
    });
});

describe('AuthService refresh failures', () => {
    it('clears the session when Keycloak says the refresh token is dead (SSO session over)', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce(
            errorResponse(400, { error: 'invalid_grant', error_description: 'Session not active' }),
        );

        await expect(service.getAccessToken()).resolves.toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(service.session()).toBeNull();
    });

    it('keeps the session intact when the network fails during a refresh', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(service.getAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
        // Nothing was corrupted: the user is still signed in and a later attempt can succeed.
        expect(service.isAuthenticated()).toBe(true);

        fetchMock.mockResolvedValueOnce(okResponse(tokenResponse({ expires_in: 300 })));
        await expect(service.getAccessToken()).resolves.toBeTruthy();
    });

    it('treats a Keycloak 5xx as transient rather than as a logout', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service, tokenResponse({ expires_in: 20 }));
        fetchMock.mockClear();
        fetchMock.mockResolvedValueOnce(errorResponse(503, { error: 'temporarily_unavailable' }));

        await expect(service.getAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
        expect(service.isAuthenticated()).toBe(true);
    });
});

describe('AuthService.logout', () => {
    it('ends the Keycloak session, not just the local one', async () => {
        const service = TestBed.inject(AuthService);
        await signIn(service);

        await service.logout();

        expect(service.isAuthenticated()).toBe(false);
        const url = new URL(assignMock.mock.calls[0][0] as string);
        expect(url.origin + url.pathname).toBe(keycloakEndpoints.endSession);
        expect(url.searchParams.get('client_id')).toBe(keycloakConfig.clientId);
        expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
            keycloakConfig.postLogoutRedirectUri,
        );
        expect(url.searchParams.get('id_token_hint')).toBeTruthy();
    });
});
