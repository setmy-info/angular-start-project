// JSON-document article e2e — /articles/777 renders the proprietary JSON document format via
// objToDomService. The document exercises many text formatting attributes; each one is verified
// on the RENDERED result: the produced tag and, where it matters, the computed style value.
const helper = require('./pageHelper');

// Find the first element matching `selector` inside #jsonDocument whose trimmed text equals
// `text`, and return one computed style property of it.
function styleOfFragment(selector, text, property) {
    return helper.data.driver.executeScript(
        'var els = document.querySelectorAll("#jsonDocument " + arguments[0]);' +
        'for (var i = 0; i < els.length; i++) {' +
        '  if (els[i].textContent.trim() === arguments[1]) {' +
        '    return window.getComputedStyle(els[i]).getPropertyValue(arguments[2]);' +
        '  }' +
        '}' +
        'return null;',
        selector, text, property
    );
}

describe('JSON document article', () => {

    beforeAll(async () => {
        await helper.startSession();
        await helper.openPage('/articles/777');
        await helper.waitFor('#jsonDocument h1');
    });

    afterAll(async () => {
        await helper.close();
    });

    test('renders all six heading levels from the document metadata', async () => {
        expect(await helper.getText('#jsonDocument h1')).toBe('H1 - 777');
        for (const level of [2, 3, 4, 5, 6]) {
            expect(await helper.getText(`#jsonDocument h${level}`)).toBe(`H${level}`);
        }
    });

    test('bold, italic, underline and strike attributes render as their tags', async () => {
        expect(await helper.getText('#jsonDocument b')).toBe('consectetur');
        expect(await helper.getText('#jsonDocument i')).toBe('elit');
        expect(await styleOfFragment('u', 'sit', 'text-decoration-line')).toContain('underline');
        expect(await styleOfFragment('del', 'nec', 'text-decoration-line')).toContain('line-through');
    });

    test('marked attribute renders as <mark> with the highlight background', async () => {
        const bg = await styleOfFragment('mark', 'scelerisque', 'background-color');
        expect(bg).not.toBeNull();
        expect(bg).not.toBe('rgba(0, 0, 0, 0)'); // highlighted, not transparent
    });

    test('color, background, fontSize and fontFamily attributes become computed styles', async () => {
        // "Donec" carries color metadata; "sapien" carries background+fontSize+fontFamily+link
        const donecColor = await styleOfFragment('span', 'Donec', 'color');
        expect(donecColor).not.toBeNull();
        expect(donecColor).not.toBe('rgb(0, 0, 0)');
        const sapienBackground = await styleOfFragment('a.jsonDocument span', 'sapien', 'background-color');
        expect(sapienBackground).not.toBe('rgba(0, 0, 0, 0)');
        const sapienSize = await styleOfFragment('a.jsonDocument span', 'sapien', 'font-size');
        expect(sapienSize).not.toBe('16px'); // fontSize metadata applied
    });

    test('linkFollow attribute renders the fragment as a link', async () => {
        expect(await helper.countOf('#jsonDocument a.jsonDocument')).toBeGreaterThan(0);
        const href = await helper.data.driver.executeScript(
            'return document.querySelector("#jsonDocument a.jsonDocument").getAttribute("href");'
        );
        expect(href).toBeTruthy();
    });

    test('citation part renders as <blockquote> and alignment as text-align styles', async () => {
        expect(await helper.countOf('#jsonDocument blockquote')).toBe(1);
        expect(await helper.countOf('#jsonDocument p[style*="center"]')).toBeGreaterThan(0);
        expect(await helper.countOf('#jsonDocument p[style*="right"]')).toBeGreaterThan(0);
    });

    test('Parse round-trips the rendered DOM back into the JSON document format', async () => {
        await helper.click('article button'); // the Parse button (header buttons are outside <article>)
        await helper.waitUntil(
            'var el = document.querySelector("#parsedJson");' +
            'return el && el.value.length > 0;',
            'parsed JSON did not appear'
        );
        const parsed = await helper.data.driver.executeScript(
            'return document.querySelector("#parsedJson").value;'
        );
        const doc = JSON.parse(parsed);
        expect(Array.isArray(doc.sequentialContent)).toBe(true);
        expect(doc.sequentialContent.length).toBeGreaterThan(0);
        expect(Array.isArray(doc.sequentialContentMetaData)).toBe(true);
        expect(doc.sequentialContent.length).toBe(doc.sequentialContentMetaData.length);
        expect(Array.isArray(doc.partsMetaData)).toBe(true);
        expect(doc.sequentialContent).toContain('consectetur');
    });

    test('unknown article id shows the fallback message with a way back to the list', async () => {
        await helper.openPage('/articles/888');
        await helper.waitForText('section p', 'Sellist artiklit ei leitud.');
        expect(await helper.countOf('#jsonDocument')).toBe(0);
        expect(await helper.countOf('article a[href="/articles"]')).toBe(1);
    });
});
