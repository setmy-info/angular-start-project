// Ported from the old library's statisticsService.js: an in-memory event batch (capped at
// STATISTICS_LIMIT) flushed to statisticsResource. Events recorded by the new app: session
// `create` + external `referrer` (sessionService), language `change` (LanguageService), and page
// visits (PageTitleService router hook — the Angular equivalent of the old Vue page mixin).
const { STATISTICS_LIMIT } = require('../constants');
const statisticsResource = require('../resources/statisticsResource');

const statisticsService = {
    log: [],

    write: function (object, eventName) {
        this.add(object, eventName);
        this.send();
    },

    add: function (object, eventName) {
        // lazy require: sessionService also requires this module (same cycle as the old library;
        // resolving it at call time keeps module load order irrelevant)
        const sessionService = require('./sessionService');
        this.addObject({
            sessionId: sessionService.getSessionId(),
            object: object,
            eventName: eventName,
        });
    },

    addObject: function (item) {
        if (this.log.length <= STATISTICS_LIMIT) {
            this.log.push(item);
        }
    },

    send: function () {
        if (this.log.length === 0) {
            return;
        }
        const data = { log: this.log.slice() };
        statisticsResource.send(data);
        this.log.length = 0;
    },
};

module.exports = statisticsService;
