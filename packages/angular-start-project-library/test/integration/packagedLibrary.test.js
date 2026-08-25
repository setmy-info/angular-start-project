const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Integration tier: runs against Build's own output, not the source tree -
// the same rule the sibling repos apply (test the built artifact, so a
// broken build cannot pass).
const buildInfoPath = path.join(__dirname, '..', '..', 'dist', 'build-info.json');

test('build produced a well-formed build-info.json', () => {
    assert.ok(
        fs.existsSync(buildInfoPath),
        'dist/build-info.json missing - run the build phase first',
    );

    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));

    assert.equal(buildInfo.packageName, 'angular-start-project-library');
    assert.equal(buildInfo.entry, 'index.js');
    assert.ok(Date.parse(buildInfo.builtAt) > 0);
});

test("the built entry point matches the manifest's main", () => {
    const pkg = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
    );

    assert.equal(pkg.main, 'index.js');
    assert.ok(fs.existsSync(path.join(__dirname, '..', '..', pkg.main)));
});
