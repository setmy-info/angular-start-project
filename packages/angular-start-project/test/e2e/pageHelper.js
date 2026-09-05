// E2E page helper — adapted from setmy-info-less/packages/common/test/js/pageHelper.js (same
// setup style: selenium-webdriver against an external Selenium Grid, fixed 2000x1200 viewport,
// bounded cleanup) and the same VERIFICATION PRINCIPLE: expectations() asserts concrete computed
// values (margin, padding, font, size, position, colors) read from getComputedStyle +
// getBoundingClientRect — not mere element existence. Differences from the LESS original: the
// app under test is the already-running Angular dev server (APP_BASE_URL), so there is no
// embedded express server, navigation is by SPA route, SPA helpers (click/waitFor/getText) are
// added because content renders asynchronously (translations load from JSON), and the browser
// runs headless by default (SELENIUM_HEADLESS=false to watch it).
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');

const SELENIUM_HUB_URL = process.env.SELENIUM_HUB_URL || 'http://localhost:4444/wd/hub';
const BROWSER = process.env.SELENIUM_BROWSER || 'firefox';
// Headless by default: the suite is unattended (CI, and a `npm run e2e-test` that should not
// steal focus or need a display), and every assertion reads computed styles and
// getBoundingClientRect through the driver, none of which needs a visible window. Set
// SELENIUM_HEADLESS=false to watch a run while debugging a failing spec.
const HEADLESS = !/^(false|0|no)$/i.test(process.env.SELENIUM_HEADLESS || 'true');
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4200';
const WINDOW_WIDTH = 2000;
const WINDOW_HEIGHT = 1200;
const WAIT_MS = 10000;
const QUIT_TIMEOUT_MS = Number(process.env.SELENIUM_QUIT_TIMEOUT_MS) || 15000;

// Geolocation support for the app's $geo startup watcher: pre-allow the geolocation permission
// (no prompt can ever be answered in an unattended Selenium session) and serve a FIXED position
// from a data: URL instead of the real network provider, so location-dependent UI (the Settings
// page map links, the startup location log) is deterministic. Tallinn town hall by default.
const GEO_LAT = Number(process.env.TEST_GEO_LAT) || 59.437;
const GEO_LNG = Number(process.env.TEST_GEO_LNG) || 24.7536;
const GEO_PROVIDER_URL =
    'data:application/json,' +
    JSON.stringify({
        location: { lat: GEO_LAT, lng: GEO_LNG },
        accuracy: 10,
    });

const data = {};

// Race a promise against a timeout so a stuck quit() can never hang afterAll (see the LESS
// project's pageHelper for the rationale).
function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
            console.warn(`pageHelper: ${label} did not finish within ${ms}ms — continuing.`);
            resolve(false);
        }, ms);
    });
    return Promise.race([
        Promise.resolve(promise).then(
            () => true,
            (err) => {
                console.warn(
                    `pageHelper: ${label} failed: ${err && err.message ? err.message : err}`,
                );
                return true;
            },
        ),
        timeout,
    ]).finally(() => clearTimeout(timer));
}

async function setViewport(width, height) {
    await data.driver.manage().window().setRect({ width, height });
    const viewport = await data.driver.executeScript(
        'return { w: window.innerWidth, h: window.innerHeight };',
    );
    const wDiff = width - viewport.w;
    const hDiff = height - viewport.h;
    if (wDiff !== 0 || hDiff !== 0) {
        await data.driver
            .manage()
            .window()
            .setRect({ width: width + wDiff, height: height + hDiff });
    }
}

// Firefox is the default browser, but SELENIUM_BROWSER can pick another slot on the grid, so the
// headless flag has to be set per browser — the spelling differs and each driver ignores the
// other's options object.
function firefoxOptions() {
    const options = new firefox.Options();
    // Allow geolocation without a prompt and pin it to the fixed test position (see GEO_* above).
    options.setPreference('geo.enabled', true);
    options.setPreference('geo.provider.network.url', GEO_PROVIDER_URL);
    options.setPreference('permissions.default.geo', 1); // 1 = allow, 2 = deny
    if (HEADLESS) {
        options.addArguments('-headless');
    }
    return options;
}

function chromeOptions() {
    const options = new chrome.Options();
    // 1 = allow. Chromium takes geolocation permission as a content setting, not a preference.
    options.setUserPreferences({ 'profile.default_content_setting_values.geolocation': 1 });
    if (HEADLESS) {
        options.addArguments('--headless=new');
    }
    return options;
}

// One browser session per spec file (beforeAll) — a fresh browser profile, so localStorage/
// sessionStorage start clean and the app boots with its defaults (language `et`, consent unset).
async function startSession() {
    await close();
    data.driver = await new Builder()
        .usingServer(SELENIUM_HUB_URL)
        .forBrowser(BROWSER)
        .setFirefoxOptions(firefoxOptions())
        .setChromeOptions(chromeOptions())
        .build();
    await data.driver.manage().setTimeouts({ pageLoad: 30000, implicit: 0 });
    await data.driver.get('about:blank');
    await setViewport(WINDOW_WIDTH, WINDOW_HEIGHT);
}

// Navigate to an SPA route and wait until the app shell and the async translations have rendered
// (the header title span shows a translated value, never a raw `x.y` translation key).
async function openPage(route) {
    const url = APP_BASE_URL + (route || '/');
    await data.driver.get(url);
    await waitFor('#application');
    await data.driver.wait(
        async () => {
            const text = await data.driver.executeScript(
                'var el = document.querySelector("header ul:first-child li:last-child span");' +
                    'return el ? el.textContent.trim() : "";',
            );
            return text.length > 0 && !/^[a-z]+(\.[a-zA-Z]+)+$/.test(text);
        },
        WAIT_MS,
        'translated header title did not appear',
    );
}

function find(selector) {
    return data.driver.findElement(By.css(selector));
}

async function waitFor(selector) {
    await data.driver.wait(
        until.elementLocated(By.css(selector)),
        WAIT_MS,
        `element not found: ${selector}`,
    );
    return find(selector);
}

// Wait until the given script (evaluated in the page) returns truthy.
async function waitUntil(script, label) {
    await data.driver.wait(
        async () => data.driver.executeScript(script),
        WAIT_MS,
        label || `condition did not become true: ${script}`,
    );
}

async function waitForText(selector, expected) {
    await data.driver.wait(
        async () => {
            const text = await getText(selector).catch(() => '');
            return text.includes(expected);
        },
        WAIT_MS,
        `text "${expected}" did not appear in ${selector}`,
    );
}

async function click(selector) {
    const el = await waitFor(selector);
    await el.click();
}

async function getText(selector) {
    return (await find(selector)).getText();
}

async function countOf(selector) {
    return (await data.driver.findElements(By.css(selector))).length;
}

// Emulate a real mouse move onto the element (for :hover styling tests).
async function hover(selector) {
    const el = await waitFor(selector);
    await data.driver.actions({ async: true }).move({ origin: el }).perform();
}

// One computed CSS property of an element (e.g. 'background-color' while hovered).
async function cssValueOf(selector, property) {
    return data.driver.executeScript(
        'var el = document.querySelector(arguments[0]);' +
            'return el ? window.getComputedStyle(el).getPropertyValue(arguments[1]) : null;',
        selector,
        property,
    );
}

// Computed CSS display of an element — visibility checks assert the computed value the user's
// browser actually resolves ("none" vs "block"), not the presence of a class.
async function displayOf(selector) {
    return data.driver.executeScript(
        'var el = document.querySelector(arguments[0]);' +
            'return el ? window.getComputedStyle(el).display : null;',
        selector,
    );
}

async function getTitle() {
    return data.driver.getTitle();
}

async function currentPath() {
    const url = await data.driver.getCurrentUrl();
    return url.replace(APP_BASE_URL, '') || '/';
}

// Select an option in a native <select> (fires the change event in Firefox).
async function selectOption(selectSelector, value) {
    await click(`${selectSelector} option[value="${value}"]`);
}

// Same computed-value collector as the LESS project's elementIdIs(), generalized to any CSS
// selector (SPA components rarely have ids on every verifiable element).
async function elementIs(selector) {
    data.computedStyles = await data.driver.executeScript(
        'var el = document.querySelector(arguments[0]);' +
            'if (!el) return null;' +
            'var style = window.getComputedStyle(el);' +
            'var rect = el.getBoundingClientRect();' +
            'return {' +
            '  margin: style.marginTop + " " + style.marginRight + " " + style.marginBottom + " " + style.marginLeft,' +
            '  padding: style.paddingTop + " " + style.paddingRight + " " + style.paddingBottom + " " + style.paddingLeft,' +
            '  fontFamily: style.fontFamily,' +
            '  fontSize: style.fontSize,' +
            '  x: Math.round(rect.x),' +
            '  y: Math.round(rect.y),' +
            '  top: Math.round(rect.top),' +
            '  left: Math.round(rect.left),' +
            '  width: Math.round(rect.width),' +
            '  height: Math.round(rect.height),' +
            '  backgroundColor: style.backgroundColor,' +
            '  color: style.color' +
            '};',
        selector,
    );
    if (!data.computedStyles) {
        throw new Error(`Element '${selector}' not found`);
    }
    return data.computedStyles;
}

// Identical assertion set to the LESS project's expectations() — every listed computed property
// must match exactly (fontFamily by containment, as there).
function expectations(ex) {
    /* global expect */
    expect(data.computedStyles.margin).toBe(ex.margin);
    expect(data.computedStyles.padding).toBe(ex.padding);
    expect(data.computedStyles.fontFamily).toContain(ex.fontFamily);
    expect(data.computedStyles.fontSize).toBe(ex.fontSize);
    expect(data.computedStyles.width).toBe(ex.width);
    expect(data.computedStyles.height).toBe(ex.height);
    expect(data.computedStyles.backgroundColor).toBe(ex.backgroundColor);
    expect(data.computedStyles.color).toBe(ex.color);
    expect(data.computedStyles.top).toBe(ex.top);
    expect(data.computedStyles.left).toBe(ex.left);
    expect(data.computedStyles.x).toBe(ex.x);
    expect(data.computedStyles.y).toBe(ex.y);
}

async function elementExpectations(selector, exp) {
    await elementIs(selector);
    expectations(exp);
}

async function close() {
    if (data.driver) {
        await withTimeout(data.driver.quit(), QUIT_TIMEOUT_MS, 'driver.quit()');
        data.driver = null;
    }
}

module.exports = {
    data,
    startSession,
    openPage,
    setViewport,
    waitFor,
    waitUntil,
    waitForText,
    click,
    getText,
    countOf,
    displayOf,
    hover,
    cssValueOf,
    getTitle,
    currentPath,
    selectOption,
    elementIs,
    expectations,
    elementExpectations,
    close,
};
