#!/usr/bin/env node
// One test tier at a time, dispatched by module type:
//
//     npm test                    unit
//     npm run integration-test    integration
//     npm run e2e-test            e2e
//     npm run coverage            unit tier under coverage (reports/coverage/)
//
//   angular-app  - unit: `ng test` (Vitest); e2e: jest + Selenium against the
//                  BUILT app served by pre-e2e-test.
//   js-library   - node --test under test/<tier>/.
//   less-package - no unit/integration/e2e suites of their own.
//
// Coverage is the unit tier only: the e2e tier needs an external Selenium
// Grid, so folding it in would make "coverage" fail for reasons that have
// nothing to do with coverage. Every run also writes JUnit XML to
// reports/junit/<name>.xml - what Jenkins' junit step reads.
//
// This runner only runs tests. What the integration and e2e tiers need around
// them (static servers for the built app) is the lifecycle's job:
//
//     npm run pre-e2e-test
//     npm run e2e-test
//     npm run post-e2e-test       # idempotent - run it after a failed tier too
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { getWorkspaces, resolveLocalBin, rootDir } from './workspace-utils.js';

const TIERS = ['unit', 'integration', 'e2e'];
const tier = process.argv[2];

if (!tier || (tier !== 'coverage' && !TIERS.includes(tier))) {
    console.error('Usage: node scripts/test.js unit|integration|e2e|coverage');
    process.exit(1);
}

const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(path.join(reportsDir, 'junit'), { recursive: true });

function run(command, args, extraEnv = {}, cwd = rootDir) {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...extraEnv },
        shell: process.platform === 'win32',
    });
    return result.status ?? 1;
}

function nodeTestArgs(pattern, junitName, { coverage = false } = {}) {
    const args = [
        '--test',
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        '--test-reporter=junit',
        `--test-reporter-destination=${path.join(reportsDir, 'junit', `${junitName}.xml`)}`,
        pattern,
    ];
    if (coverage) {
        fs.mkdirSync(path.join(reportsDir, 'coverage'), { recursive: true });
        args.splice(
            1,
            0,
            '--experimental-test-coverage',
            '--test-reporter=lcov',
            `--test-reporter-destination=${path.join(reportsDir, 'coverage', `${junitName}.lcov.info`)}`,
        );
    }
    return args;
}

function hasTestFiles(directory, suffix) {
    if (!fs.existsSync(directory)) {
        return false;
    }
    return fs
        .readdirSync(directory, { recursive: true, withFileTypes: true })
        .some((entry) => entry.isFile() && entry.name.endsWith(suffix));
}

let status = 0;

if (tier === 'unit' || tier === 'coverage') {
    const scriptsUnitDir = path.join(rootDir, 'scripts', 'test', 'unit');
    if (hasTestFiles(scriptsUnitDir, '.test.js')) {
        status = run(
            process.execPath,
            nodeTestArgs(path.join('scripts', 'test', 'unit', '**', '*.test.js'), 'unit-scripts', {
                coverage: false,
            }),
        );
        if (status !== 0) {
            process.exit(status);
        }
    }

    for (const workspace of getWorkspaces()) {
        if (workspace.moduleType === 'js-library') {
            const unitDir = path.join(workspace.workspace, 'test', 'unit');
            if (!hasTestFiles(unitDir, '.test.js')) {
                continue;
            }
            const rel = path.relative(rootDir, path.join(unitDir, '**', '*.test.js'));
            status = run(
                process.execPath,
                nodeTestArgs(rel, `unit-${workspace.packageName}`, {
                    coverage: tier === 'coverage',
                }),
            );
            if (status !== 0) {
                process.exit(status);
            }
        }

        if (workspace.moduleType === 'angular-app') {
            const ngArgs = ['test', '--watch=false'];
            if (tier === 'coverage') {
                ngArgs.push('--coverage', '--coverage-reporters=lcov', '--coverage-reporters=text');
            }
            console.log(
                `Running ${tier === 'coverage' ? 'coverage' : 'unit'} tests for ${workspace.packageName} (ng test)`,
            );
            status = run(resolveLocalBin('ng'), ngArgs, {}, workspace.workspace);
            if (status !== 0) {
                process.exit(status);
            }
            if (tier === 'coverage') {
                const coverageDir = path.join(reportsDir, 'coverage');
                fs.mkdirSync(coverageDir, { recursive: true });
                const produced = path.join(workspace.workspace, 'coverage');
                if (fs.existsSync(produced)) {
                    for (const entry of fs.readdirSync(produced, { withFileTypes: true })) {
                        const candidate = path.join(produced, entry.name, 'lcov.info');
                        if (entry.isDirectory() && fs.existsSync(candidate)) {
                            fs.copyFileSync(candidate, path.join(coverageDir, 'lcov.info'));
                            console.log(`Copied ${candidate} -> ${coverageDir}/lcov.info`);
                            break;
                        }
                    }
                }
            }
        }
    }
}

if (tier === 'integration') {
    for (const workspace of getWorkspaces()) {
        if (workspace.moduleType !== 'js-library') {
            continue;
        }
        const integrationDir = path.join(workspace.workspace, 'test', 'integration');
        if (!hasTestFiles(integrationDir, '.test.js')) {
            console.log(`No integration tests for ${workspace.packageName}`);
            continue;
        }
        const rel = path.relative(rootDir, path.join(integrationDir, '**', '*.test.js'));
        status = run(process.execPath, nodeTestArgs(rel, 'integration'));
        if (status !== 0) {
            process.exit(status);
        }
    }
}

if (tier === 'e2e') {
    const app = getWorkspaces().find((workspace) => workspace.moduleType === 'angular-app');
    if (!app) {
        console.log('No angular-app workspace to run e2e against');
        process.exit(0);
    }
    const configPath = path.join(app.workspace, 'jest.e2e.config.js');
    if (!fs.existsSync(configPath)) {
        console.log(`No e2e tests for ${app.packageName}`);
        process.exit(0);
    }
    const port = app.packageJson.config?.server?.port;
    const baseUrl = process.env.APP_BASE_URL ?? (port ? `http://127.0.0.1:${port + 1}` : undefined);
    const buildInfoPath = path.join(app.workspace, 'dist', 'build-info.json');
    const builtProfile = fs.existsSync(buildInfoPath)
        ? JSON.parse(fs.readFileSync(buildInfoPath, 'utf8')).profile
        : undefined;
    const profile = process.env.SMI_PROFILES ?? builtProfile;
    console.log(
        `Running e2e tests for ${app.packageName} against ${baseUrl}` +
            (profile ? ` (built with profile "${profile}")` : ''),
    );
    const jestBin = resolveLocalBin('jest');
    status = run(
        jestBin,
        [
            `--config=${configPath}`,
            '--reporters=default',
            '--reporters=jest-junit',
            '--testTimeout=60000',
            '--maxWorkers=1',
        ],
        {
            ...(baseUrl ? { APP_BASE_URL: baseUrl } : {}),
            ...(profile ? { SMI_PROFILES: profile } : {}),
            JEST_JUNIT_OUTPUT_DIR: path.join(reportsDir, 'junit'),
            JEST_JUNIT_OUTPUT_NAME: 'e2e.xml',
            JEST_JUNIT_ADD_FILE_ATTRIBUTE: 'true',
        },
        app.workspace,
    );
    if (status !== 0) {
        process.exit(status);
    }
}

process.exit(0);
