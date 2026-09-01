import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaces } from '../../workspace-utils.js';

test('PWA sources match the angular.json service-worker declaration', () => {
    const app = getWorkspaces().find((workspace) => workspace.moduleType === 'angular-app');
    assert.ok(app);
    const angularJson = JSON.parse(
        fs.readFileSync(path.join(app.workspace, 'angular.json'), 'utf8'),
    );
    const pkg = app.packageJson;
    const serviceWorkerConfigs = Object.values(angularJson.projects ?? {})
        .map(
            (project) => (project.architect ?? project.targets ?? {}).build?.options?.serviceWorker,
        )
        .filter(Boolean);

    if (serviceWorkerConfigs.length === 0) {
        return;
    }

    assert.ok(
        pkg.dependencies?.['@angular/service-worker'],
        'angular.json declares a service worker but @angular/service-worker is not a dependency',
    );

    for (const relativeConfig of serviceWorkerConfigs) {
        const configPath = path.join(
            app.workspace,
            relativeConfig === true ? 'ngsw-config.json' : relativeConfig,
        );
        assert.ok(fs.existsSync(configPath), `service worker config missing: ${configPath}`);
        const ngswConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        assert.ok(ngswConfig.index, `${relativeConfig}: "index" missing`);
        assert.ok(
            Array.isArray(ngswConfig.assetGroups) && ngswConfig.assetGroups.length > 0,
            `${relativeConfig}: no assetGroups`,
        );
    }

    const manifestPath = path.join(app.workspace, 'public', 'manifest.webmanifest');
    assert.ok(fs.existsSync(manifestPath), 'public/manifest.webmanifest missing');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const key of ['name', 'short_name', 'start_url', 'display', 'icons']) {
        assert.ok(manifest[key], `public/manifest.webmanifest: "${key}" missing`);
    }
    const hasLargeIcon = (manifest.icons ?? []).some((icon) =>
        String(icon.sizes ?? '')
            .split(/\s+/)
            .some((size) => Number.parseInt(size, 10) >= 192),
    );
    assert.ok(hasLargeIcon, 'public/manifest.webmanifest: no icon of 192x192 or larger');

    const indexHtmlPath = path.join(app.workspace, 'src', 'index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    assert.match(indexHtml, /rel=["']manifest["']/);
});
