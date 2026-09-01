#!/usr/bin/env node
// Starts and stops every package's static file server - THIS PROJECT'S
// implementation of the test lifecycle's pre and post steps. The generic side
// (the pre-integration-test / post-integration-test / pre-e2e-test /
// post-e2e-test phases the tiers and CI call) lives in scripts/lifecycle.js;
// this file is one step a project keeps, replaces or adds to there. Direct use:
//
//     node scripts/servers.js start
//     node scripts/servers.js stop        (idempotent)
//
// Each package that has a built directory serves it with scripts/http-server.js,
// detached: pid in build/servers/<port>.json. `start` first stops whatever a
// previous aborted run left behind. The test port is config.server.port + 1 so
// a manually started `npm run server` (and `ng serve` on 4200) never collides
// with an automated run.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getWorkspaces, rootDir } from './workspace-utils.js';

const httpServerTool = path.join(path.dirname(fileURLToPath(import.meta.url)), 'http-server.js');

function packagesWithServer() {
    return getWorkspaces().filter((workspace) => workspace.packageJson.config?.server?.port);
}

function testPort(workspace) {
    return Number(workspace.packageJson.config.server.port) + 1;
}

function serveDirectory(workspace) {
    return path.join(workspace.workspace, workspace.packageJson.config.server.directory ?? 'dist');
}

function runHttpServer(workspace, args) {
    const result = spawnSync(process.execPath, [httpServerTool, ...args], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        throw new Error(
            `${workspace.packageName}: http-server ${args.join(' ')} failed with ${result.status ?? 1}`,
        );
    }
}

export async function stopAll() {
    for (const workspace of packagesWithServer()) {
        runHttpServer(workspace, ['stop', '--port', String(testPort(workspace))]);
    }
}

export async function startAll() {
    await stopAll();
    for (const workspace of packagesWithServer()) {
        const directory = serveDirectory(workspace);
        if (!fs.existsSync(directory)) {
            if (workspace.moduleType === 'angular-app') {
                throw new Error(
                    `${workspace.packageName}: nothing built at ${directory} — run \`npm run build\` first`,
                );
            }
            console.log(
                `${workspace.packageName}: nothing built at ${directory} yet, skipping server start`,
            );
            continue;
        }
        const args = ['start', '--port', String(testPort(workspace)), '--directory', directory];
        if (workspace.packageJson.config.server.spa === true) {
            args.push('--spa', 'true');
        }
        runHttpServer(workspace, args);
    }
}

async function main(argv) {
    if (argv.length !== 1 || !['start', 'stop'].includes(argv[0])) {
        throw new Error('Usage: node scripts/servers.js start|stop');
    }
    if (argv[0] === 'start') {
        await startAll();
    } else {
        await stopAll();
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}

export { rootDir };
