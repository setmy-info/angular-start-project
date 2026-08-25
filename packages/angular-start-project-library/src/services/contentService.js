// Per-tenant content loader — the new-solution equivalent of the old library's pagesService.js
// (which fetched json/content/<system>/<lang>.json and filled modelService.system, including all
// contact page data). Uses the same version-checked localStorage cache pattern as
// translationService.js: json/content/versions.json is always fetched (small), the full content
// file only when its version changed; offline/errors fall back to the cached copy. Goes through
// resourceFactory (see resourceFactory.js) so a REST backend swap is a one-file change.
const resourceFactory = require('../resources/resourceFactory');

const CONTENT_CACHE_KEY_PREFIX = 'content.';
const CONTENT_VERSION_CACHE_KEY = 'content.version';

const resource = resourceFactory.newResource();

function cacheKey(tenant, lang) {
    return CONTENT_CACHE_KEY_PREFIX + tenant + '.' + lang;
}

function readCachedVersions() {
    try {
        return JSON.parse(localStorage.getItem(CONTENT_VERSION_CACHE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function writeCachedVersions(versions) {
    try {
        localStorage.setItem(CONTENT_VERSION_CACHE_KEY, JSON.stringify(versions));
    } catch (e) {
        // storage unavailable — falls back to re-fetching every time
    }
}

function readCachedContent(tenant, lang) {
    try {
        const raw = localStorage.getItem(cacheKey(tenant, lang));
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeCachedContent(tenant, lang, content) {
    try {
        localStorage.setItem(cacheKey(tenant, lang), JSON.stringify(content));
    } catch (e) {
        // storage unavailable — content still works for this page load, just not cached
    }
}

const contentService = {
    // Synchronous read of whatever is already cached, for first paint.
    getCachedContent: function (tenant, lang) {
        return readCachedContent(tenant, lang) || {};
    },

    loadContent: function (tenant, lang) {
        const versionKey = tenant + '.' + lang;
        return resource
            .getJson('content/versions.json')
            .then(function (remoteVersions) {
                const remoteVersion = remoteVersions[versionKey];
                const cachedContent = readCachedContent(tenant, lang);
                const cachedVersions = readCachedVersions();
                if (cachedContent && cachedVersions[versionKey] === remoteVersion) {
                    return cachedContent;
                }
                return resource
                    .getJson('content/' + tenant + '/' + lang + '.json')
                    .then(function (content) {
                        writeCachedContent(tenant, lang, content);
                        cachedVersions[versionKey] = remoteVersion;
                        writeCachedVersions(cachedVersions);
                        return content;
                    });
            })
            .catch(function () {
                return readCachedContent(tenant, lang) || {};
            });
    },
};

module.exports = contentService;
