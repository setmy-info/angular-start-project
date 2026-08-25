const localStorageService = require('./src/services/localStorageService');
const sessionStorageService = require('./src/services/sessionStorageService');
const tenantService = require('./src/services/tenantService');
const translationService = require('./src/services/translationService');
const consentService = require('./src/services/consentService');
const contentService = require('./src/services/contentService');
const sessionService = require('./src/services/sessionService');
const uuidService = require('./src/services/uuidService');
const statisticsService = require('./src/services/statisticsService');
const dbService = require('./src/services/dbService');
const loadingService = require('./src/services/loadingService');
const versionService = require('./src/services/versionService');
const resourceFactory = require('./src/resources/resourceFactory');
const menuModel = require('./src/models/menuModel');
const config = require('./src/config');
const constants = require('./src/constants');
const getJsdi = require('./src/legacyServiceLayer');

module.exports = {
    localStorageService: localStorageService,
    sessionStorageService: sessionStorageService,
    tenantService: tenantService,
    translationService: translationService,
    consentService: consentService,
    contentService: contentService,
    sessionService: sessionService,
    uuidService: uuidService,
    statisticsService: statisticsService,
    dbService: dbService,
    loadingService: loadingService,
    versionService: versionService,
    resourceFactory: resourceFactory,
    menuModel: menuModel,
    config: config,
    constants: constants,
    // Live accessor, not a captured value — see legacyServiceLayer.js for why.
    get jsdi() {
        return getJsdi();
    },
};
