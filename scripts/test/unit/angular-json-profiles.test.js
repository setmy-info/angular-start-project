import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaces, rootDir } from '../../workspace-utils.js';

// The Angular CLI's own configurations are the only build/serve switch: `local` (the default)
// and `live` (`--configuration live`, the deliverable). Nothing else may creep in.
const CONFIGURATIONS = ['local', 'live'];

function readAngularJson() {
    const app = getWorkspaces().find((workspace) => workspace.moduleType === 'angular-app');
    assert.ok(app);
    return {
        app,
        angularJson: JSON.parse(fs.readFileSync(path.join(app.workspace, 'angular.json'), 'utf8')),
    };
}

test('angular.json build and serve configurations are exactly local and live', () => {
    const { angularJson } = readAngularJson();
    for (const [projectName, project] of Object.entries(angularJson.projects ?? {})) {
        const architect = project.architect ?? project.targets ?? {};
        for (const target of ['build', 'serve']) {
            assert.deepEqual(
                Object.keys(architect[target]?.configurations ?? {}),
                CONFIGURATIONS,
                `angular.json project "${projectName}" target "${target}"`,
            );
            // The Angular way: `ng build` is production (live), `ng serve` is development (local).
            assert.equal(
                architect[target]?.defaultConfiguration,
                target === 'build' ? 'live' : 'local',
            );
        }
        assert.deepEqual(Object.keys(architect.test?.configurations ?? {}), ['local']);
    }
});

test('unit specs are environment-free: no host or realm literals', () => {
    const { app } = readAngularJson();
    const offenders = fs
        .readdirSync(path.join(app.workspace, 'src'), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
        .map((entry) => path.join(entry.parentPath, entry.name))
        .filter((file) =>
            /localhost:4200|setmy\.info|keycloak\.[a-z-]+\.[a-z]/.test(
                fs.readFileSync(file, 'utf8'),
            ),
        )
        .map((file) => path.relative(app.workspace, file));
    assert.deepEqual(offenders, [], 'specs must derive URLs from the compiled environment');
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
