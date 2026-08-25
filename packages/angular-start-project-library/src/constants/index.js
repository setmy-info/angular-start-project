// Shared constants — ported from the old library's src/constants/index.js (kept only the ones
// the new solution actually uses).
module.exports = {
    SESSION_ID_KEY: 'sessionId',
    STATISTICS_LIMIT: 500,
    CREATE_EVENT_NAME: 'create',
    CHANGE_EVENT_NAME: 'change',
    REFERRER_EVENT_NAME: 'referrer',
    // PWA lifecycle events (pwaUpdateService / pwaInstallService); like every other event here
    // they only leave the browser once config.features.statistics is on.
    UPDATE_EVENT_NAME: 'update',
    INSTALL_EVENT_NAME: 'install',
};
