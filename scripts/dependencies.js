#!/usr/bin/env node
// Copies a package's third-party assets out of node_modules INTO its source tree, where they are
// committed alongside the hand-written files.
//
//     npm run dependencies              (root: every package that declares them)
//     npm run dependencies --workspace=angular-start-project-brandpage
//
// The list lives in the package's own dependencies.js (`copy`), so a brand page copied to a new
// directory brings its own list with it. `from` resolves against the repo's node_modules, `to`
// against the package's src/.
//
// Why copy rather than import at build time: these packages publish compiled artifacts only, and
// a brand page has to be servable straight out of src/ with no build step and no install — start
// any static server on that folder and everything it needs is already there.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getWorkspaces, readJson, rootDir } from './workspace-utils.js';

export async function loadDependencyList(workspace) {
    const listPath = path.join(workspace.workspace, 'dependencies.js');

    if (!fs.existsSync(listPath)) {
        return null;
    }

    const module = await import(pathToFileURL(listPath).href);

    return module.default ?? null;
}

export async function copyDependencies(workspace) {
    const list = await loadDependencyList(workspace);
    const entries = list?.copy ?? [];

    if (entries.length === 0) {
        return { copied: 0, problems: [] };
    }

    const problems = [];
    const manifest = {};
    let copied = 0;

    for (const entry of entries) {
        const source = path.join(rootDir, 'node_modules', entry.from);
        const target = path.join(workspace.workspace, 'src', entry.to);

        if (!fs.existsSync(source)) {
            problems.push(`${entry.from} is not installed — run \`npm install\` first`);
            continue;
        }

        const packageName = entry.from.split('/')[0];
        const { version } = readJson(
            path.join(rootDir, 'node_modules', packageName, 'package.json'),
        );

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);

        manifest[entry.to] = { package: packageName, version, from: entry.from };
        console.log(`${workspace.packageName}: ${entry.from} v${version} -> src/${entry.to}`);
        copied += 1;
    }

    // Committed next to the files it describes, so the version each copy came from is readable
    // without diffing minified CSS.
    fs.writeFileSync(
        path.join(workspace.workspace, 'src', 'dependencies.json'),
        `${JSON.stringify({ copiedAt: new Date().toISOString(), files: manifest }, null, 4)}\n`,
    );

    return { copied, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    let total = 0;
    let failed = false;

    for (const workspace of getWorkspaces()) {
        const { copied, problems } = await copyDependencies(workspace);

        for (const problem of problems) {
            console.error(`${workspace.packageName}: ${problem}`);
            failed = true;
        }
        total += copied;
    }

    if (failed) {
        process.exit(1);
    }

    console.log(`Copied ${total} file(s)`);
}
