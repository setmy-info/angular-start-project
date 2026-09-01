#!/usr/bin/env node
// Removes every build result: generated package dist/, packed tarballs (dist/),
// the reports (reports/) and the running-instance / deploy state (build/).
// node_modules stays - `npm ci` is the Preparation stage's job; `rm -rf
// node_modules` when a developer wants a from-scratch checkout.
//
// The lifecycle's post phases run first: build/ holds their state (http-server
// pid files), and removing that from under something still running would leave
// it orphaned.
import fs from 'node:fs';
import path from 'node:path';

import { runPhases } from './lifecycle.js';
import { getWorkspaces, removeDirectory, rootDir } from './workspace-utils.js';

await runPhases(['post-integration-test', 'post-e2e-test']);

for (const workspace of getWorkspaces()) {
    for (const extra of [
        'site',
        'coverage',
        '.cache',
        '.tmp',
        'test-results',
        'playwright-report',
        '.artifacts',
        '.angular',
    ]) {
        removeDirectory(path.join(workspace.workspace, extra));
    }
    removeDirectory(workspace.distDir);
    console.log(`Cleaned ${workspace.packageName}`);
}

for (const name of [
    'dist',
    'reports',
    'build',
    'coverage',
    'site',
    '.artifacts',
    '.deploy',
    '.signatures',
]) {
    const target = path.join(rootDir, name);
    if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
        console.log(`Removed ${path.relative(rootDir, target)}`);
    }
}
