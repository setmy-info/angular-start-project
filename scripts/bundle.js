#!/usr/bin/env node
// Collects the built modules into ONE deployable archive - the thing that is copied to a web
// server and unpacked there:
//
//     build/angular-start-project.tar.gz
//       bundle.json                          what is inside, and where it came from
//       brands/<package name>/               one directory per brand page
//       apps/<package name>/                 one directory per application
//
// WHAT GOES IN is a list, not a scan: root package.json `config.bundle.brands` and
// `config.bundle.apps` name the modules, in the order they should be laid down. A module that
// is built but not listed is deliberately not shipped, and a listed module that is missing is a
// hard error - silently shipping an incomplete bundle is the failure mode worth preventing.
//
// Each module contributes an already-built directory; this script does not build anything.
// Run `npm run build` first (`npm run package` does both).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getWorkspaces, readJson, rootDir } from './workspace-utils.js';

// Where a module of each type leaves its built output, relative to its workspace.
const OUTPUT_DIRECTORIES = {
    'angular-app': path.join('dist', 'application', 'browser'),
    'brand-page': 'dist',
};

export function bundleConfiguration() {
    const rootPackageJson = readJson(path.join(rootDir, 'package.json'));
    const bundle = rootPackageJson.config?.bundle ?? {};

    return {
        archiveName: bundle.archiveName ?? rootPackageJson.name,
        outputDir: bundle.outputDir ?? 'build',
        brands: bundle.brands ?? [],
        apps: bundle.apps ?? [],
    };
}

// Resolves the list into {packageName, moduleType, sourceDir, targetDir} entries, failing loudly
// on a name that is not a workspace, is the wrong module type, or has not been built.
export function collectModules({ requireBuilt = true } = {}) {
    const configuration = bundleConfiguration();
    const workspaces = new Map(
        getWorkspaces().map((workspace) => [workspace.packageName, workspace]),
    );
    const collected = [];
    const problems = [];

    for (const [targetRoot, packageNames, expectedType] of [
        ['brands', configuration.brands, 'brand-page'],
        ['apps', configuration.apps, 'angular-app'],
    ]) {
        for (const packageName of packageNames) {
            const workspace = workspaces.get(packageName);

            if (!workspace) {
                problems.push(
                    `${packageName}: listed in config.bundle.${targetRoot} but is not a workspace`,
                );
                continue;
            }
            if (workspace.moduleType !== expectedType) {
                problems.push(
                    `${packageName}: config.bundle.${targetRoot} expects a "${expectedType}" module, but it declares "${workspace.moduleType}"`,
                );
                continue;
            }

            const sourceDir = path.join(
                workspace.workspace,
                OUTPUT_DIRECTORIES[workspace.moduleType],
            );

            if (requireBuilt && !fs.existsSync(sourceDir)) {
                problems.push(
                    `${packageName}: missing build output ${path.relative(rootDir, sourceDir)} - run \`npm run build\` first`,
                );
                continue;
            }

            collected.push({
                packageName,
                version: workspace.packageJson.version,
                moduleType: workspace.moduleType,
                sourceDir,
                targetDir: path.join(targetRoot, packageName),
            });
        }
    }

    return { configuration, modules: collected, problems };
}

function main() {
    const { configuration, modules, problems } = collectModules();

    if (problems.length > 0) {
        for (const problem of problems) {
            console.error(problem);
        }
        process.exit(1);
    }
    if (modules.length === 0) {
        console.error(
            'Nothing to bundle - list the modules in config.bundle.brands / config.bundle.apps in the root package.json',
        );
        process.exit(1);
    }

    const outputDir = path.join(rootDir, configuration.outputDir);
    const stageDir = path.join(outputDir, `.${configuration.archiveName}-stage`);
    const archive = path.join(outputDir, `${configuration.archiveName}.tar.gz`);

    fs.rmSync(stageDir, { recursive: true, force: true });
    fs.mkdirSync(stageDir, { recursive: true });

    for (const module of modules) {
        const target = path.join(stageDir, module.targetDir);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.cpSync(module.sourceDir, target, { recursive: true });
        console.log(`Collected ${module.packageName} -> ${module.targetDir}/`);
    }

    // Travels with the archive so the unpacking end can see what it got without guessing from
    // the directory tree.
    fs.writeFileSync(
        path.join(stageDir, 'bundle.json'),
        `${JSON.stringify(
            {
                name: configuration.archiveName,
                version: readJson(path.join(rootDir, 'package.json')).version,
                builtAt: new Date().toISOString(),
                modules: modules.map(({ packageName, version, moduleType, targetDir }) => ({
                    packageName,
                    version,
                    moduleType,
                    directory: targetDir,
                })),
            },
            null,
            4,
        )}\n`,
    );

    fs.rmSync(archive, { force: true });
    execFileSync('tar', ['-czf', archive, '-C', stageDir, '.'], { stdio: 'inherit' });
    fs.rmSync(stageDir, { recursive: true, force: true });

    const digest = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    fs.writeFileSync(`${archive}.sha256`, `${digest}  ${path.basename(archive)}\n`);

    console.log(`Created ${path.relative(rootDir, archive)} (${modules.length} modules)`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    main();
}
