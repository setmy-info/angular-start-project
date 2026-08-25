import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LanguageService } from './language.service';

function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body));
}

function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('LanguageService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('starts from the first supported language and an empty translation set before loading resolves', () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                () =>
                    new Promise(() => {
                        /* never resolves in this test */
                    }),
            ),
        );
        const service = TestBed.inject(LanguageService);
        expect(service.currentLanguageCode()).toBe(service.supportedLanguages[0].code);
        expect(service.translate('app.title')).toBe('app.title');
    });

    it('fetches and caches translations when nothing is cached yet', async () => {
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve(
                url.includes('translations-version.json')
                    ? jsonResponse({ et: 1, en: 1 })
                    : jsonResponse({ 'app.title': 'Fetched Title' }),
            ),
        );
        vi.stubGlobal('fetch', fetchMock);

        const service = TestBed.inject(LanguageService);
        await flushPromises();

        expect(service.translate('app.title')).toBe('Fetched Title');
        expect(JSON.parse(localStorage.getItem('translations.et') as string)['app.title']).toBe(
            'Fetched Title',
        );
        expect(JSON.parse(localStorage.getItem('translations.version') as string).et).toBe(1);
    });

    it('reuses the cached translations when the remote version is unchanged', async () => {
        localStorage.setItem('translations.et', JSON.stringify({ 'app.title': 'Cached Title' }));
        localStorage.setItem('translations.version', JSON.stringify({ et: 1 }));
        const fetchMock = vi.fn((url: string) => {
            if (url.includes('translations-version.json')) {
                return Promise.resolve(jsonResponse({ et: 1, en: 1 }));
            }
            throw new Error('should not re-fetch translations when the version is unchanged');
        });
        vi.stubGlobal('fetch', fetchMock);

        const service = TestBed.inject(LanguageService);
        expect(service.translate('app.title')).toBe('Cached Title');
        await flushPromises();

        expect(service.translate('app.title')).toBe('Cached Title');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('re-fetches translations when the remote version changed', async () => {
        localStorage.setItem('translations.et', JSON.stringify({ 'app.title': 'Old Title' }));
        localStorage.setItem('translations.version', JSON.stringify({ et: 1 }));
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve(
                url.includes('translations-version.json')
                    ? jsonResponse({ et: 2, en: 1 })
                    : jsonResponse({ 'app.title': 'New Title' }),
            ),
        );
        vi.stubGlobal('fetch', fetchMock);

        const service = TestBed.inject(LanguageService);
        await flushPromises();

        expect(service.translate('app.title')).toBe('New Title');
        expect(JSON.parse(localStorage.getItem('translations.version') as string).et).toBe(2);
    });

    it('loads the newly selected language on changeLanguage', async () => {
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve(
                url.includes('translations-version.json')
                    ? jsonResponse({ et: 1, en: 1 })
                    : jsonResponse(
                          url.includes('/en.json')
                              ? { 'app.title': 'English Title' }
                              : { 'app.title': 'Estonian Title' },
                      ),
            ),
        );
        vi.stubGlobal('fetch', fetchMock);

        const service = TestBed.inject(LanguageService);
        await flushPromises();
        expect(service.translate('app.title')).toBe('Estonian Title');

        service.changeLanguage('en');
        await flushPromises();

        expect(service.currentLanguageCode()).toBe('en');
        expect(service.translate('app.title')).toBe('English Title');
    });
});
