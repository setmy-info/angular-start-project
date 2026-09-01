import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { collectFiles, getWorkspaces } from '../../workspace-utils.js';

test('angular-start-project-library source does not import Angular or RxJS', () => {
    const library = getWorkspaces().find(
        (workspace) => workspace.packageName === 'angular-start-project-library',
    );
    assert.ok(library);
    const forbidden = [];
    for (const file of collectFiles(path.join(library.workspace, 'src'))) {
        const source = fs.readFileSync(file, 'utf8');
        if (/(require\(|from\s+)['"](@angular\/|rxjs)/.test(source)) {
            forbidden.push(path.relative(library.workspace, file));
        }
    }
    assert.deepEqual(forbidden, []);
});
