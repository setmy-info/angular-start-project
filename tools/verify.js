#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaceInfo } from './workspace-utils.js';

// Verify (Maven `verify`): the artifacts Compile promised exist and are
// well-formed, per module type.
const workspace = getWorkspaceInfo();
const required = [];
const errors = [];
// Set for an angular-app whose angular.json declares a service worker - see
// verifyPwaArtifacts() below.
let browserDir = null;

switch (workspace.moduleType) {
    case 'angular-app':
        // build-info.json records the profile the artifact was built with -
        // the e2e tier reads it, so a missing marker is a broken build.
        required.push(path.join(workspace.workspace, 'dist', 'build-info.json'));
        browserDir = path.join(workspace.workspace, 'dist', 'application', 'browser');
        required.push(path.join(browserDir, 'index.html'));

        if (declaresServiceWorker()) {
            // The PWA control files. ngsw.json is the generated manifest the
            // worker reads at runtime; without it (or with an empty asset
            // list) the app installs and then serves nothing offline.
            required.push(
                path.join(browserDir, 'ngsw.json'),
                path.join(browserDir, 'ngsw-worker.js'),
                path.join(browserDir, 'manifest.webmanifest'),
            );
        } else {
            browserDir = null;
        }
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

if (browserDir) {
    verifyPwaArtifacts(browserDir);
}

if (errors.length > 0) {
    console.error('');
    console.error(`Verification failed for ${workspace.packageName}:`);

    for (const error of errors) {
        console.error(`- ${error}`);
    }

    process.exit(1);
}

console.log(`Verified build artifacts for ${workspace.packageName} (${workspace.moduleType})`);

// Whether angular.json asks any project's build for a service worker. The
// PWA assertions below follow that declaration instead of hard-coding it, so
// a copy of this template that deliberately drops the service worker still
// passes Verify.
function declaresServiceWorker() {
    const angularJsonPath = path.join(workspace.workspace, 'angular.json');

    if (!fs.existsSync(angularJsonPath)) {
        return false;
    }

    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

    return Object.values(angularJson.projects ?? {}).some((project) =>
        Boolean((project.architect ?? project.targets ?? {}).build?.options?.serviceWorker),
    );
}

// Existence is not enough here. The failure this catches is the one that
// costs the most to find in the field: a build that emits all three control
// files but caches nothing, or a manifest whose icons 404 - the app installs,
// looks fine, and is a blank page the first time it is opened offline.
function verifyPwaArtifacts(directory) {
    const ngsw = readJson(path.join(directory, 'ngsw.json'), 'ngsw.json');

    if (ngsw) {
        const assetGroups = ngsw.assetGroups ?? [];
        const cachedUrls = assetGroups.flatMap((group) => group.urls ?? []);

        if (!ngsw.index) {
            errors.push('ngsw.json: no "index" - there is no app shell to serve offline');
        }

        if (cachedUrls.length === 0) {
            errors.push('ngsw.json: asset groups are empty - nothing would be available offline');
        }

        for (const url of [ngsw.index, '/manifest.webmanifest']) {
            if (url && !cachedUrls.includes(url)) {
                errors.push(`ngsw.json: ${url} is not in any asset group, so it is never cached`);
            }
        }
    }

    const manifest = readJson(path.join(directory, 'manifest.webmanifest'), 'manifest.webmanifest');

    if (manifest) {
        const icons = manifest.icons ?? [];

        if (icons.length === 0) {
            errors.push('manifest.webmanifest: no icons');
        }

        for (const icon of icons) {
            // Manifest icon paths are relative to the manifest, which sits at
            // the browser root next to the assets it points at.
            const iconPath = path.join(directory, String(icon.src ?? '').replace(/^\//, ''));

            if (!icon.src || !fs.existsSync(iconPath)) {
                errors.push(`manifest.webmanifest: icon "${icon.src}" is not in the artifact`);
            }
        }

        if (
            !icons.some((icon) =>
                String(icon.purpose ?? '')
                    .split(/\s+/)
                    .includes('maskable'),
            )
        ) {
            // Not fatal: Android just falls back to shrinking the "any" icon
            // inside a white circle, which looks wrong but still installs.
            console.warn(
                'manifest.webmanifest: no maskable icon - Android will letterbox the launcher icon',
            );
        }
    }
}

function readJson(filePath, label) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        errors.push(`${label}: not valid JSON (${error.message})`);
        return null;
    }
}
