const test = require('node:test');
const assert = require('node:assert/strict');

const systemsService = require('../../src/services/systemsService');
const tenantService = require('../../src/services/tenantService');

test('getTenantForHostname maps localhost to tenant1', () => {
    assert.equal(systemsService.getTenantForHostname('localhost'), 'tenant1');
    assert.equal(systemsService.getTenantForHostname('127.0.0.1'), 'tenant1');
});

test('getTenantForHostname maps .test dev aliases and production hostnames', () => {
    assert.equal(systemsService.getTenantForHostname('tenant1.test'), 'tenant1');
    assert.equal(systemsService.getTenantForHostname('tenant2.test'), 'tenant2');
    assert.equal(systemsService.getTenantForHostname('setmy.info'), 'tenant1');
    assert.equal(systemsService.getTenantForHostname('hearandseesystems.com'), 'tenant2');
});

test('getTenantForHostname falls back to tenant1 for unknown hosts', () => {
    assert.equal(systemsService.getTenantForHostname('unknown.example.invalid'), 'tenant1');
    assert.equal(systemsService.getTenantForHostname(''), 'tenant1');
});

test('resolveTenant applies SMI_TENANT override on localhost only', () => {
    assert.equal(systemsService.resolveTenant('localhost', 'tenant2'), 'tenant2');
    assert.equal(systemsService.resolveTenant('127.0.0.1', 'tenant2'), 'tenant2');
    assert.equal(systemsService.resolveTenant('localhost', null), 'tenant1');
});

test('resolveTenant ignores SMI_TENANT override on non-local hostnames', () => {
    assert.equal(systemsService.resolveTenant('tenant2.test', 'tenant1'), 'tenant2');
    assert.equal(systemsService.resolveTenant('setmy.info', 'tenant2'), 'tenant1');
});

test('setTenantOverride rejects unknown tenant ids', () => {
    assert.throws(() => systemsService.setTenantOverride('tenant3'), /Invalid tenant/);
});

test('tenantService.getTenant delegates to systemsService', () => {
    assert.equal(tenantService.getTenant(), systemsService.getTenant());
});
