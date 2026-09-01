#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaces } from './workspace-utils.js';
import { resolveProfileArg, resolveProfileProperties } from './profile-utils.js';

let profile;

try {
    profile = resolveProfileArg(process.argv.slice(2));
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

for (const workspace of getWorkspaces()) {
    filterWorkspace(workspace, profile);
}

function filterWorkspace(workspace, profileName) {
    const resourcesDir = path.join(workspace.workspace, 'resources');
    const outDir = path.join(workspace.workspace, 'dist', 'resources');

    if (!fs.existsSync(resourcesDir)) {
        console.log(`No resources directory for ${workspace.packageName}, skipping`);
        return;
    }

    const properties = resolveProfileProperties(profileName, workspace.workspace);

    fs.rmSync(outDir, { recursive: true, force: true });
    copyAndFilterDirectory(resourcesDir, outDir, workspace, profileName, properties);

    console.log(
        `Filtered resources for ${workspace.packageName} with profile "${profileName}" into ${outDir}`,
    );
}

function copyAndFilterDirectory(sourceDir, targetDir, workspace, profileName, properties) {
    fs.mkdirSync(targetDir, { recursive: true });

    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            copyAndFilterDirectory(sourcePath, targetPath, workspace, profileName, properties);
            continue;
        }

        const content = fs.readFileSync(sourcePath, 'utf8');

        fs.writeFileSync(
            targetPath,
            filterContent(content, entry.name, workspace, profileName, properties),
        );
    }
}

function filterContent(content, fileName, workspace, profileName, properties) {
    return content.replace(/\$\{([^}]+)\}/g, (match, key) => {
        if (!Object.hasOwn(properties, key)) {
            console.warn(
                `Warning: ${workspace.packageName}/resources/${fileName} references ` +
                    `unresolved property "\${${key}}" for profile "${profileName}"`,
            );
            return match;
        }

        return properties[key];
    });
}
