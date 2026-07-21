// Fetch-based REST resource layer — ported from the old library's resourceFactory.js (which was
// axios-based). Every resource (statistics, content, JSON documents) is built through this
// factory so a later switch from static JSON files to a real REST backend is a configuration
// change here, not a hunt through callers. Timeout uses AbortSignal.timeout (the old axios
// `timeout` equivalent); requestHook/responseHook are the interceptor equivalents.
const config = require('../config');

const resourceFactory = {
    newResource: function (options) {
        const opts = options || {};
        const baseUrl = opts.baseUrl !== undefined ? opts.baseUrl : config.resources.jsonUrl;
        const timeoutMs = opts.timeoutMs !== undefined ? opts.timeoutMs : config.resources.timeout;
        const requestHook = opts.requestHook || function (request) {
            return request;
        };
        const responseHook = opts.responseHook || function (response) {
            return response;
        };

        function doFetch(path, init) {
            const request = requestHook({
                url: baseUrl + '/' + path,
                init: Object.assign({signal: AbortSignal.timeout(timeoutMs)}, init)
            });
            return fetch(request.url, request.init)
                .then(responseHook)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ' for ' + request.url);
                    }
                    return response.json();
                });
        }

        return {
            getJson: function (path) {
                return doFetch(path, {method: 'GET'});
            },
            postJson: function (path, data) {
                return doFetch(path, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
            }
        };
    }
};

module.exports = resourceFactory;
