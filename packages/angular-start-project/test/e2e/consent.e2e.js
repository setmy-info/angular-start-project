// Cookie-consent lifecycle e2e — the banner on first visit, acceptance being STORED
// (localStorage + surviving a reload), and revocation through the privacy view's checkbox
// bringing the banner back (also persisted).
const helper = require('./pageHelper');

async function storedConsent() {
    const raw = await helper.data.driver.executeScript(
        'return localStorage.getItem("consent");'
    );
    return raw === null ? null : JSON.parse(raw).forCookieUsage;
}

describe('cookie consent', () => {

    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/');
    });

    afterAll(async () => {
        await helper.close();
    });

    test('banner is visible on first visit and nothing is stored yet', async () => {
        expect(await helper.displayOf('#consentBody')).not.toBe('none');
        expect(await storedConsent()).toBeNull();
    });

    test('accepting hides the banner and stores the consent', async () => {
        await helper.click('#consentBody button');
        await helper.waitUntil(
            'var el = document.querySelector("#consentBody");' +
            'return el && window.getComputedStyle(el).display === "none";',
            'consent banner did not hide'
        );
        expect(await storedConsent()).toBe(true);
    });

    test('acceptance persists across a page reload', async () => {
        await helper.openPage('/');
        expect(await helper.displayOf('#consentBody')).toBe('none');
        expect(await storedConsent()).toBe(true);
    });

    test('privacy view shows the consent checkbox in the checked state', async () => {
        await helper.openPage('/privacy');
        await helper.waitFor('.privacyPage input[type="checkbox"]');
        const checked = await helper.data.driver.executeScript(
            'return document.querySelector(".privacyPage input[type=checkbox]").checked;'
        );
        expect(checked).toBe(true);
    });

    test('unchecking the privacy checkbox revokes the consent and the banner returns', async () => {
        await helper.click('.privacyPage input[type="checkbox"]');
        await helper.waitUntil(
            'var el = document.querySelector("#consentBody");' +
            'return el && window.getComputedStyle(el).display !== "none";',
            'consent banner did not reappear after revocation'
        );
        expect(await storedConsent()).toBe(false);
    });

    test('revocation persists across a page reload', async () => {
        await helper.openPage('/privacy');
        await helper.waitFor('.privacyPage input[type="checkbox"]');
        expect(await helper.displayOf('#consentBody')).not.toBe('none');
        expect(await storedConsent()).toBe(false);
        const checked = await helper.data.driver.executeScript(
            'return document.querySelector(".privacyPage input[type=checkbox]").checked;'
        );
        expect(checked).toBe(false);
    });

    test('re-checking the privacy checkbox grants the consent again', async () => {
        await helper.click('.privacyPage input[type="checkbox"]');
        await helper.waitUntil(
            'var el = document.querySelector("#consentBody");' +
            'return el && window.getComputedStyle(el).display === "none";',
            'consent banner did not hide after re-granting'
        );
        expect(await storedConsent()).toBe(true);
    });
});
