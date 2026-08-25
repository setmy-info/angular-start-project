// Hover and selected-state styling e2e — emulates real mouse movement onto menu elements and
// asserts the COMPUTED hover colors, plus the specific colors of already-selected (active)
// elements in both menus and the sunken active language button.
const helper = require('./pageHelper');

const HOVER_ORANGE = 'rgba(255, 157, 0, 0.87)';
const ACTIVE_RED = 'rgba(237, 38, 61, 0.87)';
const LIGHTYELLOW = 'rgb(255, 255, 224)';
const WHITE = 'rgb(255, 255, 255)';

describe('hover and selected-state colors', () => {
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
            'side nav did not open',
        );
    }

    test('active main-menu item carries the red selection underline and dark color', async () => {
        expect(await helper.cssValueOf('nav a.active', 'border-bottom-color')).toBe(ACTIVE_RED);
        expect(await helper.cssValueOf('nav a.active', 'color')).toBe('rgb(47, 79, 79)');
    });

    test('hovering a main-menu item turns its underline hover-orange', async () => {
        // the non-active Kontakt link starts with the white placeholder underline
        expect(await helper.cssValueOf('nav li:nth-child(2) a', 'border-bottom-color')).toBe(WHITE);
        await helper.hover('nav li:nth-child(2) a');
        await helper.waitUntil(
            'var el = document.querySelector("nav li:nth-child(2) a");' +
                `return window.getComputedStyle(el).borderBottomColor === "${HOVER_ORANGE}";`,
            'main-menu hover color did not apply',
        );
        expect(await helper.cssValueOf('nav li:nth-child(2) a', 'border-bottom-color')).toBe(
            HOVER_ORANGE,
        );
    });

    test('active language button is the sunken gray/green one', async () => {
        const active = 'header ul:last-child button[disabled]';
        expect(await helper.getText(active)).toBe('ET');
        expect(await helper.cssValueOf(active, 'background-color')).toBe('rgb(211, 211, 211)');
        expect(await helper.cssValueOf(active, 'color')).toBe('rgb(0, 128, 0)');
        expect(await helper.cssValueOf(active, 'box-shadow')).toContain('inset');
    });

    test('active side-menu item carries the red selection left border', async () => {
        await openSideNav();
        expect(await helper.cssValueOf('li.sideNavMenuItems a.active', 'border-left-color')).toBe(
            ACTIVE_RED,
        );
    });

    test('hovering a side-menu item gives the lightyellow background and orange left border', async () => {
        await helper.hover('li.sideNavMenuItems:nth-child(2) a');
        await helper.waitUntil(
            'var el = document.querySelector("li.sideNavMenuItems:nth-child(2) a");' +
                `return window.getComputedStyle(el).backgroundColor === "${LIGHTYELLOW}";`,
            'side-menu hover background did not apply',
        );
        expect(
            await helper.cssValueOf('li.sideNavMenuItems:nth-child(2) a', 'background-color'),
        ).toBe(LIGHTYELLOW);
        expect(
            await helper.cssValueOf('li.sideNavMenuItems:nth-child(2) a', 'border-left-color'),
        ).toBe(HOVER_ORANGE);
    });

    test('the side-menu language row is a noHover element: hovering keeps it white', async () => {
        await helper.hover('a.noHover');
        // give any (wrong) hover style a moment to apply before asserting it did not
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(await helper.cssValueOf('a.noHover', 'background-color')).toBe(WHITE);
        expect(await helper.cssValueOf('a.noHover', 'border-left-color')).toBe(WHITE);
    });
});
