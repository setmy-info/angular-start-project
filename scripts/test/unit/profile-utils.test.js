import test from 'node:test';
import assert from 'node:assert/strict';

import {
    CANONICAL_PROFILES,
    DEFAULT_PROFILE,
    requireCanonicalProfile,
    resolveProfileArg,
} from '../../profile-utils.js';

test('canonical profiles are the ADR-0041 six', () => {
    assert.deepEqual(CANONICAL_PROFILES, ['local', 'dev', 'ci', 'test', 'prelive', 'live']);
});

test('requireCanonicalProfile accepts each canonical name', () => {
    for (const name of CANONICAL_PROFILES) {
        assert.equal(requireCanonicalProfile(name), name);
    }
});

test('requireCanonicalProfile rejects a missing value', () => {
    assert.throws(() => requireCanonicalProfile(undefined), /SMI_PROFILES/);
});

test('requireCanonicalProfile rejects a non-canonical name', () => {
    assert.throws(() => requireCanonicalProfile('production'), /canonical/);
});

test('resolveProfileArg reads --profile before SMI_PROFILES', () => {
    const previous = process.env.SMI_PROFILES;
    process.env.SMI_PROFILES = 'dev';
    try {
        assert.equal(resolveProfileArg(['--profile', 'ci']), 'ci');
    } finally {
        if (previous === undefined) {
            delete process.env.SMI_PROFILES;
        } else {
            process.env.SMI_PROFILES = previous;
        }
    }
});

test('resolveProfileArg falls back to SMI_PROFILES', () => {
    const previous = process.env.SMI_PROFILES;
    process.env.SMI_PROFILES = 'test';
    try {
        assert.equal(resolveProfileArg([]), 'test');
    } finally {
        if (previous === undefined) {
            delete process.env.SMI_PROFILES;
        } else {
            process.env.SMI_PROFILES = previous;
        }
    }
});

test('resolveProfileArg defaults to local when unset', () => {
    const previous = process.env.SMI_PROFILES;
    delete process.env.SMI_PROFILES;
    try {
        assert.equal(DEFAULT_PROFILE, 'local');
        assert.equal(resolveProfileArg([]), 'local');
    } finally {
        if (previous === undefined) {
            delete process.env.SMI_PROFILES;
        } else {
            process.env.SMI_PROFILES = previous;
        }
    }
});
