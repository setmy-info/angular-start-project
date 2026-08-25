#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { ensureDirectory, getWorkspaceInfo, resolveLocalBin, rootDir } from './workspace-utils.js';
import { resolveProfileArg } from './profile-utils.js';

// Compile (Maven `compile`), dispatched by module type. Same phase name and
// position for every package; only the compiler differs.
const workspace = getWorkspaceInfo();

console.log(`Building ${workspace.packageName} (${workspace.moduleType})`);

switch (workspace.moduleType) {
    case 'angular-app':
        buildAngularApp();
        break;
    case 'less-package':
        buildLessPackage();
        break;
    default:
        buildJsLibrary();
}

// `ng build --configuration <profile>` IS this app's profile mechanism: the
// Angular CLI's own configurations are named with exactly the ADR-0041
// canonical six and each swaps in its environment file (fileReplacements).
// So there is nothing for tools/resources.js to do here - the profile is
// passed straight through, and Validate enforces the naming.
function buildAngularApp() {
    const profile = resolveProfileArg(process.argv.slice(2));

    execFileSync(resolveLocalBin('ng'), ['build', '--configuration', profile], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });

    // Record HOW this artifact was built, next to it (not inside browser/, so
    // it is never served or shipped). Maven writes the equivalent into the
    // jar's MANIFEST. The e2e tier reads it instead of trusting whoever runs
    // the tests to pass a matching BUILD_PROFILE by hand - the app reports its
    // own environment, so the assertion has to follow the artifact.
    const buildInfoPath = path.join(workspace.workspace, 'dist', 'build-info.json');

    fs.writeFileSync(
        buildInfoPath,
        `${JSON.stringify(
            {
                packageName: workspace.packageName,
                version: workspace.packageJson.version,
                profile,
                builtAt: new Date().toISOString(),
            },
            null,
            2,
        )}\n`,
    );

    console.log(
        `Built ${workspace.packageName} with configuration "${profile}" (${buildInfoPath})`,
    );
}

// A LESS package ships its SOURCE (package.json main is index.less), because
// consumers @import it to get the variables/tokens. So Compile does not
// produce the shipped artifact - it proves the source compiles, and leaves
// the CSS in dist/ for Verify and the integration tier to check. Same shape
// as the Python sibling's build.py, which has no transpile step either and
// documents the divergence rather than silently doing nothing.
function buildLessPackage() {
    const distDir = path.join(workspace.workspace, 'dist');

    ensureDirectory(distDir);

    for (const [output, minify] of [
        ['index.css', false],
        ['index.min.css', true],
    ]) {
        const outputPath = path.join(distDir, output);
        const args = [path.relative(workspace.workspace, workspace.srcEntry), outputPath];

        if (minify) {
            args.push('--clean-css');
        }

        fs.rmSync(outputPath, { force: true });
        execFileSync(resolveLocalBin('lessc'), args, {
            cwd: workspace.workspace,
            stdio: 'inherit',
        });
        console.log(`Created ${outputPath}`);
    }
}

// Plain JS, deliberately not transpiled or bundled: this package must stay
// consumable as-is by anything, framework or not. Compile is therefore a
// load-time smoke check - it proves every module actually parses and its
// exports resolve - plus a build stamp, mirroring the Python sibling's
// documented "no transpile step" divergence.
function buildJsLibrary() {
    const distDir = path.join(workspace.workspace, 'dist');

    ensureDirectory(distDir);

    execFileSync(
        process.execPath,
        [path.join(rootDir, 'tools', 'support', 'load-library.cjs'), workspace.workspace],
        { cwd: workspace.workspace, stdio: 'inherit' },
    );

    const buildInfo = {
        packageName: workspace.packageName,
        version: workspace.packageJson.version,
        entry: path.relative(workspace.workspace, workspace.srcEntry),
        builtAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(distDir, 'build-info.json'),
        `${JSON.stringify(buildInfo, null, 2)}\n`,
    );

    console.log(`Loaded cleanly; created ${path.join(distDir, 'build-info.json')}`);
}
