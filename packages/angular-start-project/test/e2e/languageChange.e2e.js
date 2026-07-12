// Language switching e2e — through BOTH menus: the header ET/EN buttons and the side-navigation
// <select>. Verifies that navigation labels, in-app header title, document.title and the footer
// all follow the language, that the active button is the disabled/sunken one, and that the
// choice persists across a reload (localStorage LANG).
const helper = require('./pageHelper');

describe('language change', () => {

    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/');
        // Accept the consent banner (its own behavior is covered by consent.e2e.js) — while it
        // is visible it pushes the footer below the clipped main area, making footer text
        // assertions in this suite impossible.
        await helper.click('#consentBody button');
        await helper.waitUntil(
            'var el = document.querySelector("#consentBody");' +
            'return el && window.getComputedStyle(el).display === "none";',
            'consent banner did not hide'
        );
    });

    afterAll(async () => {
        await helper.close();
    });

    test('Estonian is the default: labels, title and the disabled ET button', async () => {
        expect(await helper.getText('nav li:nth-child(1) a')).toBe('AVALEHT'); // CSS text-transform: uppercase
        expect(await helper.getTitle()).toBe('Avaleht — Lorem Ipsum Rakendus');
        expect(await helper.getText('header ul:last-child button[disabled]')).toBe('ET');
    });

    test('header EN button switches everything to English', async () => {
        // the list items float right, so DOM order is [ET, EN] shown as EN|ET — click the one
        // that is NOT disabled (the non-current language), robust in either language
        await helper.click('header ul:last-child button:not([disabled])');
        await helper.waitForText('nav li:nth-child(1) a', 'HOME');
        expect(await helper.getText('nav li:nth-child(2) a')).toBe('ARTICLES');
        expect(await helper.getText('nav li:nth-child(3) a')).toBe('CONTACT');
        expect(await helper.getTitle()).toBe('Home — Lorem Ipsum Application');
        expect(await helper.getText('header ul:first-child li:last-child span')).toBe('Home');
        expect(await helper.getText('app-footer-panel footer')).toContain('Lorem Ipsum Application');
        expect(await helper.getText('header ul:last-child button[disabled]')).toBe('EN');
    });

    test('the language choice persists across a page reload', async () => {
        await helper.openPage('/');
        await helper.waitForText('nav li:nth-child(1) a', 'HOME');
        expect(await helper.getTitle()).toBe('Home — Lorem Ipsum Application');
        expect(await helper.getText('header ul:last-child button[disabled]')).toBe('EN');
    });

    test('side navigation select shows the current language selected', async () => {
        await helper.click('header ul:first-child li:first-child button');
        await helper.waitUntil(
            'var el = document.querySelector("#sidenav");' +
            'return el && window.getComputedStyle(el).display !== "none";',
            'side nav did not open'
        );
        const selected = await helper.data.driver.executeScript(
            'return document.querySelector("#sideNavigationContentPanel select").value;'
        );
        expect(selected).toBe('en');
        expect(await helper.getText('#sideNavigationHeaderPanel span')).toBe('Menu');
        expect(await helper.getText('li.sideNavMenuItems:nth-child(1) a')).toContain('HOME');
    });

    test('side navigation select switches back to Estonian', async () => {
        await helper.selectOption('#sideNavigationContentPanel select', 'et');
        await helper.waitForText('li.sideNavMenuItems:nth-child(1) a', 'AVALEHT');
        expect(await helper.getText('#sideNavigationHeaderPanel span')).toBe('Menüü');
        expect(await helper.getText('li.sideNavMenuItems:nth-child(4) a')).toContain('SEADED');
    });

    test('after closing the panel the whole page is Estonian again', async () => {
        await helper.click('button[aria-label="Close navigation menu"]');
        await helper.waitForText('nav li:nth-child(1) a', 'AVALEHT');
        expect(await helper.getTitle()).toBe('Avaleht — Lorem Ipsum Rakendus');
        expect(await helper.getText('header ul:last-child button[disabled]')).toBe('ET');
        expect(await helper.getText('app-footer-panel footer')).toContain('Lorem Ipsum Rakendus');
    });
});
