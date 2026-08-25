const test = require('node:test');
const assert = require('node:assert/strict');

const pwaUpdateService = require('../../src/services/pwaUpdateService');

// The whole point of keeping the PWA update state out of Angular: it is a plain state machine, so
// it is tested here with node:test and no browser, no service worker and no framework. The
// Angular adapter that feeds it real SwUpdate events is tested separately, in the app's specs.
test.beforeEach(() => {
    pwaUpdateService.reset();
});

test('starts with no update pending', () => {
    const state = pwaUpdateService.getState();

    assert.equal(state.available, false);
    assert.equal(state.dismissed, false);
    assert.equal(state.activating, false);
    assert.equal(state.lastCheckedAt, null);
    assert.equal(state.error, null);
});

test('markAvailable makes an update pending', () => {
    pwaUpdateService.markAvailable('abc123');

    assert.equal(pwaUpdateService.getState().available, true);
    assert.equal(pwaUpdateService.getState().availableVersion, 'abc123');
});

test('dismiss hides the banner but keeps the update pending', () => {
    pwaUpdateService.markAvailable('abc123');
    pwaUpdateService.dismiss();

    const state = pwaUpdateService.getState();

    assert.equal(state.dismissed, true, 'banner hidden');
    assert.equal(state.available, true, 'update still waiting, so Settings can report it');
});

test('a newly detected version un-dismisses the banner', () => {
    pwaUpdateService.markAvailable('abc123');
    pwaUpdateService.dismiss();
    pwaUpdateService.markAvailable('def456');

    assert.equal(pwaUpdateService.getState().dismissed, false);
});

test('markNoUpdate clears a pending update', () => {
    pwaUpdateService.markAvailable('abc123');
    pwaUpdateService.markNoUpdate();

    assert.equal(pwaUpdateService.getState().available, false);
    assert.equal(pwaUpdateService.getState().availableVersion, null);
});

test('markChecked records the timestamp it was given', () => {
    pwaUpdateService.markChecked(1700000000000);

    assert.equal(pwaUpdateService.getState().lastCheckedAt, 1700000000000);
});

test('activation promotes the waiting version to the current one', () => {
    pwaUpdateService.setCurrentVersion('1.0.0');
    pwaUpdateService.markAvailable('2.0.0');
    pwaUpdateService.markActivating();

    assert.equal(pwaUpdateService.getState().activating, true);

    pwaUpdateService.markActivated();

    const state = pwaUpdateService.getState();

    assert.equal(state.activating, false);
    assert.equal(state.available, false);
    assert.equal(state.currentVersion, '2.0.0');
    assert.equal(state.availableVersion, null);
});

test('markFailed stops the activation and records a reason', () => {
    pwaUpdateService.markActivating();
    pwaUpdateService.markFailed('hash mismatch');

    assert.equal(pwaUpdateService.getState().activating, false);
    assert.equal(pwaUpdateService.getState().error, 'hash mismatch');
});

test('markUnrecoverable flags the state a reload cannot be avoided in', () => {
    pwaUpdateService.markUnrecoverable('cached response missing');

    assert.equal(pwaUpdateService.getState().unrecoverable, true);
    assert.equal(pwaUpdateService.getState().error, 'cached response missing');
});

test('subscribe fires immediately and on every change, until unsubscribed', () => {
    const seen = [];
    const unsubscribe = pwaUpdateService.subscribe((state) => seen.push(state.available));

    assert.deepEqual(seen, [false], 'called immediately with the current state');

    pwaUpdateService.markAvailable('abc123');
    assert.deepEqual(seen, [false, true]);

    unsubscribe();
    pwaUpdateService.markNoUpdate();
    assert.deepEqual(seen, [false, true], 'no further notifications after unsubscribe');
});
