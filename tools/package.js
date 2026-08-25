#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import {
    ensureDirectory,
    getWorkspaceInfo,
    npmCommand,
    rootDir,
    toArtifactDirectoryName,
} from './workspace-utils.js';

const workspace = getWorkspaceInfo();
const artifactsDir = path.join(
    rootDir,
    '.artifacts',
    toArtifactDirectoryName(workspace.packageName),
);
const requestedSbom = process.argv.includes('--sbom');

ensureDirectory(artifactsDir);

if (requestedSbom) {
    const sbomPath = path.join(artifactsDir, 'sbom.json');
    const sbom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        metadata: {
            component: {
                name: workspace.packageName,
                version: workspace.packageJson.version,
                type: 'library',
            },
        },
        components: Object.entries(workspace.packageJson.dependencies ?? {}).map(
            ([name, version]) => ({
                name,
                version,
                type: 'library',
            }),
        ),
    };

    fs.writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
    console.log(`Created ${sbomPath}`);
    process.exit(0);
}

// Start from an empty artifact directory so an older-version tarball can't
// linger next to the new one and get picked up by install-local/sign
// (report.md item 46).
for (const entry of fs.readdirSync(artifactsDir)) {
    if (entry.endsWith('.tgz')) {
        fs.rmSync(path.join(artifactsDir, entry), { force: true });
    }
}

// A private Angular application is never published to a registry, so
// `npm pack` is not its Package phase - the distributable is an archive of
// the built browser output, which is what a deploy actually copies
// (design.md's dist/artifacts/apps/app-<name>-<version>.tar.gz).
if (workspace.moduleType === 'angular-app') {
    const browserDir = path.join(workspace.workspace, 'dist', 'application', 'browser');

    if (!fs.existsSync(browserDir)) {
        console.error(
            `Missing build output ${browserDir} — run the build phase first (npm run build)`,
        );
        process.exit(1);
    }

    const archive = path.join(
        artifactsDir,
        `${workspace.packageName}-${workspace.packageJson.version}.tar.gz`,
    );

    execSync(`tar -czf "${archive}" -C "${browserDir}" .`, {
        stdio: 'inherit',
    });
    console.log(`Created ${archive}`);
} else {
    execSync(`${npmCommand} pack --pack-destination "${artifactsDir}"`, {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
}
