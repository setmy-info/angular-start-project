// Framework-agnostic PWA update state.
//
// The browser side of "a new version has been deployed" is entirely Angular's (@angular/service-worker's
// SwUpdate owns the ServiceWorkerRegistration and the VERSION_* event stream). What is NOT
// Angular's is the *state machine* around it — is an update waiting, has the user dismissed the
// banner, did activation fail, when did we last check — and that is what lives here, so the
// Angular layer stays a thin adapter: it translates SwUpdate events into calls on this service and
// mirrors getState() into a signal (see the app's pwa-update.service.ts).
//
// Nothing in this file touches the DOM, `navigator` or a service worker, which is why it is unit
// testable in a plain Node process (test/unit/pwaUpdateService.test.js).
const statisticsService = require('./statisticsService');
const constants = require('../constants');

const listeners = [];

const INITIAL_STATE = {
    // An activated-but-not-yet-running new version is waiting in the SW cache.
    available: false,
    // The user hid the banner for this page load. Kept separate from `available` on purpose:
    // the update is still pending and the Settings page must keep reporting it.
    dismissed: false,
    // activateUpdate() is in flight.
    activating: false,
    // Version stamp of the build currently executing (src/app/config/version.ts).
    currentVersion: null,
    // Hash/stamp of the waiting build, when the service worker reports one.
    availableVersion: null,
    // Epoch millis of the last completed check, or null if none has run yet.
    lastCheckedAt: null,
    // Human-readable reason the last activation or check failed, else null.
    error: null,
    // Set when the service worker got into a state it cannot recover from (SwUpdate.unrecoverable);
    // the only remedy is a full reload, so the UI must offer one unconditionally.
    unrecoverable: false,
};

let state = Object.assign({}, INITIAL_STATE);

function notify() {
    for (const listener of listeners.slice()) {
        listener(state);
    }
}

function setState(patch) {
    state = Object.assign({}, state, patch);
    notify();
}

const pwaUpdateService = {
    getState: function () {
        return state;
    },

    // Calls `listener` immediately with the current state, then on every change. Returns the
    // unsubscribe function — the Angular adapter drops it into DestroyRef.onDestroy().
    subscribe: function (listener) {
        listeners.push(listener);
        listener(state);
        return function unsubscribe() {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        };
    },

    // The version stamp of the running build, recorded once at startup so the Settings page and
    // the statistics event can report "from -> to" rather than just "to".
    setCurrentVersion: function (version) {
        setState({ currentVersion: version || null });
    },

    // A new version finished installing and is ready to take over on the next activation.
    markAvailable: function (version) {
        setState({
            available: true,
            dismissed: false,
            availableVersion: version || null,
            error: null,
        });
    },

    // A check completed and there was nothing new.
    markNoUpdate: function () {
        setState({ available: false, availableVersion: null });
    },

    markChecked: function (timestampMs) {
        setState({ lastCheckedAt: timestampMs === undefined ? Date.now() : timestampMs });
    },

    markActivating: function () {
        setState({ activating: true, error: null });
    },

    markActivated: function () {
        statisticsService.write(
            { fromVersion: state.currentVersion, toVersion: state.availableVersion },
            constants.UPDATE_EVENT_NAME,
        );
        setState({
            available: false,
            dismissed: false,
            activating: false,
            currentVersion: state.availableVersion || state.currentVersion,
            availableVersion: null,
            error: null,
        });
    },

    markFailed: function (message) {
        setState({ activating: false, error: message || 'unknown error' });
    },

    // SwUpdate.unrecoverable — the cached version is broken and cannot be repaired in place.
    markUnrecoverable: function (message) {
        setState({
            unrecoverable: true,
            activating: false,
            error: message || 'unrecoverable service worker state',
        });
    },

    // "Later" on the update banner. Hides it for this page load only — deliberately not
    // persisted, because the whole point of an update banner is that the next visit re-offers it.
    dismiss: function () {
        setState({ dismissed: true });
    },

    // Test seam: singletons outlive a test file, so the suites that drive this state machine need
    // a way back to a known starting point. Not used by application code.
    reset: function () {
        state = Object.assign({}, INITIAL_STATE);
        notify();
    },
};

module.exports = pwaUpdateService;
