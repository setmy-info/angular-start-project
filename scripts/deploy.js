#!/usr/bin/env node
// Deploying is installing the packed artifacts (dist/, from `npm run package`)
// into a fresh prefix:
//
//     node scripts/deploy.js dev|test|prelive|live
//
// npm tarballs (library, LESS) are installed with npm; the Angular app archive
// is extracted next to them. No real target host is wired up yet.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { getWorkspaces, npmCommand, rootDir, toArtifactDirectoryName } from './workspace-utils.js';

const environment = process.argv[2];

if (!['dev', 'test', 'prelive', 'live'].includes(environment)) {
    console.error('Usage: node scripts/deploy.js dev|test|prelive|live');
    process.exit(1);
}

const distDir = path.join(rootDir, 'dist');
const workspaces = getWorkspaces();
const artifacts = fs.existsSync(distDir) ? fs.readdirSync(distDir) : [];
const tarballs = artifacts.filter((name) => name.endsWith('.tgz'));
const appArchives = artifacts.filter((name) => name.endsWith('.tar.gz'));

if (tarballs.length === 0 && appArchives.length === 0) {
    console.error('No dist/*.tgz or dist/*.tar.gz - run `npm run package` first');
    process.exit(1);
}

function artifactFor(packageName, extension) {
    const prefix = `${toArtifactDirectoryName(packageName)}-`;
    return artifacts.find((name) => name.startsWith(prefix) && name.endsWith(extension));
}

const deployDir = path.join(rootDir, 'build', 'deploy', environment);
fs.rmSync(deployDir, { recursive: true, force: true });
fs.mkdirSync(deployDir, { recursive: true });

// Two shapes of deployable: npm tarballs (the library and the LESS packages, installed with
// npm) and directory archives (applications and brand pages, extracted side by side). The
// second group is everything that is served rather than depended on.
const ARCHIVE_MODULE_TYPES = ['angular-app', 'brand-page'];
const npmWorkspaces = workspaces.filter(
    (workspace) => !ARCHIVE_MODULE_TYPES.includes(workspace.moduleType),
);
const specs = {};
for (const workspace of npmWorkspaces) {
    const name = artifactFor(workspace.packageName, '.tgz');
    if (!name) {
        console.error(
            `No tarball for ${workspace.packageName} in dist/ - run \`npm run package\` first`,
        );
        process.exit(1);
    }
    specs[workspace.packageName] = `file:${path.join(distDir, name)}`;
}

if (Object.keys(specs).length > 0) {
    fs.writeFileSync(
        path.join(deployDir, 'package.json'),
        JSON.stringify(
            {
                name: `angular-start-project-deploy-${environment}`,
                private: true,
                dependencies: specs,
                overrides: specs,
            },
            null,
            4,
        ) + '\n',
    );

    const install = spawnSync(
        npmCommand,
        [
            'install',
            '--omit=dev',
            '--no-audit',
            '--no-fund',
            '--loglevel=error',
            '--ignore-scripts',
        ],
        {
            cwd: deployDir,
            stdio: 'inherit',
            shell: process.platform === 'win32',
        },
    );
    if (install.status !== 0) {
        process.exit(install.status ?? 1);
    }
}

for (const workspace of workspaces.filter((item) =>
    ARCHIVE_MODULE_TYPES.includes(item.moduleType),
)) {
    const name = artifactFor(workspace.packageName, '.tar.gz');
    if (!name) {
        console.error(
            `No archive for ${workspace.packageName} in dist/ - run \`npm run package\` first`,
        );
        process.exit(1);
    }
    // One directory for everything that is served: each archive brings its own package-named
    // folder, so applications and brand pages land beside each other without colliding.
    const appDir = path.join(deployDir, 'application');
    fs.mkdirSync(appDir, { recursive: true });
    const extract = spawnSync('tar', ['-xzf', path.join(distDir, name), '-C', appDir], {
        stdio: 'inherit',
    });
    if (extract.status !== 0) {
        process.exit(extract.status ?? 1);
    }
    // Every module archive carries one top-level directory named after the package, so that any
    // number of them can be unpacked into the same place without colliding.
    const extractedDir = path.join(appDir, workspace.packageName);
    if (!fs.existsSync(path.join(extractedDir, 'index.html'))) {
        console.error(
            `${workspace.packageName}: packed archive is missing ${workspace.packageName}/index.html`,
        );
        process.exit(1);
    }
    console.log(`${workspace.packageName} extracted to ${path.relative(rootDir, extractedDir)}`);
}

console.log(`Installed into ${path.relative(rootDir, deployDir)} for ${environment}`);
