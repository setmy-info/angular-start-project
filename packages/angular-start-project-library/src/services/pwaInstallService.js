// Framework-agnostic "Add to home screen" (A2HS) state.
//
// Chromium fires `beforeinstallprompt` once, early, and only if the page is installable. The
// event must be preventDefault()-ed and *kept*, because prompt() can only be called on the saved
// event and only from a user gesture later on. Missing that event means no install button for the
// rest of the page's life, so listen() is called from main.ts before Angular bootstraps rather
// than from an Angular service constructor.
//
// Everything except listen() and prompt() is plain state, so the derivation ("should the banner be
// shown at all?") lives here instead of in the Angular layer — see the app's pwa-install.service.ts,
// which only mirrors getState() into signals.
const statisticsService = require('./statisticsService');
const constants = require('../constants');
const config = require('../config');

const DISMISS_STORAGE_KEY = 'pwaInstallDismissedAt';

const listeners = [];

const INITIAL_STATE = {
    // The browser told us the app is installable (i.e. we hold a usable beforeinstallprompt event).
    canInstall: false,
    // `appinstalled` fired during this page load.
    installed: false,
    // Already running as an installed app — there is nothing to offer.
    standalone: false,
    // Epoch millis of the last "Later", or null. Persisted, unlike the update banner's dismissal:
    // re-asking on every visit is the classic install-prompt annoyance.
    dismissedAt: null,
    // 'accepted' | 'dismissed' | 'unavailable' | null — outcome of the last prompt() call.
    lastOutcome: null,
    // Precomputed banner condition, so no consumer has to re-derive the rules below.
    shouldPrompt: false,
};

let state = Object.assign({}, INITIAL_STATE);
let deferredPrompt = null;
let listening = false;

function notify() {
    for (const listener of listeners.slice()) {
        listener(state);
    }
}

function isDismissedRecently(dismissedAt) {
    if (!dismissedAt) {
        return false;
    }
    const days = config.pwa.installPromptDismissDays;
    // 0 days is a legitimate configuration meaning "re-ask immediately".
    return Date.now() - dismissedAt < days * 24 * 60 * 60 * 1000;
}

function setState(patch) {
    const next = Object.assign({}, state, patch);
    next.shouldPrompt =
        next.canInstall &&
        !next.installed &&
        !next.standalone &&
        !isDismissedRecently(next.dismissedAt);
    state = next;
    notify();
}

function readDismissedAt() {
    try {
        const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
        return stored ? Number(stored) || null : null;
    } catch (e) {
        // storage unavailable — "Later" just will not survive a reload
        return null;
    }
}

function detectStandalone() {
    try {
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }
        }
        // iOS Safari predates display-mode and reports this instead.
        return typeof navigator !== 'undefined' && navigator.standalone === true;
    } catch (e) {
        return false;
    }
}

function onBeforeInstallPrompt(event) {
    // Without this the browser shows its own mini-infobar and the event is not reusable.
    if (typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    deferredPrompt = event;
    setState({ canInstall: true });
}

function onAppInstalled() {
    deferredPrompt = null;
    statisticsService.write({ outcome: 'installed' }, constants.INSTALL_EVENT_NAME);
    setState({ canInstall: false, installed: true });
}

const pwaInstallService = {
    getState: function () {
        return state;
    },

    // Same contract as pwaUpdateService.subscribe().
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

    // Attach the window listeners. Idempotent, and a no-op outside a browser (the library's own
    // unit tier runs in a bare Node process). Returns whether listeners are attached.
    listen: function () {
        if (listening) {
            return true;
        }
        if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
            return false;
        }
        listening = true;
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);
        setState({ standalone: detectStandalone(), dismissedAt: readDismissedAt() });
        return true;
    },

    // Detach again. Nothing in the app calls this (the listeners are meant to live as long as the
    // page), but it keeps listen() genuinely reversible for tests and for a future teardown.
    stop: function () {
        if (!listening) {
            return;
        }
        listening = false;
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
    },

    // Show the browser's install dialog. Must be called from a user gesture. Resolves with
    // 'accepted' | 'dismissed' | 'unavailable' — never rejects, so callers need no try/catch.
    prompt: function () {
        const event = deferredPrompt;
        if (!event || typeof event.prompt !== 'function') {
            setState({ lastOutcome: 'unavailable', canInstall: false });
            return Promise.resolve('unavailable');
        }
        // The saved event is single-use whatever the user answers.
        deferredPrompt = null;
        return Promise.resolve()
            .then(function () {
                return event.prompt();
            })
            .then(function () {
                return event.userChoice;
            })
            .then(function (choice) {
                const outcome = (choice && choice.outcome) || 'dismissed';
                statisticsService.write({ outcome: outcome }, constants.INSTALL_EVENT_NAME);
                setState({ canInstall: false, lastOutcome: outcome });
                return outcome;
            })
            .catch(function () {
                setState({ canInstall: false, lastOutcome: 'unavailable' });
                return 'unavailable';
            });
    },

    // "Later" on the install banner — persisted for config.pwa.installPromptDismissDays.
    dismiss: function () {
        const dismissedAt = Date.now();
        try {
            localStorage.setItem(DISMISS_STORAGE_KEY, String(dismissedAt));
        } catch (e) {
            // storage unavailable — the banner comes back on the next visit
        }
        setState({ dismissedAt: dismissedAt });
    },

    // Drop a previous "Later" so the banner can be offered again (wired to nothing yet; the
    // natural caller is a "reset preferences" action on the Settings page).
    clearDismissal: function () {
        try {
            localStorage.removeItem(DISMISS_STORAGE_KEY);
        } catch (e) {
            // storage unavailable — nothing was persisted in the first place
        }
        setState({ dismissedAt: null });
    },

    // Test seam, see pwaUpdateService.reset().
    reset: function () {
        pwaInstallService.stop();
        state = Object.assign({}, INITIAL_STATE);
        deferredPrompt = null;
        notify();
    },
};

module.exports = pwaInstallService;
