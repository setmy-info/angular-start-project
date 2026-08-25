import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import angularStartProjectLibrary from 'angular-start-project-library';
import { PwaUpdateService } from './pwa-update.service';

// The library holds the state as a singleton that outlives a test file, so every case starts from
// a known point (pwaUpdateService.reset() is documented as exactly this seam).
function resetLibraryState(): void {
    angularStartProjectLibrary.pwaUpdateService.reset();
}

describe('PwaUpdateService', () => {
    beforeEach(() => {
        resetLibraryState();
    });

    afterEach(() => {
        resetLibraryState();
    });

    describe('without a service worker', () => {
        it('reports itself disabled and offers no update', () => {
            const service = TestBed.inject(PwaUpdateService);

            expect(service.isEnabled).toBe(false);
            expect(service.updateAvailable()).toBe(false);
            expect(service.showUpdateBanner()).toBe(false);
        });

        it('activateUpdate does nothing rather than throwing', async () => {
            const service = TestBed.inject(PwaUpdateService);
            await service.activateUpdate();

            expect(service.activating()).toBe(false);
        });

        it('checkForUpdate resolves false and still records the check', async () => {
            const service = TestBed.inject(PwaUpdateService);

            expect(await service.checkForUpdate()).toBe(false);
            expect(service.lastCheckedAt()).not.toBeNull();
        });
    });

    describe('with a service worker', () => {
        let versionUpdates: Subject<VersionEvent>;
        let unrecoverable: Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>;
        let swUpdate: Partial<SwUpdate>;

        beforeEach(() => {
            versionUpdates = new Subject<VersionEvent>();
            unrecoverable = new Subject();
            swUpdate = {
                isEnabled: true,
                versionUpdates: versionUpdates.asObservable(),
                unrecoverable: unrecoverable.asObservable(),
                checkForUpdate: vi.fn(() => Promise.resolve(true)),
                activateUpdate: vi.fn(() => Promise.resolve(true)),
            } as Partial<SwUpdate>;

            TestBed.configureTestingModule({
                providers: [{ provide: SwUpdate, useValue: swUpdate }],
            });
        });

        it('raises the banner on VERSION_READY', () => {
            const service = TestBed.inject(PwaUpdateService);

            versionUpdates.next({
                type: 'VERSION_READY',
                currentVersion: { hash: 'old' },
                latestVersion: { hash: 'new' },
            } as VersionEvent);

            expect(service.updateAvailable()).toBe(true);
            expect(service.showUpdateBanner()).toBe(true);
            expect(service.state().availableVersion).toBe('new');
        });

        it('ignores VERSION_DETECTED — the download has only started', () => {
            const service = TestBed.inject(PwaUpdateService);

            versionUpdates.next({
                type: 'VERSION_DETECTED',
                version: { hash: 'new' },
            } as VersionEvent);

            expect(service.showUpdateBanner()).toBe(false);
        });

        it('records the reason on VERSION_INSTALLATION_FAILED', () => {
            const service = TestBed.inject(PwaUpdateService);

            versionUpdates.next({
                type: 'VERSION_INSTALLATION_FAILED',
                version: { hash: 'new' },
                error: 'hash mismatch',
            } as VersionEvent);

            expect(service.updateAvailable()).toBe(false);
            expect(service.lastError()).toBe('hash mismatch');
        });

        it('dismiss hides the banner but keeps the update pending', () => {
            const service = TestBed.inject(PwaUpdateService);

            versionUpdates.next({
                type: 'VERSION_READY',
                currentVersion: { hash: 'old' },
                latestVersion: { hash: 'new' },
            } as VersionEvent);
            service.dismiss();

            expect(service.showUpdateBanner()).toBe(false);
            expect(service.updateAvailable()).toBe(true);
        });

        it('flags an unrecoverable service worker so the UI can force a reload', () => {
            const service = TestBed.inject(PwaUpdateService);

            unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'cached response missing' });

            expect(service.unrecoverable()).toBe(true);
            expect(service.lastError()).toBe('cached response missing');
        });

        it('activateUpdate activates and then reloads', async () => {
            const service = TestBed.inject(PwaUpdateService);
            const reload = vi.spyOn(service, 'reload').mockImplementation(() => undefined);

            versionUpdates.next({
                type: 'VERSION_READY',
                currentVersion: { hash: 'old' },
                latestVersion: { hash: 'new' },
            } as VersionEvent);
            await service.activateUpdate();

            expect(swUpdate.activateUpdate).toHaveBeenCalled();
            expect(reload).toHaveBeenCalled();
            expect(service.updateAvailable()).toBe(false);
            expect(service.activating()).toBe(false);
        });

        it('a failing activateUpdate leaves a reason instead of a stuck spinner', async () => {
            (swUpdate.activateUpdate as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error('activation refused'),
            );
            const service = TestBed.inject(PwaUpdateService);
            vi.spyOn(service, 'reload').mockImplementation(() => undefined);

            await service.activateUpdate();

            expect(service.activating()).toBe(false);
            expect(service.lastError()).toBe('activation refused');
        });
    });
});
