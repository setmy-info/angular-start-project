const test = require('node:test');
const assert = require('node:assert/strict');

const uuidService = require('../../src/services/uuidService');

// Unit tier for the framework-independent library: these run in a plain Node
// process with no browser, no Angular and no test framework beyond node:test -
// which is itself the point. If a service needs a DOM or a framework to be
// tested, it does not belong in this package.
test('newId returns a v4 UUID', () => {
    const id = uuidService.newId();

    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('newId returns a different value on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuidService.newId()));

    assert.equal(ids.size, 100);
});
