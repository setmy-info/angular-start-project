#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaceInfo } from './workspace-utils.js';

// Verify (Maven `verify`): the artifacts Compile promised exist and are
// well-formed, per module type.
const workspace = getWorkspaceInfo();
const required = [];

switch (workspace.moduleType) {
    case 'angular-app':
        // build-info.json records the profile the artifact was built with -
        // the e2e tier reads it, so a missing marker is a broken build.
        required.push(path.join(workspace.workspace, 'dist', 'build-info.json'));
        required.push(
            path.join(workspace.workspace, 'dist', 'application', 'browser', 'index.html'),
        );
        break;
    case 'less-package':
        required.push(
            path.join(workspace.workspace, 'dist', 'index.css'),
            path.join(workspace.workspace, 'dist', 'index.min.css'),
        );
        break;
    default:
        required.push(path.join(workspace.workspace, 'dist', 'build-info.json'));
}

for (const artifact of required) {
    if (!fs.existsSync(artifact)) {
        console.error(
            `Missing build artifact: ${artifact} — run the build phase first (npm run build)`,
        );
        process.exit(1);
    }
}

if (workspace.moduleType === 'js-library') {
    const buildInfo = JSON.parse(fs.readFileSync(required[0], 'utf8'));

    for (const key of ['packageName', 'version', 'entry', 'builtAt']) {
        if (!(key in buildInfo)) {
            console.error(`Build artifact ${required[0]} missing required key: ${key}`);
            process.exit(1);
        }
    }
}

console.log(`Verified build artifacts for ${workspace.packageName} (${workspace.moduleType})`);
