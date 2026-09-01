#!/usr/bin/env node
// Library and LESS packages: npm pack into dist/. The private Angular app is
// never published to a registry, so its deployable is an archive of the built
// browser output. SHA-256 checksums sit next to every artifact.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

import { getWorkspaces, npmCommand, rootDir } from './workspace-utils.js';

const distDir = path.join(rootDir, 'dist');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const workspace of getWorkspaces()) {
    if (workspace.moduleType === 'angular-app') {
        packAngularApp(workspace);
        continue;
    }
    const result = spawnSync(npmCommand, ['pack', `--pack-destination=${distDir}`], {
        cwd: workspace.workspace,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
    console.log(`Packed ${workspace.packageName}`);
}

for (const name of fs.readdirSync(distDir).filter((entry) => /\.(tgz|tar\.gz)$/.test(entry))) {
    const file = path.join(distDir, name);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    fs.writeFileSync(path.join(distDir, `${name}.sha256`), `${digest}  ${name}\n`);
}

function packAngularApp(workspace) {
    const browserDir = path.join(workspace.workspace, 'dist', 'application', 'browser');
    if (!fs.existsSync(browserDir)) {
        console.error(`Missing build output ${browserDir} — run \`npm run build\` first`);
        process.exit(1);
    }
    const archive = path.join(
        distDir,
        `${workspace.packageName}-${workspace.packageJson.version}.tar.gz`,
    );
    execSync(`tar -czf "${archive}" -C "${browserDir}" .`, { stdio: 'inherit' });
    console.log(`Created ${archive}`);
}
