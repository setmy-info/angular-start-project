// Load-time smoke check for a framework-independent JS library (the Compile
// phase's actual work for module type "js-library").
//
// The library is framework-free but BROWSER-targeted: several services touch
// localStorage/sessionStorage at module scope, so a bare `require()` in a
// plain Node process throws ReferenceError. That is a real portability
// property worth knowing, not something to paper over - so this loader
// provides a minimal DOM (jsdom) and then requires the package, which proves
// what actually matters here: every module parses, every internal require
// resolves, and nothing pulls in a frontend framework.
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
});

for (const name of [
    'window',
    'document',
    'navigator',
    'localStorage',
    'sessionStorage',
    'location',
    'fetch',
]) {
    if (globalThis[name] === undefined && dom.window[name] !== undefined) {
        globalThis[name] = dom.window[name];
    }
}

const target = process.argv[2];
const loaded = require(target);

if (!loaded || typeof loaded !== 'object') {
    console.error(`${target} did not export an object`);
    process.exit(1);
}

console.log(`Loaded ${Object.keys(loaded).length} export(s) with no framework dependency`);
