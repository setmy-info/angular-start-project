import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { getWorkspaces, rootDir } from '../../workspace-utils.js';

test('workspace discovery uses root package.json workspaces, not every packages/ directory', () => {
    const names = getWorkspaces()
        .map((workspace) => workspace.packageName)
        .sort();

    assert.deepEqual(names, [
        'angular-start-project',
        'angular-start-project-brand-style',
        'angular-start-project-library',
        'angular-start-project-style',
    ]);

    const directories = getWorkspaces().map((workspace) =>
        path.relative(rootDir, workspace.workspace),
    );
    assert.equal(
        directories.some((directory) => directory.includes('angular-original')),
        false,
    );
    assert.equal(
        directories.some((directory) => directory.includes('application.old')),
        false,
    );
    assert.equal(
        directories.some((directory) => directory === path.join('packages', 'application')),
        false,
    );
});

test('library is declared as a js-library', () => {
    const library = getWorkspaces().find(
        (workspace) => workspace.packageName === 'angular-start-project-library',
    );
    assert.equal(library.moduleType, 'js-library');
});
