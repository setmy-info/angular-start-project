#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getWorkspaceInfo, resolveLocalBin } from './workspace-utils.js';

// Docs (Maven `javadoc:javadoc`): API documentation from source comments.
// Wired for the framework-independent JS library, which is the part other
// code is meant to consume directly. The Angular app (TypeScript/components,
// would want typedoc/compodoc) and the LESS packages (would want KSS, as in
// setmy-info-less) have no generator wired yet - reported as a gap rather
// than silently skipped, per §1.3 "no silently omitted phase".
const workspace = getWorkspaceInfo();
const outDir = path.join(workspace.workspace, 'site', 'docs');

if (workspace.moduleType !== 'js-library') {
    console.log(
        `No documentation generator wired for ${workspace.packageName} (${workspace.moduleType}) — see report.md`,
    );
    process.exit(0);
}

const srcDir = path.join(workspace.workspace, 'src');

if (!fs.existsSync(srcDir)) {
    console.log(`No src directory to document for ${workspace.packageName}`);
    process.exit(0);
}

fs.rmSync(outDir, { recursive: true, force: true });

console.log(`Generating API docs for ${workspace.packageName}`);
execFileSync(resolveLocalBin('jsdoc'), [srcDir, '--recurse', '--destination', outDir], {
    cwd: workspace.workspace,
    stdio: 'inherit',
});

console.log(`Created ${outDir}`);
