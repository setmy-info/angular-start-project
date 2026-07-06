const localStorageService = require('./src/services/localStorageService');
const sessionStorageService = require('./src/services/sessionStorageService');
const tenantService = require('./src/services/tenantService');
const translationService = require('./src/services/translationService');
const consentService = require('./src/services/consentService');
const menuModel = require('./src/models/menuModel');
const getJsdi = require('./src/legacyServiceLayer');

module.exports = {
    localStorageService: localStorageService,
    sessionStorageService: sessionStorageService,
    tenantService: tenantService,
    translationService: translationService,
    consentService: consentService,
    menuModel: menuModel,
    // Live accessor, not a captured value — see legacyServiceLayer.js for why.
    get jsdi() {
        return getJsdi();
    }
};
