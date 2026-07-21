// Side navigation (hamburger) e2e — opening/closing through every path the UI offers (close
// button, click-anywhere-on-overlay, menu item click), menu content, and the settings page it
// leads to. Visibility is always asserted on COMPUTED display values.
const helper = require('./pageHelper');

describe('side navigation', () => {

    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/');
    });

    afterAll(async () => {
        await helper.close();
    });

    async function openSideNav() {
        await helper.click('header ul:first-child li:first-child button');
        await helper.waitUntil(
            'var el = document.querySelector("#sidenav");' +
            'return el && window.getComputedStyle(el).display !== "none";',
            'side nav did not open'
        );
    }

    async function expectClosed() {
        await helper.waitUntil(
            'var el = document.querySelector("#sidenav");' +
            'return el && window.getComputedStyle(el).display === "none";',
            'side nav did not close'
        );
        expect(await helper.displayOf('#sidenav')).toBe('none');
        expect(await helper.displayOf('#modalBody')).toBe('none');
    }

    test('side nav and overlay are hidden initially', async () => {
        expect(await helper.displayOf('#sidenav')).toBe('none');
        expect(await helper.displayOf('#modalBody')).toBe('none');
    });

    test('hamburger button opens the panel with the grey overlay behind it', async () => {
        await openSideNav();
        expect(await helper.displayOf('#sidenav')).toBe('block');
        expect(await helper.displayOf('#modalBody')).toBe('block');
        // panel geometry: full-height column pinned to the left edge
        await helper.elementExpectations('#sidenav', {
            margin: '0px 0px 0px 0px',
            padding: '0px 0px 0px 0px',
            fontFamily: 'DejaVu Serif',
            fontSize: '16px',
            width: 290,
            height: 1200,
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgb(0, 0, 0)',
            top: 0,
            left: 0,
            x: 0,
            y: 0
        });
    });

    test('panel lists every menu item plus the language row below the separator line', async () => {
        expect(await helper.getText('#sideNavigationHeaderPanel span')).toBe('Menüü');
        expect(await helper.countOf('li.sideNavMenuItems')).toBe(5); // 4 menu items + language row
        expect(await helper.getText('li.sideNavMenuItems:nth-child(1) a')).toContain('AVALEHT');
        expect(await helper.getText('li.sideNavMenuItems:nth-child(2) a')).toContain('ARTIKLID');
        expect(await helper.getText('li.sideNavMenuItems:nth-child(3) a')).toContain('KONTAKT');
        expect(await helper.getText('li.sideNavMenuItems:nth-child(4) a')).toContain('SEADED');
        expect(await helper.countOf('li.sideNavThinMenuItems hr')).toBe(1);
        expect(await helper.countOf('#sideNavigationContentPanel select')).toBe(1);
    });

    test('close button closes the panel', async () => {
        await helper.click('button[aria-label="Close navigation menu"]');
        await expectClosed();
    });

    test('clicking anywhere on the overlay closes the panel', async () => {
        await openSideNav();
        await helper.click('#modalBody'); // click lands at the element center — "any place"
        await expectClosed();
    });

    test('menu item click navigates to Settings and closes the panel', async () => {
        await openSideNav();
        await helper.click('li.sideNavMenuItems:nth-child(4) a');
        await helper.waitForText('h1', 'Seaded');
        await expectClosed();
        expect(await helper.currentPath()).toBe('/settings');
        expect(await helper.getTitle()).toBe('Seaded — Lorem Ipsum Rakendus');
        expect(await helper.getText('header ul:first-child li:last-child span')).toBe('Seaded');
    });

    test('settings page shows the diagnostic rows including the app version', async () => {
        expect(await helper.countOf('.settingsPage dl')).toBe(1);
        const dl = await helper.getText('.settingsPage dl');
        expect(dl).toContain('1.0.0-SNAPSHOT');
        expect(dl).toContain('Keel:');
        expect(dl).toContain('Keskkond:');
        expect(dl).toContain('local');
    });

    test('settings page shows the location links from the allowed test geolocation', async () => {
        // pageHelper pre-allows geolocation with a fixed position (see GEO_* in pageHelper.js),
        // so the $geo startup watcher resolves and the Settings page renders the map links.
        await helper.waitFor('a[href*="openstreetmap.org"]');
        expect(await helper.countOf('a[href*="google.com/maps"]')).toBe(1);
        expect(await helper.countOf('a[href*="openstreetmap.org"]')).toBe(1);
    });

    test('menu item click from Settings navigates home again', async () => {
        await openSideNav();
        await helper.click('li.sideNavMenuItems:nth-child(1) a');
        await helper.waitForText('h1', 'Tere tulemast Angular Start Projekti');
        await expectClosed();
        expect(await helper.currentPath()).toBe('/');
    });
});
