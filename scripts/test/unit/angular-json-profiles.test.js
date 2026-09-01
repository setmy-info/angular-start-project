import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaces, rootDir } from '../../workspace-utils.js';
import { CANONICAL_PROFILES } from '../../profile-utils.js';

test('angular.json build configurations are the ADR-0041 canonical six', () => {
    const app = getWorkspaces().find((workspace) => workspace.moduleType === 'angular-app');
    assert.ok(app);
    const angularJson = JSON.parse(
        fs.readFileSync(path.join(app.workspace, 'angular.json'), 'utf8'),
    );
    for (const [projectName, project] of Object.entries(angularJson.projects ?? {})) {
        const build = (project.architect ?? project.targets ?? {}).build;
        const configured = Object.keys(build?.configurations ?? {});
        const invalid = configured.filter((name) => !CANONICAL_PROFILES.includes(name));
        assert.equal(
            invalid.length,
            0,
            `angular.json project "${projectName}" has non-canonical configurations: ${invalid.join(', ')}`,
        );
    }
});

test('root package.json workspaces list is explicit paths, not packages/*', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    assert.ok(Array.isArray(pkg.workspaces));
    assert.equal(
        pkg.workspaces.some((pattern) => pattern === 'packages/*'),
        false,
        'packages/* would pull in angular-original and application.old',
    );
});
