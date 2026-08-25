// Main (header) navigation e2e — one link per header menu item; clicking each navigates and the
// page content, in-app header title and document.title all follow.
const helper = require('./pageHelper');

describe('main navigation', () => {
    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/');
    });

    afterAll(async () => {
        await helper.close();
    });

    test('header nav shows the two menu items in Estonian by default', async () => {
        expect(await helper.countOf('nav a')).toBe(2);
        expect(await helper.getText('nav li:nth-child(1) a')).toBe('AVALEHT'); // CSS text-transform: uppercase
        expect(await helper.getText('nav li:nth-child(2) a')).toBe('KONTAKT');
    });

    test('home menu item is marked active on the home page', async () => {
        expect(await helper.countOf('nav a.active')).toBe(1);
        expect(await helper.getText('nav a.active')).toBe('AVALEHT');
    });

    test('Kontakt navigates to the contact rows fed from the content JSON', async () => {
        await helper.click('nav li:nth-child(2) a');
        await helper.waitForText('.contactsPage .textPanel', 'Angular Start Project OÜ');
        expect(await helper.currentPath()).toBe('/contact');
        expect(await helper.getTitle()).toBe('Kontakt — Lorem Ipsum Rakendus');
        // 4 detail rows + 3 feature-gated bank rows + 4 social link rows
        expect(await helper.countOf('.contactsPage section > div')).toBe(11);
        // bank rows stay hidden while the bankAccounts feature flag is off
        expect(await helper.displayOf('[feature="bankAccounts"]')).toBe('none');
        expect(
            await helper.countOf('.contactsPage .iconPanel .material-symbols-outlined'),
        ).toBeGreaterThan(0);
        expect(await helper.getText('.contactsPage a[href*="github"]')).toBe('GitHub');
    });

    test('Avaleht navigates back home', async () => {
        await helper.click('nav li:nth-child(1) a');
        await helper.waitForText('h1', 'Tere tulemast Angular Start Projekti');
        expect(await helper.currentPath()).toBe('/');
        expect(await helper.getTitle()).toBe('Avaleht — Lorem Ipsum Rakendus');
        expect(await helper.getText('nav a.active')).toBe('AVALEHT');
    });
});
