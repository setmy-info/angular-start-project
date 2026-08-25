#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { ensureDirectory, getWorkspaceInfo, resolveLocalBin } from './workspace-utils.js';
import { runPhaseTests } from './run-tests.js';

// Coverage (Maven `jacoco:report`) - report, never a gate. Unit tier only:
// the e2e tier needs a Selenium grid, so folding it in would make "coverage"
// fail for reasons that have nothing to do with coverage (the same scoping
// decision the Elixir sibling had to make).
const workspace = getWorkspaceInfo();

if (workspace.moduleType === 'angular-app') {
    console.log(`Running coverage for ${workspace.packageName} (ng test --coverage)`);
    execFileSync(
        resolveLocalBin('ng'),
        [
            'test',
            // Same TTY watch-mode default as the test phase - a report phase
            // must terminate.
            '--watch=false',
            '--coverage',
            '--coverage-reporters=lcov',
            '--coverage-reporters=text',
        ],
        { cwd: workspace.workspace, stdio: 'inherit' },
    );

    // The Angular CLI writes coverage under coverage/<project>/; the Site
    // phase reads site/coverage/lcov.info for every module type, so normalise
    // the location instead of teaching the report tool three layouts.
    const coverageDir = path.join(workspace.workspace, 'site', 'coverage');
    const produced = path.join(workspace.workspace, 'coverage').toString();

    ensureDirectory(coverageDir);

    for (const entry of fs.existsSync(produced)
        ? fs.readdirSync(produced, { withFileTypes: true })
        : []) {
        const candidate = path.join(produced, entry.name, 'lcov.info');

        if (entry.isDirectory() && fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, path.join(coverageDir, 'lcov.info'));
            console.log(`Copied ${candidate} -> ${coverageDir}/lcov.info`);
            break;
        }
    }
} else {
    // node --test's lcov reporter will not create its destination directory.
    const coverageDir = path.join(workspace.workspace, 'site', 'coverage');

    ensureDirectory(coverageDir);
    runPhaseTests('unit', [
        '--experimental-test-coverage',
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        '--test-reporter=lcov',
        `--test-reporter-destination=${path.join(coverageDir, 'lcov.info')}`,
    ]);
}
