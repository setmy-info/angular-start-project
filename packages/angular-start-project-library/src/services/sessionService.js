// Ported from the old library's sessionService.js: a per-browser-session UUID v4, created once
// and persisted in sessionStorage under SESSION_ID_KEY. On first creation it records a session
// `create` statistics event and, when the page was entered from an external site, a `referrer`
// event (the old browserService.referrerOriginSite()).
const uuidService = require('./uuidService');
const {SESSION_ID_KEY, CREATE_EVENT_NAME, REFERRER_EVENT_NAME} = require('../constants');

function referrerOriginSite() {
    try {
        if (!document.referrer) {
            return null;
        }
        const referrerOrigin = new URL(document.referrer).origin;
        return referrerOrigin === window.location.origin ? null : referrerOrigin;
    } catch (e) {
        return null;
    }
}

const sessionService = {
    sessionId: null,

    getSessionId: function () {
        if (this.sessionId) {
            return this.sessionId;
        }
        try {
            this.sessionId = sessionStorage.getItem(SESSION_ID_KEY);
        } catch (e) {
            // storage unavailable — fall through to a fresh in-memory id
        }
        if (!this.sessionId) {
            this.sessionId = uuidService.newId();
            try {
                sessionStorage.setItem(SESSION_ID_KEY, this.sessionId);
            } catch (e) {
                // storage unavailable — id stays in memory for this page load only
            }
            this.addStatistics();
        }
        return this.sessionId;
    },

    addStatistics: function () {
        // lazy require — statisticsService requires this module back (see note there)
        const statisticsService = require('./statisticsService');
        statisticsService.add(SESSION_ID_KEY, CREATE_EVENT_NAME);
        const referrer = referrerOriginSite();
        if (referrer) {
            statisticsService.add(referrer, REFERRER_EVENT_NAME);
        }
    }
};

module.exports = sessionService;
