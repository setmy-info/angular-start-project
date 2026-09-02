#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { ensureDirectory, getWorkspaceInfo, resolveLocalBin, rootDir } from './workspace-utils.js';
import { resolveProfileArg } from './profile-utils.js';

const workspace = getWorkspaceInfo();

console.log(`Building ${workspace.packageName} (${workspace.moduleType})`);

switch (workspace.moduleType) {
    case 'angular-app':
        buildAngularApp();
        break;
    case 'less-package':
        buildLessPackage();
        break;
    case 'brand-page':
        buildBrandPage();
        break;
    default:
        buildJsLibrary();
}

// `ng build --configuration <profile>` IS this app's profile mechanism: the
// Angular CLI's own configurations are named with exactly the ADR-0041
// canonical six and each swaps in its environment file (fileReplacements).
function buildAngularApp() {
    const profile = resolveProfileArg(process.argv.slice(2));

    execFileSync(resolveLocalBin('ng'), ['build', '--configuration', profile], {
        cwd: workspace.workspace,
        stdio: 'inherit',
    });

    const buildInfoPath = path.join(workspace.workspace, 'dist', 'build-info.json');

    fs.writeFileSync(
        buildInfoPath,
        `${JSON.stringify(
            {
                packageName: workspace.packageName,
                version: workspace.packageJson.version,
                profile,
                builtAt: new Date().toISOString(),
            },
            null,
            2,
        )}\n`,
    );

    console.log(
        `Built ${workspace.packageName} with configuration "${profile}" (${buildInfoPath})`,
    );
}

function buildLessPackage() {
    const distDir = path.join(workspace.workspace, 'dist');

    ensureDirectory(distDir);

    for (const [output, minify] of [
        ['index.css', false],
        ['index.min.css', true],
    ]) {
        const outputPath = path.join(distDir, output);
        const args = [path.relative(workspace.workspace, workspace.srcEntry), outputPath];

        if (minify) {
            args.push('--clean-css');
        }

        fs.rmSync(outputPath, { force: true });
        execFileSync(resolveLocalBin('lessc'), args, {
            cwd: workspace.workspace,
            stdio: 'inherit',
        });
        console.log(`Created ${outputPath}`);
    }
}

// A brand page has no bundler by design: the build compiles its LESS, copies the static files
// across verbatim, and drops Vue's global production build in beside them. What lands in dist/
// is a complete site directory - exactly what the deployment bundle ships under brands/.
function buildBrandPage() {
    const distDir = path.join(workspace.workspace, 'dist');
    const srcDir = path.join(workspace.workspace, 'src');

    fs.rmSync(distDir, { recursive: true, force: true });
    ensureDirectory(path.join(distDir, 'css'));
    ensureDirectory(path.join(distDir, 'js'));

    for (const [output, minify] of [
        ['index.css', false],
        ['index.min.css', true],
    ]) {
        const outputPath = path.join(distDir, 'css', output);
        const args = [path.relative(workspace.workspace, workspace.srcEntry), outputPath];

        if (minify) {
            args.push('--clean-css');
        }

        execFileSync(resolveLocalBin('lessc'), args, {
            cwd: workspace.workspace,
            stdio: 'inherit',
        });
        console.log(`Created ${outputPath}`);
    }

    // Everything in src/ except the LESS sources, which the step above has already compiled.
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        if (entry.name === 'less') {
            continue;
        }
        fs.cpSync(path.join(srcDir, entry.name), path.join(distDir, entry.name), {
            recursive: true,
        });
    }

    // Vue is a declared devDependency rather than a committed 160 kB blob, but it still ships as
    // a plain <script> the page loads directly - the version is tracked, the page stays bundler-free.
    const vueBuild = path.join(
        rootDir,
        'node_modules',
        'vue',
        'dist',
        'vue.global.prod.js',
    );

    if (!fs.existsSync(vueBuild)) {
        console.error(`Missing ${vueBuild} - run \`npm install\` first`);
        process.exit(1);
    }

    fs.copyFileSync(vueBuild, path.join(distDir, 'js', 'vue.global.prod.js'));

    const buildInfo = {
        packageName: workspace.packageName,
        version: workspace.packageJson.version,
        moduleType: workspace.moduleType,
        builtAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(distDir, 'build-info.json'),
        `${JSON.stringify(buildInfo, null, 2)}\n`,
    );

    console.log(`Built ${workspace.packageName} into ${distDir}`);
}

function buildJsLibrary() {
    const distDir = path.join(workspace.workspace, 'dist');

    ensureDirectory(distDir);

    execFileSync(
        process.execPath,
        [path.join(rootDir, 'scripts', 'support', 'load-library.cjs'), workspace.workspace],
        { cwd: workspace.workspace, stdio: 'inherit' },
    );

    const buildInfo = {
        packageName: workspace.packageName,
        version: workspace.packageJson.version,
        entry: path.relative(workspace.workspace, workspace.srcEntry),
        builtAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(distDir, 'build-info.json'),
        `${JSON.stringify(buildInfo, null, 2)}\n`,
    );

    console.log(`Loaded cleanly; created ${path.join(distDir, 'build-info.json')}`);
}
