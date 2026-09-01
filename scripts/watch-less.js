#!/usr/bin/env node
// Rebuild a LESS package whenever its source changes. Used by per-package
// `npm run watch` so the LESS packages have the same command name as the
// Angular app's incremental ng build, without adding a separate watcher
// dependency.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getWorkspaceInfo } from './workspace-utils.js';

const buildTool = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build.js');
const workspace = getWorkspaceInfo();
let pending = false;
let running = false;

function rebuild() {
    if (running) {
        pending = true;
        return;
    }
    running = true;
    const child = spawn(process.execPath, [buildTool], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
    child.on('exit', () => {
        running = false;
        if (pending) {
            pending = false;
            rebuild();
        }
    });
}

rebuild();

const watchRoots = ['index.less', 'src', 'brand-example'].map((name) =>
    path.join(workspace.workspace, name),
);
for (const root of watchRoots) {
    if (!fs.existsSync(root)) {
        continue;
    }
    fs.watch(root, { recursive: fs.statSync(root).isDirectory() }, () => rebuild());
}

console.log(`Watching LESS sources for ${workspace.packageName}`);
