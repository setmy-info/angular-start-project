#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
    getWorkspaces,
    resolveLocalBin,
    rootDir,
    toArtifactDirectoryName,
} from './workspace-utils.js';

const docsRoot = path.join(rootDir, 'reports', 'docs');

fs.rmSync(docsRoot, { recursive: true, force: true });
fs.mkdirSync(docsRoot, { recursive: true });

for (const workspace of getWorkspaces()) {
    if (workspace.moduleType === 'js-library') {
        documentJsLibrary(workspace);
        continue;
    }
    if (workspace.moduleType === 'less-package') {
        documentLessPackage(workspace);
    }
}

function documentJsLibrary(workspace) {
    const srcDir = path.join(workspace.workspace, 'src');
    if (!fs.existsSync(srcDir)) {
        console.log(`No src directory to document for ${workspace.packageName}`);
        return;
    }
    const outDir = path.join(docsRoot, toArtifactDirectoryName(workspace.packageName));
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`Generating API docs for ${workspace.packageName}`);
    execFileSync(resolveLocalBin('jsdoc'), [srcDir, '--recurse', '--destination', outDir], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
    console.log(`Created ${outDir}`);
}

function documentLessPackage(workspace) {
    const lessDir = path.join(workspace.workspace, 'src', 'less');
    if (!fs.existsSync(lessDir)) {
        console.log(`No LESS source to document for ${workspace.packageName}`);
        return;
    }
    const kssBin = resolveLocalBin('kss');
    if (!fs.existsSync(kssBin)) {
        console.log(
            `kss is not installed (it conflicts with Angular's chokidar 5); skipping LESS docs for ${workspace.packageName}`,
        );
        return;
    }
    const outDir = path.join(docsRoot, toArtifactDirectoryName(workspace.packageName));
    fs.mkdirSync(outDir, { recursive: true });
    const cssPath = path.join(workspace.distDir, 'index.css');
    const args = ['--source', lessDir, '--destination', outDir];
    if (fs.existsSync(cssPath)) {
        args.push('--css', path.relative(outDir, cssPath));
    }
    console.log(`Generating KSS styleguide for ${workspace.packageName}`);
    try {
        execFileSync(kssBin, args, { cwd: workspace.workspace, stdio: 'inherit' });
        console.log(`Created ${outDir}`);
    } catch {
        console.log(
            `KSS produced no styleguide for ${workspace.packageName} (no documented modules, or kss failed) — continuing`,
        );
    }
}
