import fs from 'node:fs';
import path from 'node:path';

import { ensureDirectory, rootDir, toArtifactDirectoryName } from './workspace-utils.js';

// Maven failsafe's actual contract, which this repo documented but did not
// implement: `integration-test` and `e2e-test` NEVER fail the build where
// they run. A failure is RECORDED here and surfaced later by the matching
// `post-*-test` step - the same reason `mvn verify` splits
// failsafe:integration-test from failsafe:verify, with
// post-integration-test guaranteed to run in between.
//
// Without this, a failing e2e suite aborted the npm script chain, so
// post-e2e-test never ran and every server started by pre-e2e-test was
// left listening (report.md item 46 all over again, from the other end).

const failsafeDirectory = path.join(rootDir, '.artifacts', 'failsafe');

function markerPath(phase, packageName) {
    const name = toArtifactDirectoryName(packageName);

    return path.join(failsafeDirectory, `${phase}-${name}.json`);
}

export function recordFailure(phase, packageName, details = {}) {
    ensureDirectory(failsafeDirectory);
    fs.writeFileSync(
        markerPath(phase, packageName),
        JSON.stringify({ phase, packageName, ...details }, null, 2),
    );
}

export function readFailure(phase, packageName) {
    const file = markerPath(phase, packageName);

    if (!fs.existsSync(file)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Clearing is deliberate at both ends: before a tier runs (so a marker left
// by an interrupted earlier run cannot fail a green build) and after the
// post-* step has reported it (so the failure is surfaced exactly once).
export function clearFailure(phase, packageName) {
    fs.rmSync(markerPath(phase, packageName), { force: true });
}
