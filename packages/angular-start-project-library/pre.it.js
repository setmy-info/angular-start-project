import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Starts a static server over this package's BUILT output for the
// integration/e2e tiers - the `mvn jetty:run` + failsafe pattern. Its own
// port (the manual `npm run server` port + 1) so an automated run never
// collides with a hand-started server or `ng serve`.
const workspaceDir = path.dirname(fileURLToPath(import.meta.url));
const serverTool = path.join(workspaceDir, '..', '..', 'tools', 'http-server.js');
const directory = path.join(workspaceDir, 'dist');

if (!fs.existsSync(directory)) {
    console.log(`Nothing built at ${directory} yet, skipping server start`);
    process.exit(0);
}

execFileSync(
    process.execPath,
    [serverTool, 'start', '--port', '4301', '--directory', directory, '--spa', 'false'],
    { cwd: workspaceDir, stdio: 'inherit' },
);
