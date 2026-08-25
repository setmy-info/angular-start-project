const test = require('node:test');
const assert = require('node:assert/strict');

const pwaInstallService = require('../../src/services/pwaInstallService');

// Only the framework- AND browser-independent half is covered here: listen() needs a real
// `window` and prompt() needs a real beforeinstallprompt event, so those paths are exercised by
// the app's pwa-install.service.spec.ts under jsdom. Everything below runs in a bare Node process,
// which is also the assertion that requiring this module has no DOM side effects at load time.
test.beforeEach(() => {
    pwaInstallService.reset();
});

test('starts with nothing to offer', () => {
    const state = pwaInstallService.getState();

    assert.equal(state.canInstall, false);
    assert.equal(state.installed, false);
    assert.equal(state.standalone, false);
    assert.equal(state.shouldPrompt, false);
    assert.equal(state.lastOutcome, null);
});

test('listen is a no-op without a window', () => {
    assert.equal(typeof window, 'undefined', 'this tier must run without a DOM');
    assert.equal(pwaInstallService.listen(), false);
});

test('prompt resolves "unavailable" when no install event was captured', async () => {
    assert.equal(await pwaInstallService.prompt(), 'unavailable');
    assert.equal(pwaInstallService.getState().lastOutcome, 'unavailable');
});

test('subscribe fires immediately and on every change, until unsubscribed', () => {
    const seen = [];
    const unsubscribe = pwaInstallService.subscribe((state) => seen.push(state.lastOutcome));

    assert.deepEqual(seen, [null]);

    return pwaInstallService.prompt().then(() => {
        assert.deepEqual(seen, [null, 'unavailable']);
        unsubscribe();
        return pwaInstallService.prompt().then(() => {
            assert.deepEqual(seen, [null, 'unavailable'], 'silent after unsubscribe');
        });
    });
});
