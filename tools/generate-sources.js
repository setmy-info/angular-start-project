#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getWorkspaceInfo } from './workspace-utils.js';

// Generate sources (Maven `generate-sources`): produce source files that are
// compiled by the Compile phase rather than written by hand. This repo has a
// real one - bin/versionModule.js stamps package.json's version into
// src/app/config/version.ts - which used to hide inside npm's `prebuild`
// hook. A hook is invisible in the phase list; a named phase is not, so it
// runs here, in the Maven position, before Compile.
//
// This is the one phase the three sibling repos all record as "Not
// implemented" - this repo is the first with an actual use for it.
const workspace = getWorkspaceInfo();
const generator = path.join(workspace.workspace, 'bin', 'versionModule.js');

if (!fs.existsSync(generator)) {
    console.log(`No generated sources for ${workspace.packageName}, skipping`);
    process.exit(0);
}

console.log(`Generating sources for ${workspace.packageName}`);
execFileSync(process.execPath, [generator], {
    cwd: workspace.workspace,
    stdio: 'inherit',
});
