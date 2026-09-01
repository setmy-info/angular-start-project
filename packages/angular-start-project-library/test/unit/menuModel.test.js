const test = require('node:test');
const assert = require('node:assert/strict');

const menuModel = require('../../src/models/menuModel');
const systemsService = require('../../src/services/systemsService');

test("getMenuItems returns the tenant's menu set", () => {
    assert.deepEqual(menuModel.getMenuItems('tenant1'), menuModel.getMenuItems('tenant1'));
    assert.ok(menuModel.getMenuItems('tenant1').length > 0);
});

test('getMenuItems falls back to the tenant1 set for an unknown tenant', () => {
    assert.deepEqual(menuModel.getMenuItems('no-such-tenant'), menuModel.getMenuItems('tenant1'));
});

test('tenant1 menu includes Articles; tenant2 menu includes Products and services', () => {
    const tenant1Paths = menuModel.getMenuItems(systemsService.TENANT1).map((item) => item.path);
    const tenant2Paths = menuModel.getMenuItems(systemsService.TENANT2).map((item) => item.path);

    assert.ok(tenant1Paths.includes('/articles'));
    assert.ok(!tenant2Paths.includes('/articles'));
    assert.ok(tenant2Paths.includes('/productsServices'));
    assert.ok(!tenant1Paths.includes('/productsServices'));
});

test('every menu item carries the fields the Angular layer renders', () => {
    for (const item of menuModel.ALL_MENUS ? Object.values(menuModel.ALL_MENUS) : []) {
        assert.equal(typeof item.id, 'number');
        assert.equal(typeof item.path, 'string');
        assert.equal(typeof item.label, 'string');
        assert.equal(typeof item.translationKey, 'string');
    }
});
