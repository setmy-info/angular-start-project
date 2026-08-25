#!/usr/bin/env node

import { runWorkspaceHook } from './workspace-hook.js';
import { surfaceDeferredFailure } from './failsafe-report.js';

await runWorkspaceHook('post.e2e.js', 'Cleaning up e2e test stage');
surfaceDeferredFailure('e2e');
