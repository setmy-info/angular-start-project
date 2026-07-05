import {TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {NetworkService} from './network.service';

describe('NetworkService', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('starts from navigator.onLine', () => {
        vi.stubGlobal('navigator', {onLine: false});
        const service = TestBed.inject(NetworkService);
        expect(service.isOnline()).toBe(false);
    });

    it('goes offline when the window fires an "offline" event', () => {
        const service = TestBed.inject(NetworkService);
        window.dispatchEvent(new Event('offline'));
        expect(service.isOnline()).toBe(false);
    });

    it('goes back online when the window fires an "online" event', () => {
        const service = TestBed.inject(NetworkService);
        window.dispatchEvent(new Event('offline'));
        window.dispatchEvent(new Event('online'));
        expect(service.isOnline()).toBe(true);
    });
});
