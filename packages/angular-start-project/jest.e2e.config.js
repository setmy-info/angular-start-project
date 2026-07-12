// E2E test runner config — same shape as the setmy-info-less packages' jest.e2e.config.js:
// serial execution (one shared Selenium session per spec file) with a generous per-test timeout.
// Prerequisites: the app dev server on http://localhost:4200 (npm start) and a Selenium Grid on
// http://localhost:4444/wd/hub (smi-selenium-hub + smi-selenium-node) — see README "Testing".
module.exports = {
    roots: ['<rootDir>/test/e2e'],
    testMatch: ['**/*.e2e.js'],
    testTimeout: 60000,
    maxWorkers: 1
};
