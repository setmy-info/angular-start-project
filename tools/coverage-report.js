#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { getWorkspaceInfo } from './workspace-utils.js';
import { escapeHtml, parseLcov, writePage } from './site-utils.js';

// Coverage report: renders whatever the Coverage phase (tools/coverage.js,
// jest --coverage) already wrote into site/coverage/lcov.info. It does NOT
// re-run the tests - re-running a tier inside the reporting phase is exactly
// the lifecycle redundancy the siblings' backlog flags.
const workspace = getWorkspaceInfo();
const outDir = path.join(workspace.workspace, 'site', 'coverage');
const lcovPath = path.join(outDir, 'lcov.info');

fs.mkdirSync(outDir, { recursive: true });

console.log(`Generating coverage report for ${workspace.packageName}`);

const files = fs.existsSync(lcovPath) ? parseLcov(fs.readFileSync(lcovPath, 'utf8')) : [];

const rows = files
    .map((file) => {
        const percent = file.linesFound
            ? ((file.linesHit / file.linesFound) * 100).toFixed(2)
            : '0.00';

        return `<tr>
      <td>${escapeHtml(file.file)}</td>
      <td>${percent}%</td>
      <td>${file.linesHit}/${file.linesFound}</td>
    </tr>`;
    })
    .join('\n');

writePage(
    path.join(outDir, 'index.html'),
    `Coverage report - ${workspace.packageName}`,
    rows
        ? `<table>
       <thead><tr><th>File</th><th>Line coverage</th><th>Lines hit/found</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p><a href="./lcov.info">Raw lcov.info</a></p>`
        : `<p>No coverage data collected - run the coverage phase first.</p>`,
);

console.log(`Created ${path.join(outDir, 'index.html')}`);
