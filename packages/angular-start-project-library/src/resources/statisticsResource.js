// Ported from the old library's statisticsResource.js: POSTs a statistics batch to the REST
// backend, and stays silently disabled while config.features.statistics is off (same feature
// gate as the old app — flip the flag once a backend exists).
const config = require('../config');
const resourceFactory = require('./resourceFactory');

const statisticsResource = {
    resource: resourceFactory.newResource({ baseUrl: config.resources.restUrl }),

    send: function (data) {
        if (!config.features.statistics) {
            return Promise.resolve(null);
        }
        return this.resource.postJson('statistics', data).catch(function () {
            // statistics are best-effort — a failed send must never break the app
            return null;
        });
    },
};

module.exports = statisticsResource;
