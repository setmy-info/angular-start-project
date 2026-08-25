#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { clearFailure, recordFailure } from './failsafe.js';
import { getWorkspaceInfo, resolveLocalBin } from './workspace-utils.js';

const phase = process.argv[2];
const cliArgs = process.argv.slice(3);

// Test tiers, dispatched by module type. The tier NAMES and their order are
// the Maven ones for every package; the runner is whatever suits the module:
//   angular-app  - unit: `ng test` (Angular CLI / Vitest, the specs next to
//                  the components); e2e: jest + Selenium against the BUILT
//                  app served by pre-e2e-test.
//   js-library   - node --test, zero extra tooling, so the framework-free
//                  library needs no framework-specific test runner either.
//   less-package - no unit tier; the integration tier checks compiled CSS.
// The integration and e2e tiers are Maven FAILSAFE tiers: they must never
// abort the script chain where they run, or the paired post-*-test cleanup
// never executes and every server started by pre-*-test is left listening.
// A failure is recorded and re-raised by post-integration-test /
// post-e2e-test (tools/failsafe.js, ported from the setmy-info-less sibling).
// The unit tier is SUREFIRE: it fails immediately, like `mvn test`.
const DEFERRED_PHASES = new Set(['integration', 'e2e']);

export function runPhaseTests(requestedPhase, extraArgs = cliArgs) {
    const workspace = getWorkspaceInfo();
    const deferred = DEFERRED_PHASES.has(requestedPhase);

    if (deferred) {
        clearFailure(requestedPhase, workspace.packageName);
    }

    try {
        if (workspace.moduleType === 'angular-app') {
            return runAngularAppTests(workspace, requestedPhase, extraArgs);
        }

        return runNodeTests(workspace, requestedPhase, extraArgs);
    } catch (error) {
        if (!deferred) {
            process.exit(typeof error.status === 'number' ? error.status : 1);
        }

        recordFailure(requestedPhase, workspace.packageName, {
            status: typeof error.status === 'number' ? error.status : 1,
            signal: error.signal ?? null,
        });
        console.error(
            `${workspace.packageName}: ${requestedPhase} tests FAILED - deferred to post-${requestedPhase === 'e2e' ? 'e2e' : 'integration'}-test (Maven failsafe behaviour)`,
        );
    }
}

function runAngularAppTests(workspace, requestedPhase, extraArgs) {
    if (requestedPhase === 'unit') {
        console.log(`Running unit tests for ${workspace.packageName} (ng test)`);
        // --watch=false explicitly: the Angular CLI defaults watch mode to
        // TRUE in a TTY, so a plain `npm test` in a terminal sits in Vitest's
        // interactive watcher ("press h to show help, press q to quit")
        // instead of running once and exiting. A lifecycle phase must behave
        // identically whether a human, a script or Jenkins invokes it -
        // `mvn test` runs the tests and returns. Use `npm run test:watch` for
        // the interactive watcher.
        execFileSync(resolveLocalBin('ng'), ['test', '--watch=false', ...extraArgs], {
            cwd: workspace.workspace,
            stdio: 'inherit',
        });
        return;
    }

    if (requestedPhase === 'e2e') {
        const configPath = path.join(workspace.workspace, 'jest.e2e.config.js');

        if (!fs.existsSync(configPath)) {
            console.log(`No e2e tests for ${workspace.packageName}`);
            return;
        }

        // Point the suite at the instance pre-e2e-test started (the BUILT
        // app), not at a dev server someone may have running by hand.
        const port = workspace.packageJson.config?.server?.port;
        const baseUrl =
            process.env.APP_BASE_URL ?? (port ? `http://127.0.0.1:${port + 1}` : undefined);

        // The app under test reports its OWN environment, so any assertion
        // about it has to follow the artifact being served - not an env var
        // someone remembered to export. Build recorded the profile it used in
        // dist/build-info.json; read it back and hand it to the suite.
        const buildInfoPath = path.join(workspace.workspace, 'dist', 'build-info.json');
        const builtProfile = fs.existsSync(buildInfoPath)
            ? JSON.parse(fs.readFileSync(buildInfoPath, 'utf8')).profile
            : undefined;

        console.log(
            `Running e2e tests for ${workspace.packageName} against ${baseUrl}` +
                (builtProfile ? ` (built with profile "${builtProfile}")` : ''),
        );
        execFileSync(resolveLocalBin('jest'), ['--config=jest.e2e.config.js', ...extraArgs], {
            cwd: workspace.workspace,
            stdio: 'inherit',
            env: {
                ...process.env,
                ...(baseUrl ? { APP_BASE_URL: baseUrl } : {}),
                ...(builtProfile
                    ? { BUILD_PROFILE: process.env.BUILD_PROFILE ?? builtProfile }
                    : {}),
            },
        });
        return;
    }

    runNodeTests(workspace, requestedPhase, extraArgs);
}

function runNodeTests(workspace, requestedPhase, extraArgs) {
    const directory = path.join(workspace.workspace, 'test', requestedPhase);

    if (!fs.existsSync(directory)) {
        console.log(`No ${requestedPhase} tests found for ${workspace.packageName}`);
        return;
    }

    const testFiles = fs
        .readdirSync(directory, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.test.js'))
        .map((entry) =>
            path.relative(workspace.workspace, path.join(entry.parentPath, entry.name)),
        );

    if (testFiles.length === 0) {
        console.log(`No ${requestedPhase} test files found for ${workspace.packageName}`);
        return;
    }

    console.log(`Running ${requestedPhase} tests for ${workspace.packageName}`);
    execFileSync(process.execPath, ['--test', ...extraArgs, ...testFiles], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
}

if (phase) {
    runPhaseTests(phase, cliArgs);
}
