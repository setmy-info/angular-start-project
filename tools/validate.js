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

function collectFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(js|mjs|cjs|ts)$/.test(entry.name))
        .map((entry) => path.join(entry.parentPath, entry.name));
}
