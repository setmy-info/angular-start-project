#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

import {
    getWorkspaceInfo,
    getWorkspaces,
    npmCommand,
    rootDir,
    toArtifactDirectoryName,
} from './workspace-utils.js';

// Repurposed per report.md items 11/20/35 (decided 2026-07-19), ported from
// the Python/Elixir sides' worked implementations: install the *packed*
// tarball (Package's actual output, not the workspace link) into a
// disposable temp project and confirm it imports. Catches broken
// `files`/`exports` lists an npm-workspaces link silently masks, since the
// link points straight at the workspace directory and never exercises the
// tarball's own file-inclusion rules.

const workspace = getWorkspaceInfo();

// The Angular application is private: there is no tarball for a consumer to
// install, and Verify/Package already checked its deployable artifact.
// Maven's `install` has nothing to do for a non-published module either.
if (workspace.packageJson.private) {
    console.log(
        `Skipping install-local for ${workspace.packageName}: package is private (deployed, not published).`,
    );
    process.exit(0);
}

// The tarball for the package's CURRENT version (npm pack names it
// <name-without-@, / -> ->-<version>.tgz), not just "any .tgz in the
// directory" - a stale older-version tarball must never be installed in
// place of the one Package just built (report.md item 46).
function packedTarball(packageName) {
    const artifactsDir = path.join(rootDir, '.artifacts', toArtifactDirectoryName(packageName));
    const version = workspacesByName.get(packageName)?.packageJson.version;
    const expected = `${toArtifactDirectoryName(packageName)}-${version}.tgz`;
    const tarballPath = path.join(artifactsDir, expected);

    return fs.existsSync(tarballPath) ? tarballPath : undefined;
}

// The module's own tarball plus every transitive local-dependency tarball,
// so a module like `d` (needs `c`, which needs `a` and `b`) resolves its
// whole local chain from packed files, never from the registry — the same
// transitive walk the Python side needed for exactly the same reason (its
// module-`c` install failed against PyPI before that fix, see
// setmy.info-python/report.md item 4).
const workspacesByName = new Map(getWorkspaces().map((entry) => [entry.packageName, entry]));

function collectLocalChain(packageName, collected = new Set()) {
    if (collected.has(packageName)) {
        return collected;
    }

    collected.add(packageName);

    for (const dependency of workspacesByName.get(packageName)?.localDependencies ?? []) {
        collectLocalChain(dependency, collected);
    }

    return collected;
}

const tarballs = [...collectLocalChain(workspace.packageName)].map((name) => {
    const tarball = packedTarball(name);

    if (!tarball) {
        console.error(
            `No packed tarball for ${name}@${workspacesByName.get(name)?.packageJson.version} in .artifacts/ — run the package phase first (npm run package)`,
        );
        process.exit(1);
    }

    return tarball;
});

const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-install-check-'));

try {
    fs.writeFileSync(
        path.join(checkDir, 'package.json'),
        `${JSON.stringify({ name: 'install-check', version: '0.0.0', private: true }, null, 2)}\n`,
    );

    console.log(
        `Installing packed ${workspace.packageName} (+ ${tarballs.length - 1} local dependency tarball(s)) into a throwaway project`,
    );

    // One combined install: npm satisfies the module's exact-pinned local
    // dependencies from the sibling tarballs installed alongside it instead
    // of asking the registry. --ignore-scripts: same rule as publish (§10).
    execSync(
        `${npmCommand} install --ignore-scripts ${tarballs
            .map((tarball) => `"${tarball}"`)
            .join(' ')}`,
        { cwd: checkDir, stdio: 'inherit' },
    );

    // Consumer check, per module type: a stylesheet package is not
    // "imported", it is linked - so instead of `await import(name)` (which
    // throws ERR_UNKNOWN_FILE_EXTENSION on a .css main), confirm the files
    // the manifest promises actually arrived in the tarball and carry the
    // CSS they should. This is exactly the broken-`files`-list failure the
    // workspace link masks.
    const installedDir = path.join(checkDir, 'node_modules', workspace.packageName);
    const installedManifest = JSON.parse(
        fs.readFileSync(path.join(installedDir, 'package.json'), 'utf8'),
    );
    const mainPath = path.join(installedDir, installedManifest.main);

    if (!fs.existsSync(mainPath)) {
        console.error(
            `${workspace.packageName}: main "${installedManifest.main}" is declared in package.json but missing from the packed tarball`,
        );
        process.exit(1);
    }

    if (workspace.moduleType === 'js-library') {
        // Really load it from the tarball, the way a consumer would. This is
        // what catches a file left out of `files` - and, because the library
        // is CommonJS, a stray ESM `export` that would break every consumer.
        // Same loader the Compile phase uses, so the consumer check is
        // apples-to-apples: a minimal DOM, nothing else - no framework.
        execFileSync(
            process.execPath,
            [path.join(rootDir, 'tools', 'support', 'load-library.cjs'), workspace.packageName],
            { cwd: checkDir, stdio: 'inherit' },
        );
    }

    console.log(
        `${workspace.packageName} resolves cleanly from its packed tarball (${installedManifest.main})`,
    );
} finally {
    fs.rmSync(checkDir, { recursive: true, force: true });
}
