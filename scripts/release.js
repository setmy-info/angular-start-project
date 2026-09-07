#!/usr/bin/env node
// Publish every non-private workspace, the Maven way: two deployables, decided
// by the branch.
//
//     devel.*  -> the -SNAPSHOT version, dist-tag "snapshot", to NPM_SNAPSHOT_REGISTRY
//     master   -> the release version (no -SNAPSHOT), dist-tag "latest", to NPM_RELEASE_REGISTRY
//
// A version that does not match its branch is refused: master never publishes a
// SNAPSHOT, develop never publishes a release. A registry that is not configured
// turns the run into a dry run, so a machine without the registries can never
// publish by accident. NPM_TOKEN goes through .npmrc.publish. A version that is
// already on the registry is reported and is not a build failure - bump the
// version to release a new one. Private workspaces (the app, the brand page) are
// skipped: their deployable is the packaged archive, not an npm package.
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    getWorkspaces,
    npmCommand,
    rootDir,
    sortWorkspacesTopologically,
} from './workspace-utils.js';

export function resolvePublishTarget(branchName, version) {
    const snapshot = /-SNAPSHOT$/.test(version);
    if (branchName === 'master') {
        if (snapshot) {
            throw new Error(
                `master publishes releases - remove -SNAPSHOT from the version (${version})`,
            );
        }
        return { tag: 'latest', registryEnv: 'NPM_RELEASE_REGISTRY' };
    }
    if (/^devel/.test(branchName)) {
        if (!snapshot) {
            throw new Error(
                `${branchName} publishes snapshots - the version must end in -SNAPSHOT (${version})`,
            );
        }
        return { tag: 'snapshot', registryEnv: 'NPM_SNAPSHOT_REGISTRY' };
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

function publishWorkspace(workspace, target, registry, execute) {
    if (workspace.packageJson.private) {
        console.log(`Skipping ${workspace.packageName}: private`);
        return;
    }
    const args = ['publish', '--tag', target.tag, '--ignore-scripts'];
    if (registry) {
        args.push('--registry', registry);
    }
    if (!execute) {
        args.push('--dry-run');
    }
    console.log(
        `${execute ? 'Publishing' : 'Dry-run publishing'} ${workspace.packageName}@${workspace.packageJson.version} to dist-tag "${target.tag}"${registry ? ` at ${registry}` : ''}`,
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
    const version = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version;
    let target;
    try {
        target = resolvePublishTarget(branch, version);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    if (!target) {
        console.log(
            `Skipping publish: branch "${branch}" is not a publish branch (devel.* or master).`,
        );
        return;
    }
    const registry = process.env[target.registryEnv];
    if (!registry) {
        console.log(`${target.registryEnv} is not set - dry run against the default registry.`);
    }
    const execute =
        Boolean(registry) &&
        (process.env.PUBLISH_EXECUTE === 'true' || Boolean(process.env.NPM_TOKEN));
    for (const workspace of sortWorkspacesTopologically(getWorkspaces())) {
        publishWorkspace(workspace, target, registry, execute);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main();
}
