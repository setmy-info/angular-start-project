const systemsService = require('./systemsService');

// Backward-compatible alias: Angular services import tenantService.getTenant().
const tenantService = {
    getTenant: function () {
        return systemsService.getTenant();
    },
};

module.exports = tenantService;
