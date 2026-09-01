#!/usr/bin/env node
// Sequential formatters. Each tool owns one file set. Same as setmy-info-less:
// prettier on LESS first, then stylelint --fix so the tree matches
// stylelint-config-standard, then prettier on TS/JS/HTML/JSON/MD.
//
//     npm run format            write
//     npm run format:check      check only (CI)
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolveLocalBin, rootDir } from './workspace-utils.js';

const LESS_GLOBS = [
    'packages/angular-start-project-style/**/*.less',
    'packages/angular-start-project-brand-style/**/*.less',
    'packages/angular-start-project/src/**/*.less',
];

export const FORMATTERS = [
    {
        name: 'less',
        write: ['prettier', '--write', ...LESS_GLOBS],
        check: ['prettier', '--check', ...LESS_GLOBS],
    },
    {
        name: 'stylelint',
        write: ['stylelint', ...LESS_GLOBS, '--fix'],
        check: ['stylelint', ...LESS_GLOBS],
    },
    {
        name: 'prettier',
        write: ['prettier', '--write', '.'],
        check: ['prettier', '--check', '.'],
    },
];

function runFormatter(spec, mode) {
    const argv = mode === 'write' ? spec.write : spec.check;
    const [binName, ...args] = argv;
    console.log(`${mode === 'write' ? 'format' : 'format:check'}: ${spec.name}`);
    const result = spawnSync(resolveLocalBin(binName), args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });

    return result.status ?? 1;
}

export function runFormat(mode) {
    if (mode !== 'write' && mode !== 'check') {
        throw new Error(`Unknown format mode "${mode}". Use write or check.`);
    }
    for (const spec of FORMATTERS) {
        const status = runFormatter(spec, mode);
        if (status !== 0) {
            return status;
        }
    }

    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const mode = process.argv[2] === '--check' ? 'check' : 'write';
    process.exit(runFormat(mode));
}
