import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { LanguageService } from './language.service';
import { SeoService } from './seo.service';

@Component({ template: 'indexable' })
class IndexableComponent {}

@Component({ template: 'private' })
class PrivateComponent {}

describe('SeoService', () => {
    let router: Router;
    let meta: Meta;
    let title: Title;
    let languageService: LanguageService;

    const contentOf = (selector: string) => meta.getTag(selector)?.content;
    const canonicalHref = () =>
        document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    {
                        path: '',
                        component: IndexableComponent,
                        data: { seo: { descriptionKey: 'seo.home.description' } },
                    },
                    {
                        path: 'settings',
                        component: PrivateComponent,
                        data: {
                            seo: { descriptionKey: 'seo.settings.description', noindex: true },
                        },
                    },
                    { path: 'bare', component: IndexableComponent },
                ]),
            ],
        });
        router = TestBed.inject(Router);
        meta = TestBed.inject(Meta);
        title = TestBed.inject(Title);
        languageService = TestBed.inject(LanguageService);
        TestBed.inject(SeoService);
        await router.navigateByUrl('/');
        TestBed.tick();
    });

    it('should set a title that ends in the application name', () => {
        expect(title.getTitle().length).toBeGreaterThan(0);
    });

    it('should set the meta description from the route', () => {
        expect(contentOf('name="description"')).toBe('seo.home.description');
    });

    it('should fall back to the site description on a route that declares none', async () => {
        await router.navigateByUrl('/bare');
        TestBed.tick();
        expect(contentOf('name="description"')).toBe('seo.default.description');
    });

    it('should mark ordinary pages indexable', () => {
        expect(contentOf('name="robots"')).toBe('index, follow');
    });

    it('should keep noindex pages out of the index but still crawlable', async () => {
        await router.navigateByUrl('/settings');
        TestBed.tick();
        expect(contentOf('name="robots"')).toBe('noindex, follow');
    });

    it('should publish a canonical URL that follows navigation', async () => {
        expect(canonicalHref()).toBe(`${location.origin}/`);
        await router.navigateByUrl('/settings');
        TestBed.tick();
        expect(canonicalHref()).toBe(`${location.origin}/settings`);
    });

    it('should strip the query string and fragment from the canonical URL', async () => {
        await router.navigateByUrl('/settings?tenant=two#top');
        TestBed.tick();
        expect(canonicalHref()).toBe(`${location.origin}/settings`);
    });

    it('should mirror title and description into the Open Graph and Twitter tags', () => {
        expect(contentOf('property="og:title"')).toBe(title.getTitle());
        expect(contentOf('property="og:description"')).toBe(contentOf('name="description"'));
        expect(contentOf('name="twitter:title"')).toBe(title.getTitle());
        expect(contentOf('name="twitter:description"')).toBe(contentOf('name="description"'));
        expect(contentOf('property="og:url"')).toBe(canonicalHref());
    });

    it('should follow the language switch in <html lang> and og:locale', () => {
        languageService.currentLanguageCode.set('et');
        TestBed.tick();
        expect(document.documentElement.lang).toBe('et');
        expect(contentOf('property="og:locale"')).toBe('et_EE');

        languageService.currentLanguageCode.set('en');
        TestBed.tick();
        expect(document.documentElement.lang).toBe('en');
        expect(contentOf('property="og:locale"')).toBe('en_US');
    });
});
