import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { bundleConfiguration, collectModules } from '../../bundle.js';
import { getWorkspaces, readJson, rootDir } from '../../workspace-utils.js';

test('the bundle is driven by an explicit list in the root package.json', () => {
    const configuration = bundleConfiguration();

    assert.equal(configuration.archiveName, 'angular-start-project');
    assert.equal(configuration.outputDir, 'build');
    assert.ok(configuration.brands.length > 0, 'at least one brand page is listed');
    assert.ok(configuration.apps.length > 0, 'at least one application is listed');
});

test('every listed module is a workspace of the module type its section expects', () => {
    const { modules, problems } = collectModules({ requireBuilt: false });
    const configuration = bundleConfiguration();

    assert.deepEqual(problems, []);
    assert.equal(modules.length, configuration.brands.length + configuration.apps.length);
});

test('brand pages land under brands/ and applications under apps/, one directory each', () => {
    const { modules } = collectModules({ requireBuilt: false });
    const directories = modules.map((module) => module.targetDir);

    assert.equal(new Set(directories).size, directories.length, 'target directories are unique');
    for (const module of modules) {
        assert.equal(
            module.targetDir,
            path.join(
                module.moduleType === 'brand-page' ? 'brands' : 'apps',
                module.packageName,
            ),
        );
    }
});

test('a name that is not a workspace is reported instead of silently skipped', () => {
    const rootPackageJsonPath = path.join(rootDir, 'package.json');
    const original = fs.readFileSync(rootPackageJsonPath, 'utf8');
    const patched = readJson(rootPackageJsonPath);

    patched.config.bundle.brands = [...patched.config.bundle.brands, 'not-a-workspace'];
    fs.writeFileSync(rootPackageJsonPath, `${JSON.stringify(patched, null, 4)}\n`);

    try {
        const { problems } = collectModules({ requireBuilt: false });
        assert.equal(problems.length, 1);
        assert.match(problems[0], /not-a-workspace/);
    } finally {
        fs.writeFileSync(rootPackageJsonPath, original);
    }
});

test('a module listed under the wrong section is reported', () => {
    const rootPackageJsonPath = path.join(rootDir, 'package.json');
    const original = fs.readFileSync(rootPackageJsonPath, 'utf8');
    const patched = readJson(rootPackageJsonPath);

    // The Angular app is not a brand page.
    patched.config.bundle.brands = ['angular-start-project'];
    fs.writeFileSync(rootPackageJsonPath, `${JSON.stringify(patched, null, 4)}\n`);

    try {
        const { problems } = collectModules({ requireBuilt: false });
        assert.equal(problems.length, 1);
        assert.match(problems[0], /expects a "brand-page" module/);
    } finally {
        fs.writeFileSync(rootPackageJsonPath, original);
    }
});

test('the brand page declares the brand-page module type', () => {
    const brandPage = getWorkspaces().find(
        (workspace) => workspace.packageName === 'angular-start-project-brandpage',
    );

    assert.ok(brandPage, 'the brand page is a workspace');
    assert.equal(brandPage.moduleType, 'brand-page');
});
