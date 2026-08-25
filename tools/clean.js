#!/usr/bin/env node

import path from 'node:path';

import { getWorkspaceInfo, removeDirectory } from './workspace-utils.js';

// Everything a package's lifecycle generates. `dist` is deliberately NOT
// removed wholesale: dist/main.css and dist/main.min.css are tracked in git
// on purpose (the 1.0.0-dist decision, see README "Known deliberate
// differences"), so Clean removes only the generated files inside it and
// leaves the directory, the same way Maven's clean removes target/ content
// that the build owns. Build regenerates both CSS files immediately after.
const targets = ['site', 'coverage', '.cache', '.tmp'];

const workspace = getWorkspaceInfo();

console.log(`Cleaning workspace: ${workspace.packageName}`);
console.log(`Location: ${workspace.workspace}`);

for (const target of targets) {
    const dir = path.join(workspace.workspace, target);
    removeDirectory(dir);
    console.log(`Removed ${dir}`);
}

// dist: generated HTML, the styleguide and any extra CSS entry output go;
// main.css/main.min.css stay (tracked artifacts, rewritten by build).
removeDirectory(path.join(workspace.distDir, 'styleguide'));
console.log(`Removed ${path.join(workspace.distDir, 'styleguide')}`);

console.log('Clean completed');
