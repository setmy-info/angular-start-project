// App-version newness check: compares the running build's version stamp (src/app/config/version.ts,
// see missing-functionality.md item 1) against the version stored in localStorage from the
// previous visit. First call persists the current version and caches the result for the rest of
// the page load, so "is this a new version?" stays answerable (Settings page, startup log) without
// re-triggering.
const VERSION_STORAGE_KEY = 'appVersion';

let state = null;

const versionService = {
    // Returns {version, previousVersion, isNewVersion}; isNewVersion is true when the stored
    // version differs from the running one (including the very first visit, previousVersion null).
    check: function (currentVersion) {
        if (state) {
            return state;
        }
        let previousVersion = null;
        try {
            previousVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        } catch (e) {
            // storage unavailable — treat as first visit
        }
        state = {
            version: currentVersion,
            previousVersion: previousVersion,
            isNewVersion: previousVersion !== currentVersion
        };
        try {
            localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
        } catch (e) {
            // storage unavailable — next visit will look like a new version again
        }
        return state;
    },

    // The cached result of check(); null if check() has not run yet this page load.
    getState: function () {
        return state;
    }
};

module.exports = versionService;
