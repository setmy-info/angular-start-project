#!/usr/bin/env node
// Publish every non-private workspace to the npm registry. Dist-tag follows
// the branch (master → latest); Jenkins only runs this from master, with
// NPM_TOKEN through .npmrc.publish. A version that is already on the registry
// is reported and is not a build failure - bump the version to release a new
// one. The private Angular app is skipped.
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    getWorkspaces,
    npmCommand,
    rootDir,
    sortWorkspacesTopologically,
} from './workspace-utils.js';

export function resolveDistTag(branchName) {
    if (branchName === 'master') {
        return 'latest';
    }
    return null;
}

export function resolveBranch() {
    if (process.env.BRANCH_NAME) {
        return process.env.BRANCH_NAME;
    }
    if (process.env.CI_BRANCH_NAME) {
        return process.env.CI_BRANCH_NAME;
    }
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: rootDir,
            encoding: 'utf8',
        }).trim();
    } catch {
        return 'unknown';
    }
}

function publishWorkspace(workspace, tag, execute) {
    if (workspace.packageJson.private) {
        console.log(`Skipping ${workspace.packageName}: private`);
        return;
    }
    const args = ['publish', '--tag', tag, '--ignore-scripts'];
    if (!execute) {
        args.push('--dry-run');
    }
    console.log(
        `${execute ? 'Publishing' : 'Dry-run publishing'} ${workspace.packageName}@${workspace.packageJson.version} to dist-tag "${tag}"`,
    );
    const result = spawnSync(npmCommand, args, {
        cwd: workspace.workspace,
        encoding: 'utf8',
        shell: process.platform === 'win32',
    });
    const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;
    if (result.status === 0) {
        process.stdout.write(result.stdout ?? '');
        return;
    }
    if (output.includes('cannot publish over')) {
        console.log(
            `Skipping ${workspace.packageName}@${workspace.packageJson.version}: this version is already published — bump the version to release a new one.`,
        );
        return;
    }
    process.stderr.write(output);
    process.exit(result.status ?? 1);
}

function main() {
    const branch = resolveBranch();
    const tag = resolveDistTag(branch);
    if (!tag) {
        console.log(`Skipping publish: branch "${branch}" is not a publish branch (master).`);
        return;
    }
    const execute = process.env.PUBLISH_EXECUTE === 'true' || Boolean(process.env.NPM_TOKEN);
    for (const workspace of sortWorkspacesTopologically(getWorkspaces())) {
        publishWorkspace(workspace, tag, execute);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main();
}
