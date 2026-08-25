#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getWorkspaceInfo, resolveLocalBin } from './workspace-utils.js';

// Validate (Maven `validate`): structural sanity per module type, plus the
// real type-check for anything TypeScript - the Angular CLI's build does
// type-check, but Validate is the gating phase that must catch it first, the
// same rule the JS sibling applies with `tsc --noEmit`.
const workspace = getWorkspaceInfo();

console.log(`Validating workspace: ${workspace.packageName} (${workspace.moduleType})`);

const errors = [];
const pkg = workspace.packageJson;

if (!pkg.name) {
    errors.push('package.json: name missing');
}

if (!pkg.version) {
    errors.push('package.json: version missing');
}

if (!fs.existsSync(workspace.srcEntry)) {
    errors.push(`entry point missing: ${path.relative(workspace.workspace, workspace.srcEntry)}`);
}

if (workspace.moduleType === 'angular-app') {
    if (!fs.existsSync(path.join(workspace.workspace, 'angular.json'))) {
        errors.push('angular.json missing');
    }

    // The Angular CLI's own configuration names ARE this app's build-time
    // profiles, so they must be exactly the ADR-0041/ADR-0042 canonical six -
    // hard-validated here rather than trusted, the same way tools/resources.js
    // validates a --profile value.
    const CANONICAL = ['local', 'dev', 'ci', 'test', 'prelive', 'live'];
    const angularJson = JSON.parse(
        fs.readFileSync(path.join(workspace.workspace, 'angular.json'), 'utf8'),
    );

    for (const [projectName, project] of Object.entries(angularJson.projects ?? {})) {
        const build = (project.architect ?? project.targets ?? {}).build;
        const configured = Object.keys(build?.configurations ?? {});
        const invalid = configured.filter((name) => !CANONICAL.includes(name));

        if (invalid.length > 0) {
            errors.push(
                `angular.json: project "${projectName}" build configurations ${invalid.join(', ')} are not ` +
                    `ADR-0041 canonical environment names (${CANONICAL.join(', ')}) - see ADR-0042`,
            );
        }
    }

    validatePwaSources(angularJson);
} else if (workspace.moduleType === 'less-package') {
    if (pkg.main !== 'index.less') {
        errors.push('package.json: main must point to index.less (this package ships LESS source)');
    }
} else if (workspace.moduleType === 'js-library') {
    if (pkg.main !== 'index.js') {
        errors.push('package.json: main must point to index.js');
    }

    // The library's whole reason to exist is being usable without a frontend
    // framework, so that is a VALIDATED property, not a convention: any
    // Angular/RxJS import in its source fails the build.
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
}

// tsc --noEmit for any package that has its own tsconfig (the Angular app).
const tsconfigPath = path.join(workspace.workspace, 'tsconfig.json');

if (fs.existsSync(tsconfigPath)) {
    try {
        execFileSync(resolveLocalBin('tsc'), ['--noEmit', '-p', tsconfigPath], {
            cwd: workspace.workspace,
            stdio: 'inherit',
        });
    } catch {
        errors.push('TypeScript type-check failed (see tsc output above)');
    }
}

if (errors.length > 0) {
    console.error('');
    console.error('Validation failed:');

    for (const error of errors) {
        console.error(`- ${error}`);
    }

    process.exit(1);
}

console.log('Validation successful');

// PWA source-level gate. An app that declares a service worker but ships a
// broken ngsw-config.json, an unlinked manifest or a manifest pointing at
// icons that are not there still BUILDS - it just silently stops being
// installable, and nobody notices until someone tries to install it. So the
// declaration in angular.json is treated as a promise and checked here;
// tools/verify.js then checks the same promise against the built artifact.
// Everything is conditional on that declaration: an app with no service
// worker is a legitimate configuration, not a failure.
function validatePwaSources(angularJson) {
    const serviceWorkerConfigs = Object.values(angularJson.projects ?? {})
        .map(
            (project) => (project.architect ?? project.targets ?? {}).build?.options?.serviceWorker,
        )
        .filter(Boolean);

    if (serviceWorkerConfigs.length === 0) {
        return;
    }

    if (!pkg.dependencies?.['@angular/service-worker']) {
        errors.push(
            'angular.json declares a service worker but @angular/service-worker is not a dependency',
        );
    }

    for (const relativeConfig of serviceWorkerConfigs) {
        // `true` means "use the default ngsw-config.json"; a string is an explicit path.
        const configPath = path.join(
            workspace.workspace,
            relativeConfig === true ? 'ngsw-config.json' : relativeConfig,
        );

        if (!fs.existsSync(configPath)) {
            errors.push(`service worker config missing: ${configPath}`);
            continue;
        }

        const ngswConfig = readJson(configPath, `service worker config ${relativeConfig}`);

        if (!ngswConfig) {
            continue;
        }

        if (!ngswConfig.index) {
            errors.push(
                `${relativeConfig}: "index" missing - the app shell has nothing to serve offline`,
            );
        }

        if (!Array.isArray(ngswConfig.assetGroups) || ngswConfig.assetGroups.length === 0) {
            errors.push(`${relativeConfig}: no assetGroups - nothing would be cached`);
        }
    }

    // The manifest is what makes the app installable; the service worker only makes it work
    // offline. Both halves are needed, and the manifest is the half nothing else would notice.
    const manifestPath = path.join(workspace.workspace, 'public', 'manifest.webmanifest');

    if (!fs.existsSync(manifestPath)) {
        errors.push('public/manifest.webmanifest missing - the app would not be installable');
        return;
    }

    const manifest = readJson(manifestPath, 'public/manifest.webmanifest');

    if (!manifest) {
        return;
    }

    for (const key of ['name', 'short_name', 'start_url', 'display', 'icons']) {
        if (!manifest[key]) {
            errors.push(`public/manifest.webmanifest: "${key}" missing`);
        }
    }

    // Chrome refuses to offer installation without an icon of at least 192px.
    const hasLargeIcon = (manifest.icons ?? []).some((icon) =>
        String(icon.sizes ?? '')
            .split(/\s+/)
            .some((size) => Number.parseInt(size, 10) >= 192),
    );

    if (!hasLargeIcon) {
        errors.push('public/manifest.webmanifest: no icon of 192x192 or larger');
    }

    const indexHtmlPath = path.join(workspace.workspace, 'src', 'index.html');

    if (fs.existsSync(indexHtmlPath)) {
        // Comments are stripped first: this file keeps the old manifest.json
        // links commented out for reference, and matching one of those would
        // make the check pass on a page that links no manifest at all.
        const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

        if (!/rel=["']manifest["']/.test(indexHtml)) {
            errors.push(
                'src/index.html: no <link rel="manifest"> - the manifest would never be read',
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

function collectFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(js|mjs|cjs|ts)$/.test(entry.name))
        .map((entry) => path.join(entry.parentPath, entry.name));
}
