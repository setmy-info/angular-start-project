import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { bundleConfiguration, collectModules } from '../../bundle.js';
import { getWorkspaces } from '../../workspace-utils.js';

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
            path.join(module.moduleType === 'brand-page' ? 'brands' : 'apps', module.packageName),
        );
    }
});

test('a name that is not a workspace is reported instead of silently skipped', () => {
    const { problems } = collectModules({
        requireBuilt: false,
        configuration: { ...bundleConfiguration(), brands: ['not-a-workspace'], apps: [] },
    });

    assert.equal(problems.length, 1);
    assert.match(problems[0], /not-a-workspace/);
});

test('a module listed under the wrong section is reported', () => {
    // The Angular app is not a brand page.
    const { problems } = collectModules({
        requireBuilt: false,
        configuration: { ...bundleConfiguration(), brands: ['angular-start-project'], apps: [] },
    });

    assert.equal(problems.length, 1);
    assert.match(problems[0], /expects a "brand-page" module/);
});

test('the brand page declares the brand-page module type', () => {
    const brandPage = getWorkspaces().find(
        (workspace) => workspace.packageName === 'angular-start-project-brandpage',
    );

    assert.ok(brandPage, 'the brand page is a workspace');
    assert.equal(brandPage.moduleType, 'brand-page');
});
