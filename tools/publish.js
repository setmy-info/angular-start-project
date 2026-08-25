#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getWorkspaceInfo, npmCommand } from './workspace-utils.js';

// Pure decision logic, exported and unit-tested directly
// (tools/test/unit/publish.test.js) - no subprocess, no fs, no network.
export function resolveDistTag(branchName) {
    if (branchName === 'master') {
        return 'latest';
    }

    if (branchName.startsWith('release')) {
        return 'release-candidate';
    }

    if (branchName.startsWith('devel')) {
        return 'next';
    }

    // hotfix*: a candidate for master, published on its own dist-tag so the
    // exact build under review can be installed (never "latest").
    if (branchName.startsWith('hotfix')) {
        return 'hotfix';
    }

    return null;
}

export function resolveBranch(workspace) {
    if (process.env.BRANCH_NAME) {
        return process.env.BRANCH_NAME;
    }

    if (process.env.CI_BRANCH_NAME) {
        return process.env.CI_BRANCH_NAME;
    }

    try {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: workspace.workspace,
            encoding: 'utf8',
        }).trim();
    } catch {
        return 'unknown';
    }
}

function main() {
    const workspace = getWorkspaceInfo();
    // A private package (the Angular application) has no registry to publish
    // to - its artifact is deployed, not published. Skipping is correct here,
    // not a gap.
    if (workspace.packageJson.private) {
        console.log(
            `Skipping publish for ${workspace.packageName}: package is private (deployed, not published).`,
        );
        process.exit(0);
    }

    const branch = resolveBranch(workspace);
    const tag = resolveDistTag(branch);

    if (!tag) {
        console.log(
            `Skipping publish for ${workspace.packageName}: branch "${branch}" is not a publish branch (master/devel*/release*/hotfix*).`,
        );
        process.exit(0);
    }

    // Only ever executes for real when PUBLISH_EXECUTE=true is set
    // explicitly - nothing in Jenkinsfile/ci.yml sets it, so CI always stays
    // dry-run until a real registry/target is ready and someone opts in on
    // purpose.
    const execute = process.env.PUBLISH_EXECUTE === 'true';
    const args = ['publish', '--tag', tag];

    if (!execute) {
        args.push('--dry-run');
    }

    // --ignore-scripts is required, not optional: package.json's "publish"
    // script (this very script, invoked as `npm run publish`) shares its
    // name with npm's own "publish" lifecycle hook, which `npm publish` runs
    // automatically. Without --ignore-scripts, the execSync call below would
    // make npm re-invoke this exact script, which would call `npm publish`
    // again, forever.
    args.push('--ignore-scripts');

    console.log(
        `${execute ? 'Publishing' : 'Dry-run publishing'} ${workspace.packageName}@${workspace.packageJson.version} to dist-tag "${tag}"`,
    );

    try {
        execSync(`${npmCommand} ${args.join(' ')}`, {
            cwd: workspace.workspace,
            stdio: ['ignore', 'inherit', 'pipe'],
            encoding: 'utf8',
        });
    } catch (error) {
        const output = `${error.stderr ?? ''}${error.stdout ?? ''}`;

        // These packages are REAL, already-published npm packages (unlike the
        // demo modules in the sibling repos), so a dry run of an unchanged
        // version legitimately hits "cannot publish over the previously
        // published versions". That means "this version is already released,
        // nothing to do" - a version bump is what makes a publish happen, and
        // failing every CI build until someone bumps would be wrong.
        if (output.includes('cannot publish over')) {
            console.log(
                `Skipping ${workspace.packageName}@${workspace.packageJson.version}: this version is already published — bump the version to release a new one.`,
            );
            return;
        }

        process.stderr.write(output);
        throw error;
    }
}

// Guarded the same way tools/run-tests.js guards runPhaseTests: only run
// the live script when this file is the process entry point, not when it's
// imported (e.g. by the unit tests for resolveDistTag/resolveBranch).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
