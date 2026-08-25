#!/usr/bin/env node

import { runWorkspaceHook } from './workspace-hook.js';
import { surfaceDeferredFailure } from './failsafe-report.js';

await runWorkspaceHook('post.it.js', 'Cleaning up integration test stage');
surfaceDeferredFailure('integration');
