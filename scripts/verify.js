#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { collectFiles, getWorkspaces } from './workspace-utils.js';
import { readRuleCount, resolveExpectation } from './css-utils.js';

let failed = false;

for (const workspace of getWorkspaces()) {
    if (!verifyWorkspace(workspace)) {
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

function verifyWorkspace(workspace) {
    const errors = [];

    switch (workspace.moduleType) {
        case 'angular-app':
            verifyAngularApp(workspace, errors);
            break;
        case 'less-package':
            verifyLessPackage(workspace, errors);
            break;
        default:
            verifyJsLibrary(workspace, errors);
    }

    if (errors.length > 0) {
        console.error(`\n${workspace.packageName}: verification failed:`);
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        return false;
    }
    return true;
}

function verifyAngularApp(workspace, errors) {
    const browserDir = path.join(workspace.workspace, 'dist', 'application', 'browser');
    const indexHtml = path.join(browserDir, 'index.html');
    const buildInfoPath = path.join(workspace.workspace, 'dist', 'build-info.json');

    if (!fs.existsSync(indexHtml)) {
        errors.push(`Missing build artifact: ${indexHtml}`);
    }
    if (!fs.existsSync(buildInfoPath)) {
        errors.push(`Missing build artifact: ${buildInfoPath}`);
    }

    if (declaresServiceWorker(workspace) && fs.existsSync(browserDir)) {
        for (const name of ['ngsw.json', 'ngsw-worker.js', 'manifest.webmanifest']) {
            const artifact = path.join(browserDir, name);
            if (!fs.existsSync(artifact)) {
                errors.push(`Missing build artifact: ${artifact}`);
            }
        }
        if (fs.existsSync(path.join(browserDir, 'ngsw.json'))) {
            verifyPwaArtifacts(browserDir, errors);
        }
    }

    if (errors.length === 0) {
        console.log(`Verified ${workspace.packageName} (angular-app browser output)`);
    }
}

function verifyLessPackage(workspace, errors) {
    const requiredArtifacts = ['index.css', 'index.min.css'].map((artifact) =>
        path.join(workspace.distDir, artifact),
    );
    for (const artifact of requiredArtifacts) {
        if (!fs.existsSync(artifact)) {
            errors.push(`Missing build artifact: ${artifact}`);
        }
    }

    if (errors.length === 0) {
        const expectation = resolveExpectation(workspace.packageJson);
        const rules = readRuleCount(requiredArtifacts[0]);
        if (expectation === 'content' && rules === 0) {
            errors.push(
                `dist/index.css has no CSS rules, but this package is declared as content ` +
                    `(set config.cssExpectation to "skeleton" in package.json if it is an intentional placeholder).`,
            );
        } else {
            console.log(
                `Verified ${workspace.packageName} (${rules} rule(s), expectation: ${expectation})`,
            );
        }
    }
}

function verifyJsLibrary(workspace, errors) {
    const forbidden = [];
    for (const file of collectFiles(path.join(workspace.workspace, 'src'))) {
        const source = fs.readFileSync(file, 'utf8');
        if (/(require\(|from\s+)['"](@angular\/|rxjs)/.test(source)) {
            forbidden.push(path.relative(workspace.workspace, file));
        }
    }
    if (forbidden.length > 0) {
        errors.push(
            `framework independence violated - Angular/RxJS imported in: ${forbidden.join(', ')}`,
        );
    }

    const buildInfoPath = path.join(workspace.distDir, 'build-info.json');
    if (!fs.existsSync(buildInfoPath)) {
        errors.push(`Missing build artifact: ${buildInfoPath}`);
    } else {
        const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
        for (const key of ['packageName', 'version', 'entry', 'builtAt']) {
            if (!(key in buildInfo)) {
                errors.push(`Build artifact ${buildInfoPath} missing required key: ${key}`);
            }
        }
    }

    if (errors.length === 0) {
        console.log(`Verified ${workspace.packageName} (js-library, no Angular/RxJS)`);
    }
}

function declaresServiceWorker(workspace) {
    const angularJsonPath = path.join(workspace.workspace, 'angular.json');
    if (!fs.existsSync(angularJsonPath)) {
        return false;
    }
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    return Object.values(angularJson.projects ?? {}).some((project) =>
        Boolean((project.architect ?? project.targets ?? {}).build?.options?.serviceWorker),
    );
}

function verifyPwaArtifacts(directory, errors) {
    const ngsw = readJson(path.join(directory, 'ngsw.json'), 'ngsw.json', errors);
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

    const manifest = readJson(
        path.join(directory, 'manifest.webmanifest'),
        'manifest.webmanifest',
        errors,
    );
    if (manifest) {
        const icons = manifest.icons ?? [];
        if (icons.length === 0) {
            errors.push('manifest.webmanifest: no icons');
        }
        for (const icon of icons) {
            const iconPath = path.join(directory, String(icon.src ?? '').replace(/^\//, ''));
            if (!icon.src || !fs.existsSync(iconPath)) {
                errors.push(`manifest.webmanifest: icon "${icon.src}" is not in the artifact`);
            }
        }
    }
}

function readJson(filePath, label, errors) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        errors.push(`${label}: not valid JSON (${error.message})`);
        return null;
    }
}
