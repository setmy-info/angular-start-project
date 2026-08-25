// Translation strings live in static JSON under public/json/<lang>.json (same URL shape the old
// has-web-app-new-ng app used: `json/<lang>.json`), not in this file. This service only knows how
// to load them: check public/json/translations-version.json, compare against the version cached
// alongside the translations in localStorage, and only re-fetch the (larger) translations file
// when the version actually changed — otherwise the cached copy is reused as-is. Swapping the two
// `fetch()` calls below for REST endpoints later (e.g. GET /api/translations/<lang>/version and
// GET /api/translations/<lang>) is a drop-in change; every caller only sees getSupportedLanguages,
// getCachedTranslations, and loadTranslations.

const SUPPORTED_LANGUAGES = [
    { code: 'et', label: 'ET' },
    { code: 'en', label: 'EN' },
];

const TRANSLATIONS_CACHE_KEY_PREFIX = 'translations.';
const TRANSLATIONS_VERSION_CACHE_KEY = 'translations.version';
// Selected-language persistence — same localStorage key the old app's languageService.js used.
const LANG_STORAGE_KEY = 'LANG';

function readCachedVersions() {
    try {
        return JSON.parse(localStorage.getItem(TRANSLATIONS_VERSION_CACHE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function writeCachedVersions(versions) {
    try {
        localStorage.setItem(TRANSLATIONS_VERSION_CACHE_KEY, JSON.stringify(versions));
    } catch (e) {
        // storage unavailable (private browsing, disabled storage) — falls back to re-fetching every time
    }
}

function readCachedTranslations(lang) {
    try {
        const raw = localStorage.getItem(TRANSLATIONS_CACHE_KEY_PREFIX + lang);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeCachedTranslations(lang, translations) {
    try {
        localStorage.setItem(TRANSLATIONS_CACHE_KEY_PREFIX + lang, JSON.stringify(translations));
    } catch (e) {
        // storage unavailable — translations still work for this page load, just not cached for next time
    }
}

const translationService = {
    getSupportedLanguages: function () {
        return SUPPORTED_LANGUAGES.slice();
    },

    // Persisted language choice (localStorage LANG, like the old app): returns the stored code
    // when it is still a supported language, otherwise the first supported one.
    getStoredLanguage: function () {
        let stored = null;
        try {
            stored = localStorage.getItem(LANG_STORAGE_KEY);
        } catch (e) {
            // storage unavailable — fall through to the default
        }
        const supported = SUPPORTED_LANGUAGES.some(function (lang) {
            return lang.code === stored;
        });
        return supported ? stored : SUPPORTED_LANGUAGES[0] && SUPPORTED_LANGUAGES[0].code;
    },

    storeLanguage: function (code) {
        try {
            localStorage.setItem(LANG_STORAGE_KEY, code);
        } catch (e) {
            // storage unavailable — choice won't survive a reload
        }
    },

    // Synchronous read of whatever is already cached, for first paint before loadTranslations()
    // resolves. Falls back to an empty object — same "missing key renders as the key itself"
    // behaviour the app already has for any unknown translation key.
    getCachedTranslations: function (lang) {
        return readCachedTranslations(lang) || {};
    },

    // Resolves with the translations to use for `lang`: reuses the cached copy when the version
    // marker hasn't changed, otherwise fetches the fresh JSON and updates the cache + version.
    loadTranslations: function (lang) {
        return fetch('json/translations-version.json')
            .then(function (response) {
                return response.json();
            })
            .then(function (remoteVersions) {
                const remoteVersion = remoteVersions[lang];
                const cachedTranslations = readCachedTranslations(lang);
                const cachedVersions = readCachedVersions();
                if (cachedTranslations && cachedVersions[lang] === remoteVersion) {
                    return cachedTranslations;
                }
                return fetch('json/' + lang + '.json')
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (translations) {
                        writeCachedTranslations(lang, translations);
                        cachedVersions[lang] = remoteVersion;
                        writeCachedVersions(cachedVersions);
                        return translations;
                    });
            })
            .catch(function () {
                // offline, or the version/translations request failed — reuse whatever is cached
                return readCachedTranslations(lang) || {};
            });
    },
};

module.exports = translationService;
