import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceDir = path.dirname(fileURLToPath(import.meta.url));
const serverTool = path.join(workspaceDir, '..', '..', 'tools', 'http-server.js');

execFileSync(process.execPath, [serverTool, 'stop', '--port', '4401'], {
    cwd: workspaceDir,
    stdio: 'inherit',
});
