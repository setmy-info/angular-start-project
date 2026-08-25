// Application configuration — ported from the old library's src/config/index.js.
// features: feature-toggle flags read by the Angular `[feature]` directive and by
// statisticsResource (statistics stay OFF until the flag is turned on).
// resources: base paths/timeout for the fetch-based resource layer (resourceFactory.js).
// pwa: knobs for the two framework-independent PWA services (pwaUpdateService, pwaInstallService)
// and their Angular adapters. Kept here rather than in environment.ts because none of it is
// environment-specific and the library must stay usable without Angular.
const config = {
    resources: {
        restUrl: 'rest',
        jsonUrl: 'json',
        timeout: 2500,
    },
    pwa: {
        // How often an already-open tab re-asks the server whether a newer build was deployed
        // (SwUpdate.checkForUpdate). 0 disables polling; a reload always checks regardless.
        updateCheckIntervalMs: 6 * 60 * 60 * 1000,
        // Reload the page immediately after a new version is activated. Turn off to let the user
        // keep working and pick the new version up on their next navigation.
        reloadOnActivate: true,
        // How long "Later" on the install banner suppresses it for.
        installPromptDismissDays: 30,
    },
    features: {
        // featureName: false
        bankAccounts: false,
        statistics: false,
        somethingElse: false,
    },
};

module.exports = config;
