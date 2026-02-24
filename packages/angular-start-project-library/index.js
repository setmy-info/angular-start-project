const localStorageService = require('./src/services/localStorageService');
const sessionStorageService = require('./src/services/sessionStorageService');
const tenantService = require('./src/services/tenantService');
const translationService = require('./src/services/translationService');
const menuModel = require('./src/models/menuModel');

module.exports = {
    localStorageService: localStorageService,
    sessionStorageService: sessionStorageService,
    tenantService: tenantService,
    translationService: translationService,
    menuModel: menuModel
};
