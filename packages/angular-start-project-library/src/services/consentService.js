const STORAGE_KEY = 'consent';

const consentService = {
    hasConsented: function () {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return !!stored && JSON.parse(stored).forCookieUsage === true;
        } catch (e) {
            return false;
        }
    },
    grantConsent: function () {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({forCookieUsage: true}));
        } catch (e) {
            // storage unavailable (private browsing, disabled storage) — consent won't persist across reloads
        }
    },
    revokeConsent: function () {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({forCookieUsage: false}));
        } catch (e) {
            // storage unavailable (private browsing, disabled storage) — revocation won't persist across reloads
        }
    }
};

module.exports = consentService;
