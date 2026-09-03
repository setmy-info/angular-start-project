import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getWorkspaces, rootDir } from '../../workspace-utils.js';

const brandPages = getWorkspaces().filter((workspace) => workspace.moduleType === 'brand-page');

async function dependencyList(brandPage) {
    const module = await import(
        pathToFileURL(path.join(brandPage.workspace, 'dependencies.js')).href
    );
    return module.default;
}

test('there is at least one brand page workspace', () => {
    assert.ok(brandPages.length > 0);
});

test('src/ is the served folder, and the server has a port of its own', () => {
    const ports = [];

    for (const brandPage of brandPages) {
        const server = brandPage.packageJson.config?.server;

        assert.equal(server?.directory, 'src', `${brandPage.packageName} serves src/`);
        assert.ok(Number.isInteger(server.port), `${brandPage.packageName} declares a port`);
        ports.push(server.port);
    }

    assert.equal(new Set(ports).size, ports.length, 'no two brand pages share a port');
});

test('a brand page has no build output — nothing is generated into a dist directory', () => {
    for (const brandPage of brandPages) {
        assert.equal(
            fs.existsSync(path.join(brandPage.workspace, 'dist')),
            false,
            `${brandPage.packageName} has no dist/`,
        );
    }
});

test('brand pages are plain CSS and JS — no LESS anywhere in the source tree', () => {
    for (const brandPage of brandPages) {
        const lessFiles = fs
            .readdirSync(path.join(brandPage.workspace, 'src'), {
                recursive: true,
                withFileTypes: true,
            })
            .filter((entry) => entry.isFile() && entry.name.endsWith('.less'));

        assert.deepEqual(lessFiles, [], `${brandPage.packageName} has no .less files`);
    }
});

test('robots.txt and sitemap.xml are committed files, not build output', () => {
    for (const brandPage of brandPages) {
        for (const name of ['robots.txt', 'sitemap.xml']) {
            const file = path.join(brandPage.workspace, 'src', name);

            assert.ok(fs.existsSync(file), `${brandPage.packageName}: src/${name} exists`);
            assert.ok(
                fs.readFileSync(file, 'utf8').trim().length > 0,
                `${brandPage.packageName}: src/${name} has content`,
            );
        }

        const robots = fs.readFileSync(path.join(brandPage.workspace, 'src', 'robots.txt'), 'utf8');

        assert.match(
            robots,
            /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m,
            'robots names its sitemap',
        );
        assert.match(robots, /^User-agent: GPTBot$/m, 'training crawlers are denied');
    }
});

test('every copied dependency is installed and lands inside src/', async () => {
    for (const brandPage of brandPages) {
        const list = await dependencyList(brandPage);

        assert.ok(list.copy.length > 0, `${brandPage.packageName} copies something`);

        for (const entry of list.copy) {
            assert.ok(!entry.to.startsWith('/') && !entry.to.includes('..'), 'no traversal');
            assert.ok(
                fs.existsSync(path.join(rootDir, 'node_modules', entry.from)),
                `${entry.from} is installed`,
            );
            assert.ok(
                fs.existsSync(path.join(brandPage.workspace, 'src', entry.to)),
                `src/${entry.to} is copied in and committed`,
            );
        }
    }
});

test('every minified file has its readable source beside it', async () => {
    for (const brandPage of brandPages) {
        const list = await dependencyList(brandPage);

        for (const entry of list.minify) {
            const source = path.join(brandPage.workspace, 'src', entry.from);
            const minified = path.join(brandPage.workspace, 'src', entry.to);

            assert.ok(fs.existsSync(source), `src/${entry.from} exists`);
            assert.ok(fs.existsSync(minified), `src/${entry.to} is committed beside it`);
            assert.ok(
                fs.statSync(minified).size < fs.statSync(source).size,
                `src/${entry.to} is smaller than its source`,
            );
        }
    }
});

test('the SMI stylesheets are linked in the order the design system requires', () => {
    const order = [
        'setmy-info-less.min.css',
        'setmy-info-less-extended.min.css',
        'setmy-info-less-fancy.min.css',
        'setmy-info-less-brandpage.min.css',
    ];

    for (const brandPage of brandPages) {
        const html = fs.readFileSync(path.join(brandPage.workspace, 'src', 'index.html'), 'utf8');
        const positions = order.map((name) => html.indexOf(name));

        for (const [index, position] of positions.entries()) {
            assert.notEqual(position, -1, `${order[index]} is linked`);
        }

        assert.deepEqual(
            [...positions].sort((left, right) => left - right),
            positions,
            'linked in dependency order',
        );
    }
});

test('every page carries its own canonical URL', () => {
    for (const brandPage of brandPages) {
        const canonicals = new Set();

        for (const entry of fs.readdirSync(path.join(brandPage.workspace, 'src'))) {
            if (!entry.endsWith('.html')) {
                continue;
            }

            const html = fs.readFileSync(path.join(brandPage.workspace, 'src', entry), 'utf8');
            const match = html.match(/<link rel="canonical" href="([^"]+)"/);

            assert.ok(match, `${entry} declares a canonical`);
            assert.ok(!canonicals.has(match[1]), `${entry} canonical is unique`);
            canonicals.add(match[1]);
        }
    }
});
