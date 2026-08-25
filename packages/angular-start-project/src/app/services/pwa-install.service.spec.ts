import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import angularStartProjectLibrary from 'angular-start-project-library';
import { PwaInstallService } from './pwa-install.service';

// A stand-in for Chromium's BeforeInstallPromptEvent, which jsdom does not implement: a plain
// Event carrying the two extra members the spec adds. `cancelable` matters — the real event is
// cancelable, and preventDefault() on a non-cancelable event is silently ignored, which would
// make the test below pass or fail for the wrong reason.
function dispatchBeforeInstallPrompt(userChoice: Promise<{ outcome: string }>): Event {
    const event = new Event('beforeinstallprompt', { cancelable: true });

    Object.assign(event, { prompt: vi.fn(() => Promise.resolve()), userChoice });
    window.dispatchEvent(event);
    return event;
}

describe('PwaInstallService', () => {
    beforeEach(() => {
        localStorage.clear();
        angularStartProjectLibrary.pwaInstallService.reset();
    });

    afterEach(() => {
        angularStartProjectLibrary.pwaInstallService.reset();
        localStorage.clear();
    });

    it('offers nothing until the browser says the app is installable', () => {
        const service = TestBed.inject(PwaInstallService);

        expect(service.canInstall()).toBe(false);
        expect(service.showInstallBanner()).toBe(false);
    });

    it('raises the banner on beforeinstallprompt', () => {
        const service = TestBed.inject(PwaInstallService);

        dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));

        expect(service.canInstall()).toBe(true);
        expect(service.showInstallBanner()).toBe(true);
    });

    it('preventDefault()s the event, otherwise it cannot be reused later', () => {
        TestBed.inject(PwaInstallService);

        const event = dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));

        expect(event.defaultPrevented).toBe(true);
    });

    it('install() shows the saved prompt and reports the outcome', async () => {
        const service = TestBed.inject(PwaInstallService);
        const event = dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));

        expect(await service.install()).toBe('accepted');
        expect((event as unknown as { prompt: () => void }).prompt).toHaveBeenCalled();
        expect(service.canInstall()).toBe(false);
    });

    it('install() is safe when no prompt was ever captured', async () => {
        const service = TestBed.inject(PwaInstallService);

        expect(await service.install()).toBe('unavailable');
    });

    it('the saved prompt is single-use', async () => {
        const service = TestBed.inject(PwaInstallService);

        dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'dismissed' }));

        expect(await service.install()).toBe('dismissed');
        expect(await service.install()).toBe('unavailable');
    });

    it('dismiss() hides the banner and persists the choice', () => {
        const service = TestBed.inject(PwaInstallService);

        dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));
        service.dismiss();

        expect(service.showInstallBanner()).toBe(false);
        expect(service.canInstall()).toBe(true);
        expect(localStorage.getItem('pwaInstallDismissedAt')).not.toBeNull();
    });

    it('a dismissal older than the configured window stops suppressing the banner', () => {
        const days = angularStartProjectLibrary.config.pwa.installPromptDismissDays;
        const expired = Date.now() - (days + 1) * 24 * 60 * 60 * 1000;

        localStorage.setItem('pwaInstallDismissedAt', String(expired));

        const service = TestBed.inject(PwaInstallService);

        dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));

        expect(service.showInstallBanner()).toBe(true);
    });

    it('appinstalled clears the offer for the rest of the page load', () => {
        const service = TestBed.inject(PwaInstallService);

        dispatchBeforeInstallPrompt(Promise.resolve({ outcome: 'accepted' }));
        window.dispatchEvent(new Event('appinstalled'));

        expect(service.installed()).toBe(true);
        expect(service.showInstallBanner()).toBe(false);
    });
});
