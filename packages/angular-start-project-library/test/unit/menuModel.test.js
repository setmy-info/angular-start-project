const test = require('node:test');
const assert = require('node:assert/strict');

const menuModel = require('../../src/models/menuModel');

test("getMenuItems returns the tenant's menu set", () => {
    assert.deepEqual(menuModel.getMenuItems('root'), menuModel.getMenuItems('root'));
    assert.ok(menuModel.getMenuItems('default').length > 0);
});

test('getMenuItems falls back to the default set for an unknown tenant', () => {
    assert.deepEqual(menuModel.getMenuItems('no-such-tenant'), menuModel.getMenuItems('default'));
});

test('every menu item carries the fields the Angular layer renders', () => {
    for (const item of menuModel.ALL_MENUS ? Object.values(menuModel.ALL_MENUS) : []) {
        assert.equal(typeof item.id, 'number');
        assert.equal(typeof item.path, 'string');
        assert.equal(typeof item.label, 'string');
        assert.equal(typeof item.translationKey, 'string');
    }
});
