// Application configuration — ported from the old library's src/config/index.js.
// features: feature-toggle flags read by the Angular `[feature]` directive and by
// statisticsResource (statistics stay OFF until the flag is turned on).
// resources: base paths/timeout for the fetch-based resource layer (resourceFactory.js).
const config = {
    resources: {
        restUrl: 'rest',
        jsonUrl: 'json',
        timeout: 2500
    },
    features: {
        // featureName: false
        bankAccounts: false,
        statistics: false,
        somethingElse: false
    }
};

module.exports = config;
