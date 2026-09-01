// Hostname → tenant resolver for multi-tenant deployments. One built SPA can serve several
// domains; each hostname maps to a tenant id (tenant1, tenant2, …). Extend HOSTNAME_TENANT
// when onboarding a new domain — the menu set and content JSON path follow the tenant id.
//
// On localhost / 127.0.0.1 only, localStorage key SMI_TENANT overrides the hostname default
// so developers can switch tenants without extra host aliases. Settings page exposes the same
// override. Production hostnames always use HOSTNAME_TENANT (override is ignored).

const TENANT1 = 'tenant1';
const TENANT2 = 'tenant2';

/** Fallback when the hostname is not listed (developer machine default). */
const DEFAULT_TENANT = TENANT1;

/** localStorage key for the localhost-only developer tenant override. */
const TENANT_STORAGE_KEY = 'SMI_TENANT';

const KNOWN_TENANTS = Object.freeze([TENANT1, TENANT2]);

const LOCAL_DEV_HOSTNAMES = Object.freeze(['localhost', '127.0.0.1']);

/**
 * Explicit hostname → tenant map. Keys are lower-case hostnames as returned by
 * `window.location.hostname` (no port, no path).
 */
const HOSTNAME_TENANT = Object.freeze({
    localhost: TENANT1,
    '127.0.0.1': TENANT1,
    // Local dev aliases — add to /etc/hosts: 127.0.0.1 tenant1.test tenant2.test
    'tenant1.test': TENANT1,
    'tenant2.test': TENANT2,
    // Template placeholders — replace with real production hostnames per project.
    'setmy.info': TENANT1,
    'www.setmy.info': TENANT1,
    'hearandseesystems.com': TENANT2,
    'www.hearandseesystems.com': TENANT2,
});

function isKnownTenant(value) {
    return typeof value === 'string' && KNOWN_TENANTS.includes(value);
}

function isLocalDevHostname(hostname) {
    return LOCAL_DEV_HOSTNAMES.includes((hostname || '').toLowerCase());
}

/**
 * Pure resolver (tests and tooling).
 * @param {string} hostname
 * @param {string|null|undefined} storageOverride validated tenant id from SMI_TENANT
 * @returns {string}
 */
function resolveTenant(hostname, storageOverride) {
    const host = (hostname || '').toLowerCase();
    if (isLocalDevHostname(host) && storageOverride && isKnownTenant(storageOverride)) {
        return storageOverride;
    }
    return HOSTNAME_TENANT[host] ?? DEFAULT_TENANT;
}

const systemsService = {
    TENANT1: TENANT1,
    TENANT2: TENANT2,
    DEFAULT_TENANT: DEFAULT_TENANT,
    TENANT_STORAGE_KEY: TENANT_STORAGE_KEY,
    KNOWN_TENANTS: KNOWN_TENANTS,
    LOCAL_DEV_HOSTNAMES: LOCAL_DEV_HOSTNAMES,
    HOSTNAME_TENANT: HOSTNAME_TENANT,

    isKnownTenant: isKnownTenant,
    isLocalDevHostname: isLocalDevHostname,
    resolveTenant: resolveTenant,

    /**
     * Hostname map only (ignores SMI_TENANT override).
     * @param {string} hostname
     * @returns {string}
     */
    getTenantForHostname: function (hostname) {
        return resolveTenant(hostname, null);
    },

    getTenantOverride: function () {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        const value = localStorage.getItem(TENANT_STORAGE_KEY)?.trim();
        return isKnownTenant(value) ? value : null;
    },

    setTenantOverride: function (tenant) {
        if (!isKnownTenant(tenant)) {
            throw new Error(
                `Invalid tenant "${tenant}". Allowed: ${KNOWN_TENANTS.join(', ')}.`,
            );
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(TENANT_STORAGE_KEY, tenant);
        }
    },

    clearTenantOverride: function () {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(TENANT_STORAGE_KEY);
        }
    },

    /**
     * Active tenant for the current browser location.
     * @returns {string}
     */
    getTenant: function () {
        if (typeof window === 'undefined' || !window.location) {
            return DEFAULT_TENANT;
        }
        return resolveTenant(window.location.hostname, this.getTenantOverride());
    },
};

module.exports = systemsService;
