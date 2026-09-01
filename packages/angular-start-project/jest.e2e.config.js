// E2E test runner config — same shape as the setmy-info-less packages' jest.e2e.config.js:
// serial execution (one shared Selenium session per spec file) with a generous per-test timeout.
// Prerequisites: the built app served on http://127.0.0.1:4211 (lifecycle
// pre-e2e-test, or `npm run server` on 4210) and a Selenium Grid on
// http://localhost:4444/wd/hub (smi-selenium-hub + smi-selenium-node).
// For a live-reload loop, `npm start` on 4200 plus APP_BASE_URL also works.
module.exports = {
    roots: ['<rootDir>/test/e2e'],
    testMatch: ['**/*.e2e.js'],
    testTimeout: 60000,
    maxWorkers: 1,
};
