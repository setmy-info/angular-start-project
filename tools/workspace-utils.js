import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, '..');
export const packagesDir = path.join(rootDir, 'packages');
export const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export function resolveLocalBin(binName) {
    const suffix = process.platform === 'win32' ? '.cmd' : '';

    return path.join(rootDir, 'node_modules', '.bin', `${binName}${suffix}`);
}

export function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function getWorkspaceInfo(workspace = process.cwd()) {
    const packageJsonPath = path.join(workspace, 'package.json');
    const pkg = readJson(packageJsonPath);

    return {
        workspace,
        packageJsonPath,
        packageName: pkg.name,
        packageJson: pkg,
        srcEntry: resolveSrcEntry(workspace),
        moduleType: resolveModuleType(pkg),
        distDir: path.join(workspace, 'dist'),
    };
}

// This repo holds three different module types side by side, so a package
// declares which one it is in package.json (`config.moduleType`) and the
// shared tools dispatch on it. The phase NAMES stay identical for all of
// them - that is the whole point of the lifecycle - only what a phase runs
// differs:
//
//   angular-app   - the Angular application (Angular CLI does build/test)
//   js-library    - framework-independent plain JS (no transpile step)
//   less-package  - LESS source shipped to consumers, compiled only to prove
//                   it compiles
export const MODULE_TYPES = ['angular-app', 'js-library', 'less-package'];

export function resolveModuleType(packageJson) {
    const declared = packageJson.config?.moduleType;

    if (declared && MODULE_TYPES.includes(declared)) {
        return declared;
    }

    return 'js-library';
}

// The package's own entry point, per module type - what Validate checks for
// and what Build compiles.
function resolveSrcEntry(workspace) {
    for (const candidate of [
        path.join(workspace, 'src', 'main.ts'),
        path.join(workspace, 'index.less'),
        path.join(workspace, 'index.js'),
    ]) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return path.join(workspace, 'index.js');
}

export function ensureDirectory(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

export function removeDirectory(dirPath) {
    fs.rmSync(dirPath, { recursive: true, force: true });
}

// The workspace set comes from the ROOT package.json's `workspaces` field -
// npm's own definition - not from "every directory under packages/". This
// repo is why that distinction matters: packages/angular-original and
// packages/application.old are git-tracked legacy directories that are
// deliberately NOT workspaces, and application.old even reuses the real
// app's package name, so scanning the directory tree silently shadowed the
// application being built.
export function workspaceDirectories() {
    const rootPackageJson = readJson(path.join(rootDir, 'package.json'));
    const patterns = rootPackageJson.workspaces ?? [];
    const directories = [];

    for (const pattern of patterns) {
        if (pattern.endsWith('/*')) {
            const parent = path.join(rootDir, pattern.slice(0, -2));

            if (!fs.existsSync(parent)) {
                continue;
            }

            for (const entry of fs.readdirSync(parent, {
                withFileTypes: true,
            })) {
                if (entry.isDirectory()) {
                    directories.push(path.join(parent, entry.name));
                }
            }

            continue;
        }

        directories.push(path.join(rootDir, pattern));
    }

    return directories.filter((directory) => fs.existsSync(path.join(directory, 'package.json')));
}

export function getWorkspaces() {
    const infos = workspaceDirectories().map((workspacePath) => getWorkspaceInfo(workspacePath));

    // A dependency is "local" iff it names another workspace in this repo -
    // detected against the actual workspace package names, not a hard-coded
    // scope prefix. devDependencies/peerDependencies count too: a module that
    // needs a sibling built first for its tests still sorts after it.
    const workspaceNames = new Set(infos.map((info) => info.packageName));

    return infos.map((info) => ({
        ...info,
        localDependencies: [
            ...new Set(
                [
                    ...Object.keys(info.packageJson.dependencies ?? {}),
                    ...Object.keys(info.packageJson.devDependencies ?? {}),
                    ...Object.keys(info.packageJson.peerDependencies ?? {}),
                ].filter((dependency) => workspaceNames.has(dependency)),
            ),
        ],
    }));
}

export function sortWorkspacesTopologically(workspaces) {
    const pending = new Map(workspaces.map((workspace) => [workspace.packageName, workspace]));
    const sorted = [];

    while (pending.size > 0) {
        const ready = [...pending.values()]
            .filter((workspace) =>
                workspace.localDependencies.every((dependency) => !pending.has(dependency)),
            )
            .sort((left, right) => left.packageName.localeCompare(right.packageName));

        if (ready.length === 0) {
            throw new Error('Circular workspace dependency detected.');
        }

        for (const workspace of ready) {
            sorted.push(workspace);
            pending.delete(workspace.packageName);
        }
    }

    return sorted;
}

export function toArtifactDirectoryName(packageName) {
    return packageName.replace(/^@/, '').replace(/\//g, '-');
}
