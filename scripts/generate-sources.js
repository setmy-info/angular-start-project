#!/usr/bin/env node
// Angular-specific version stamp into version.ts. No-op on library and LESS
// packages (they have no generator). Called from the Build compile slot.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getWorkspaces } from './workspace-utils.js';

for (const workspace of getWorkspaces()) {
    const generator = path.join(workspace.workspace, 'bin', 'versionModule.js');

    if (!fs.existsSync(generator)) {
        console.log(`No generated sources for ${workspace.packageName}, skipping`);
        continue;
    }

    console.log(`Generating sources for ${workspace.packageName}`);
    execFileSync(process.execPath, [generator], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });
}
