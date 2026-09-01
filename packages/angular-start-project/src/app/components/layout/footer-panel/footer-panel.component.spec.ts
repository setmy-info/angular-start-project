import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { FooterPanelComponent } from './footer-panel.component';

function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('FooterPanelComponent', () => {
    let fixture: ComponentFixture<FooterPanelComponent>;

    beforeEach(async () => {
        // Isolate from other specs that warm translationService's localStorage cache
        // (same jsdom origin, module-level library singleton).
        localStorage.clear();
        // LanguageService loads its translations asynchronously (see language.service.ts /
        // translationService.js) — stub fetch so `app.title` resolves to real text instead of
        // staying on the "no cache yet" fallback for the duration of this test.
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    new Response(
                        JSON.stringify(
                            url.includes('translations-version.json')
                                ? { et: 1, en: 1 }
                                : { 'app.title': 'Lorem Ipsum Application' },
                        ),
                    ),
                ),
            ),
        );

        await TestBed.configureTestingModule({
            imports: [FooterPanelComponent],
            providers: [provideRouter([])],
        }).compileComponents();
        fixture = TestBed.createComponent(FooterPanelComponent);
        fixture.detectChanges();
        await flushPromises();
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render footer element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('footer')).toBeTruthy();
    });

    it('should render copyright icon', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icon = el.querySelector('.material-symbols-outlined');
        expect(icon).toBeTruthy();
        expect(icon?.textContent?.trim()).toBe('copyright');
    });

    it('should render footer text content', () => {
        const el = fixture.nativeElement as HTMLElement;
        const text = el.querySelector('footer')?.textContent ?? '';
        expect(text).toContain('Lorem Ipsum');
    });
});
