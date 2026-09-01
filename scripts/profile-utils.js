import fs from 'node:fs';
import path from 'node:path';

import { rootDir } from './workspace-utils.js';

// The only allowed build-time/runtime profile names, per ADR-0041
// (environment name conventions) and ADR-0042 (runtime and build-time
// profile name conventions): profiles must be exactly the canonical
// environment list, one-to-one, with no additional profile names for
// infra shape, feature state, tenant, debug mode, etc.
export const CANONICAL_PROFILES = ['local', 'dev', 'ci', 'test', 'prelive', 'live'];

// Developer machines assume local work unless --profile or SMI_PROFILES overrides.
export const DEFAULT_PROFILE = 'local';

// Pure: throws on an invalid profile rather than calling process.exit
// itself, so this stays unit-testable in-process. The CLI-facing caller
// (scripts/resources.js, scripts/build.js) is responsible for catching
// and exiting.
export function requireCanonicalProfile(value) {
    if (!value) {
        throw new Error(
            `Missing profile. Pass --profile <name> or set SMI_PROFILES. ` +
                `Allowed values (ADR-0041/ADR-0042): ${CANONICAL_PROFILES.join(', ')}.`,
        );
    }

    if (!CANONICAL_PROFILES.includes(value)) {
        throw new Error(
            `Invalid profile "${value}". Only the ADR-0041 canonical environment ` +
                `names are allowed as profiles (ADR-0042): ${CANONICAL_PROFILES.join(', ')}.`,
        );
    }

    return value;
}

export function resolveProfileArg(argv) {
    const flagIndex = argv.indexOf('--profile');
    const fromFlag = flagIndex !== -1 ? argv[flagIndex + 1] : undefined;
    const fromEnv = process.env.SMI_PROFILES?.trim() || undefined;

    return requireCanonicalProfile(fromFlag ?? fromEnv ?? DEFAULT_PROFILE);
}

// Root profiles/<name>.json provides shared defaults; an optional
// per-workspace profiles/<name>.json overrides/extends them. JSON, not
// .properties - more idiomatic for environment config in Node, and every
// module already has a JSON parser for free.
export function resolveProfileProperties(profile, workspaceDir) {
    const properties = {
        ...readProfileJson(path.join(rootDir, 'profiles', `${profile}.json`)),
        ...readProfileJson(path.join(workspaceDir, 'profiles', `${profile}.json`)),
    };

    properties.profile = profile;

    return properties;
}

function readProfileJson(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Invalid profile JSON at ${filePath}: ${error.message}`);
    }
}
