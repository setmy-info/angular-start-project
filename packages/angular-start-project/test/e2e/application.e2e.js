// Application shell e2e — verification in the setmy-info-less style: elementExpectations()
// asserts the full set of concrete computed values (see pageHelper.js). Values were captured
// from the running app at the fixed 2000x1200 viewport.
const helper = require('./pageHelper');

describe('application shell', () => {

    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/');
    });

    afterAll(async () => {
        await helper.close();
    });

    test('page title is the translated home title', async () => {
        expect(await helper.getTitle()).toBe('Avaleht — Lorem Ipsum Rakendus');
    });

    test('body has the base-reset computed values', async () => {
        await helper.elementExpectations('body', {
            margin: '0px 0px 0px 0px',
            padding: '0px 0px 0px 0px',
            fontFamily: 'DejaVu Serif',
            fontSize: '16px',
            width: 2000,
            height: 1200,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            color: 'rgb(0, 0, 0)',
            top: 0,
            left: 0,
            x: 0,
            y: 0
        });
    });

    test('application shell elements exist', async () => {
        expect(await helper.countOf('#application')).toBe(1);
        expect(await helper.countOf('#headerPanel')).toBe(1);
        expect(await helper.countOf('app-footer-panel footer')).toBe(1);
        expect(await helper.countOf('#sidenav')).toBe(1);
        expect(await helper.countOf('#modalBody')).toBe(1);
    });

    test('consent banner is visible on first visit and hides after accepting', async () => {
        expect(await helper.displayOf('#consentBody')).not.toBe('none');
        await helper.click('#consentBody button');
        await helper.waitUntil(
            'var el = document.querySelector("#consentBody");' +
            'return el && window.getComputedStyle(el).display === "none";',
            'consent banner did not hide'
        );
        expect(await helper.displayOf('#consentBody')).toBe('none');
    });

    test('header panel has the 100px two-row layout once the consent banner is gone', async () => {
        await helper.elementExpectations('#headerPanel', {
            margin: '0px 0px 0px 0px',
            padding: '0px 0px 0px 0px',
            fontFamily: 'DejaVu Serif',
            fontSize: '16px',
            width: 2000,
            height: 100,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            color: 'rgb(0, 0, 0)',
            top: 0,
            left: 0,
            x: 0,
            y: 0
        });
    });

    test('footer is the centered 1024x50 bar at the bottom of the viewport', async () => {
        await helper.elementExpectations('app-footer-panel footer', {
            margin: '0px 488px 0px 488px',
            padding: '0px 0px 0px 0px',
            fontFamily: 'DejaVu Serif',
            fontSize: '14px',
            width: 1024,
            height: 50,
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgba(75, 75, 75, 0.87)',
            top: 1150,
            left: 488,
            x: 488,
            y: 1150
        });
    });

    test('footer shows the copyright icon, current year and app title', async () => {
        expect(await helper.getText('app-footer-panel footer i')).toBe('copyright');
        const text = await helper.getText('app-footer-panel footer');
        expect(text).toContain(String(new Date().getFullYear()));
        expect(text).toContain('Lorem Ipsum Rakendus');
    });

    test('footer copyright link navigates to the terms page', async () => {
        await helper.click('app-footer-panel footer a');
        await helper.waitForText('h1', 'Kasutustingimused');
        expect(await helper.currentPath()).toBe('/terms');
        expect(await helper.getTitle()).toBe('Kasutustingimused — Lorem Ipsum Rakendus');
    });
});
