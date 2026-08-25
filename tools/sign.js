#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
    ensureDirectory,
    getWorkspaceInfo,
    rootDir,
    toArtifactDirectoryName,
} from './workspace-utils.js';

// Sign phase (Maven `gpg:sign`): SHA-256 checksums - a clearly labeled
// PLACEHOLDER, not a real cryptographic signature, same as all three
// siblings until key material exists.
//
// What gets signed is the PACKAGED tarball (Package's own output), not the
// loose dist/ files - `gpg:sign` signs the jar, and the tarball is what
// `publish` actually ships. The Python and Elixir siblings already sign
// their wheel/.tar this way.
const workspace = getWorkspaceInfo();
const artifactName = toArtifactDirectoryName(workspace.packageName);
const artifactsDir = path.join(rootDir, '.artifacts', artifactName);
const signatureDir = path.join(rootDir, '.signatures', artifactName);

if (!fs.existsSync(artifactsDir)) {
    console.error(
        `No packaged artifacts for ${workspace.packageName} — run the package phase first (npm run package)`,
    );
    process.exit(1);
}

ensureDirectory(signatureDir);

const artifacts = fs
    .readdirSync(artifactsDir)
    .filter((entry) => entry.endsWith('.tgz') || entry === 'sbom.json');

if (artifacts.length === 0) {
    console.error(`Nothing to sign in ${artifactsDir}`);
    process.exit(1);
}

for (const artifact of artifacts) {
    const digest = crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(artifactsDir, artifact)))
        .digest('hex');
    const signaturePath = path.join(signatureDir, `${artifact}.sha256`);

    fs.writeFileSync(signaturePath, `${digest}  ${artifact}\n`);
    console.log(`Created ${signaturePath}`);
}
