#!/usr/bin/env node
// The dependency documents, all from npm itself (no extra tool):
//
//     reports/security/npm-audit.json   vulnerability report - `npm audit --json`
//                                       (the GATE is `npm run audit` = npm audit --audit-level=high)
//     reports/sbom/cyclonedx.json       CycloneDX software bill of materials - `npm sbom`
//     reports/dependencies.txt          the resolved dependency tree - `npm ls --all`
//
// Everything under reports/ is archived by CI. Nothing here modifies files.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { npmCommand, rootDir } from './workspace-utils.js';

function write(relativePath, args, { allowFailure = false } = {}) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const result = spawnSync(npmCommand, args, {
        cwd: rootDir,
        encoding: 'utf8',
        shell: process.platform === 'win32',
    });
    if (result.status !== 0 && !allowFailure) {
        process.stderr.write(result.stderr);
        throw new Error(`npm ${args.join(' ')} failed with ${result.status}`);
    }
    fs.writeFileSync(target, result.stdout);
    console.log(`Wrote ${relativePath}`);
}

write('reports/security/npm-audit.json', ['audit', '--json'], {
    allowFailure: true,
});
write('reports/sbom/cyclonedx.json', ['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev']);
write('reports/dependencies.txt', ['ls', '--all'], { allowFailure: true });
