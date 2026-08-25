import { clearFailure, readFailure } from './failsafe.js';
import { getWorkspaceInfo } from './workspace-utils.js';

// Runs at the END of a post-*-test step, after the hook has torn the test
// servers down. This is `failsafe:verify`: the tier's cleanup is guaranteed
// to have happened, and only now is the recorded failure allowed to fail
// the build.
export function surfaceDeferredFailure(phase) {
    const workspace = getWorkspaceInfo();
    const failure = readFailure(phase, workspace.packageName);

    if (!failure) {
        return;
    }

    clearFailure(phase, workspace.packageName);
    console.error(
        `${workspace.packageName}: ${phase} tests failed (exit ${failure.status}) - see the ${phase}-test output above.`,
    );
    process.exit(1);
}
