import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import angularStartProjectLibrary from 'angular-start-project-library';

import { version } from '../config/version';

// Mirror of the library's pwaUpdateService state (that package is plain JS and ships no typings,
// so the shape is declared here for `strictTemplates`). Keep the two in sync.
export interface PwaUpdateState {
    available: boolean;
    dismissed: boolean;
    activating: boolean;
    currentVersion: string | null;
    availableVersion: string | null;
    lastCheckedAt: number | null;
    error: string | null;
    unrecoverable: boolean;
}

// Thin Angular adapter over the framework-independent update state machine
// (angular-start-project-library/src/services/pwaUpdateService.js). Everything framework-specific
// lives here — injecting SwUpdate, translating its VERSION_* events, the periodic re-check and the
// reload — while "is an update pending, was it dismissed, did it fail" stays in the library.
//
// Without this, a new deployment was invisible: the service worker downloads it in the background
// and then waits for every tab of the app to be closed, so a long-lived tab keeps running the old
// build indefinitely. See README.md "Progressive Web App / offline support".
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
    // Optional on purpose: SwUpdate only exists where provideServiceWorker() ran. Requiring it
    // would make this service - and therefore the whole app shell, which renders pwa-panel -
    // impossible to instantiate in a test bed or in a copy of this template that drops the
    // service worker. Everything below degrades to a no-op instead.
    private readonly swUpdate = inject(SwUpdate, { optional: true });
    private readonly destroyRef = inject(DestroyRef);
    private readonly library = angularStartProjectLibrary.pwaUpdateService;

    // False for `local`/`dev` (provideServiceWorker is gated on environment.production) and in any
    // browser without service-worker support. Everything below is a no-op when it is false.
    readonly isEnabled: boolean = this.swUpdate?.isEnabled ?? false;

    readonly state = signal<PwaUpdateState>(this.library.getState());
    readonly updateAvailable = computed(() => this.state().available);
    readonly activating = computed(() => this.state().activating);
    readonly unrecoverable = computed(() => this.state().unrecoverable);
    readonly lastError = computed(() => this.state().error);
    readonly lastCheckedAt = computed(() => this.state().lastCheckedAt);
    // What the banner binds to: pending, and not hidden by "Later" for this page load.
    readonly showUpdateBanner = computed(() => this.state().available && !this.state().dismissed);

    // Diagnostic only (Settings page): 'unsupported' when the browser has no service worker,
    // 'none' when this page is not controlled by one yet, otherwise the controller's own state
    // ('installing' | 'installed' | 'activating' | 'activated' | 'redundant').
    readonly controllerState = signal<string>(readControllerState());

    constructor() {
        this.destroyRef.onDestroy(
            this.library.subscribe((next: PwaUpdateState) => this.state.set(next)),
        );
        this.library.setCurrentVersion(version.version);
        this.watchControllerChanges();

        if (!this.swUpdate || !this.isEnabled) {
            return;
        }

        this.swUpdate.versionUpdates
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event: VersionEvent) => this.onVersionEvent(event));

        this.swUpdate.unrecoverable
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => this.library.markUnrecoverable(event.reason));

        this.startPolling();
    }

    // Ask the server whether a newer build was deployed. Resolves to whether one was found.
    // Safe to call when the service worker is disabled — it just records the check and returns false.
    async checkForUpdate(): Promise<boolean> {
        if (!this.swUpdate || !this.isEnabled) {
            this.library.markChecked();
            return false;
        }
        try {
            const found = await this.swUpdate.checkForUpdate();
            this.library.markChecked();
            return found;
        } catch (error) {
            this.library.markChecked();
            this.library.markFailed(errorMessage(error));
            return false;
        }
    }

    // Swap the waiting version in and (by default) reload so the running code matches the caches.
    // Reloading is not optional cosmetics: after activateUpdate() the page's lazy chunks are
    // served from the NEW version while the already-loaded code came from the old one.
    async activateUpdate(): Promise<void> {
        if (!this.swUpdate || !this.isEnabled) {
            return;
        }
        this.library.markActivating();
        try {
            const activated = await this.swUpdate.activateUpdate();
            this.library.markActivated();
            if (activated && angularStartProjectLibrary.config.pwa.reloadOnActivate) {
                this.reload();
            }
        } catch (error) {
            this.library.markFailed(errorMessage(error));
        }
    }

    // "Later" — hides the banner for this page load only.
    dismiss(): void {
        this.library.dismiss();
    }

    // The only way out of SwUpdate.unrecoverable: throw the page away and start clean.
    reload(): void {
        document.location.reload();
    }

    private onVersionEvent(event: VersionEvent): void {
        switch (event.type) {
            case 'VERSION_READY':
                this.library.markAvailable(event.latestVersion.hash);
                break;
            case 'NO_NEW_VERSION_DETECTED':
                this.library.markNoUpdate();
                break;
            case 'VERSION_INSTALLATION_FAILED':
                this.library.markFailed(event.error);
                break;
            default:
                // VERSION_DETECTED — download started, nothing to show until it is READY.
                break;
        }
    }

    // A tab left open for days would otherwise only ever check at load time.
    private startPolling(): void {
        const intervalMs = angularStartProjectLibrary.config.pwa.updateCheckIntervalMs;

        if (!intervalMs || intervalMs <= 0) {
            return;
        }

        const handle = setInterval(() => void this.checkForUpdate(), intervalMs);

        this.destroyRef.onDestroy(() => clearInterval(handle));
    }

    private watchControllerChanges(): void {
        if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
            return;
        }

        const onControllerChange = () => this.controllerState.set(readControllerState());

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        this.destroyRef.onDestroy(() =>
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange),
        );
    }
}

function readControllerState(): string {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
        return 'unsupported';
    }
    return navigator.serviceWorker.controller?.state ?? 'none';
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
