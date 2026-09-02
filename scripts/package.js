#!/usr/bin/env node
// Library and LESS packages: npm pack into dist/. The private Angular app is
// never published to a registry, so its deployable is an archive of the built
// browser output, and a brand page's is its built site directory. SHA-256
// checksums sit next to every artifact.
//
// Finally scripts/bundle.js collects the brand pages and applications into the
// single build/<name>.tar.gz that gets copied to a web server and unpacked
// there. Per-module artifacts in dist/ are what `npm run deploy` installs; the
// bundle in build/ is what ships as one file.
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
        packModuleDirectory(workspace, path.join('dist', 'application', 'browser'));
        continue;
    }
    if (workspace.moduleType === 'brand-page') {
        packModuleDirectory(workspace, 'dist');
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

// Not published to a registry: what ships is the built output directory, archived as-is.
function packModuleDirectory(workspace, relativeOutputDir) {
    const outputDir = path.join(workspace.workspace, relativeOutputDir);
    if (!fs.existsSync(outputDir)) {
        console.error(`Missing build output ${outputDir} — run \`npm run build\` first`);
        process.exit(1);
    }
    const archive = path.join(
        distDir,
        `${workspace.packageName}-${workspace.packageJson.version}.tar.gz`,
    );
    execSync(`tar -czf "${archive}" -C "${outputDir}" .`, { stdio: 'inherit' });
    console.log(`Created ${archive}`);
}

// The deployment bundle: every listed brand page and application in one archive.
execSync(`"${process.execPath}" "${path.join(rootDir, 'scripts', 'bundle.js')}"`, {
    stdio: 'inherit',
});
