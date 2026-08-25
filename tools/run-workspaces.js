#!/usr/bin/env node

import path from 'node:path';
import { execSync } from 'node:child_process';

import {
    getWorkspaces,
    npmCommand,
    rootDir,
    sortWorkspacesTopologically,
} from './workspace-utils.js';

const lifecycle = process.argv[2];

if (!lifecycle) {
    console.error('Usage: node ./tools/run-workspaces.js <lifecycle>');
    process.exit(1);
}

const forwardArgs = process.argv.slice(3);
const workspaces = sortWorkspacesTopologically(getWorkspaces());
const reverseLifecycles = new Set(['clean']);
const orderedWorkspaces = reverseLifecycles.has(lifecycle) ? [...workspaces].reverse() : workspaces;

// Maven's default is fail-fast across modules, and that stays the default
// here: a broken `build` must not let later modules compile against stale
// artifacts. The test and cleanup lifecycles are the documented exception
// (`mvn -fae`): stopping at the first red module hid the other six modules'
// results entirely, and - worse - skipped their post-*-test steps, leaving
// every server started by pre-*-test listening after the run.
const failAtEndLifecycles = new Set([
    'clean',
    'test',
    'pre-integration-test',
    'integration-test',
    'post-integration-test',
    'pre-e2e-test',
    'e2e-test',
    'post-e2e-test',
]);
const failAtEnd = failAtEndLifecycles.has(lifecycle);
const failures = [];

for (const workspace of orderedWorkspaces) {
    const script = workspace.packageJson.scripts?.[lifecycle];

    if (!script) {
        continue;
    }

    console.log(`\n=== ${workspace.packageName}: ${lifecycle} ===`);

    const args = ['run', lifecycle];

    if (forwardArgs.length > 0) {
        args.push('--', ...forwardArgs);
    }

    try {
        execSync(`${npmCommand} ${args.join(' ')}`, {
            cwd: workspace.workspace,
            stdio: 'inherit',
            env: {
                ...process.env,
                npm_config_local_prefix: workspace.workspace,
            },
        });
    } catch (error) {
        // The child already streamed its own diagnostics to this terminal;
        // re-throwing would bury them under a Node stack trace of internal
        // child_process frames that says nothing about the failure.
        const status = typeof error.status === 'number' ? error.status : 1;

        failures.push({ packageName: workspace.packageName, status });
        console.error(`\n${workspace.packageName}: ${lifecycle} FAILED (exit ${status})`);

        if (!failAtEnd) {
            process.exit(status);
        }
    }
}

if (orderedWorkspaces.length === 0) {
    console.warn(`No workspace packages found under ${path.relative(process.cwd(), rootDir)}.`);
}

if (failures.length > 0) {
    console.error(`\n=== ${lifecycle}: ${failures.length} module(s) failed ===`);

    for (const failure of failures) {
        console.error(`  - ${failure.packageName} (exit ${failure.status})`);
    }

    process.exit(1);
}
