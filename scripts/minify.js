#!/usr/bin/env node
// Minifies a package's own CSS and JS in place — the .min twin lands next to the original, in
// the source tree, and is committed with it.
//
//     npm run minify
//     npm run minify --workspace=angular-start-project-brandpage
//
// The list lives in the package's own dependencies.js (`minify`). esbuild does both languages,
// picked by the file extension. Nothing is bundled: each file is minified on its own, so the
// output is the same code with the whitespace taken out — still plain CSS and plain JS.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { getWorkspaces, resolveLocalBin } from './workspace-utils.js';
import { loadDependencyList } from './dependencies.js';

export async function minifyPackage(workspace) {
    const list = await loadDependencyList(workspace);
    const entries = list?.minify ?? [];

    if (entries.length === 0) {
        return { minified: 0, problems: [] };
    }

    const problems = [];
    let minified = 0;

    for (const entry of entries) {
        const source = path.join(workspace.workspace, 'src', entry.from);
        const target = path.join(workspace.workspace, 'src', entry.to);

        if (!fs.existsSync(source)) {
            problems.push(`src/${entry.from} does not exist`);
            continue;
        }

        // esbuild picks the language from the file extension; --loader is for stdin only.
        execFileSync(
            resolveLocalBin('esbuild'),
            [source, '--minify', `--outfile=${target}`, '--log-level=warning'],
            { stdio: 'inherit' },
        );

        const before = fs.statSync(source).size;
        const after = fs.statSync(target).size;

        console.log(
            `${workspace.packageName}: src/${entry.from} -> src/${entry.to} (${before} -> ${after} bytes)`,
        );
        minified += 1;
    }

    return { minified, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    let total = 0;
    let failed = false;

    for (const workspace of getWorkspaces()) {
        const { minified, problems } = await minifyPackage(workspace);

        for (const problem of problems) {
            console.error(`${workspace.packageName}: ${problem}`);
            failed = true;
        }
        total += minified;
    }

    if (failed) {
        process.exit(1);
    }

    console.log(`Minified ${total} file(s)`);
}
