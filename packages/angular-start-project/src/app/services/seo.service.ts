import { DOCUMENT, Injectable, computed, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { LanguageService } from './language.service';
import { PageTitleService } from './page-title.service';

/** SEO metadata a route declares for itself, under `data: { seo: … }` in app.routes.ts. */
export interface SeoRouteData {
    /** Translation key for this page's meta description. Every indexable page needs its own. */
    descriptionKey?: string;
    /** Utility pages (settings, profile, the OIDC callback, 404) must stay out of the index. */
    noindex?: boolean;
}

// Open Graph wants language_TERRITORY, not the bare ISO code the app switches on.
const OPEN_GRAPH_LOCALES: Record<string, string> = {
    en: 'en_US',
    et: 'et_EE',
};

/**
 * Single owner of the document <head>: title, meta description, robots, canonical URL, the Open
 * Graph / Twitter card set, and the <html lang> attribute.
 *
 * Which page we are on is PageTitleService's answer (it maps the URL to a translated title key);
 * this service turns that plus the route's own `data.seo` into head tags, and re-writes them on
 * every navigation AND on every language change — a crawler and a share-preview fetcher both read
 * the head, and in a single-page app nothing else keeps it current.
 *
 * The canonical URL is built from the live origin rather than a configured host, so it stays
 * correct across the dev/ci/prelive/live hosts and the tenant1.test / tenant2.test dev hostnames
 * without six environment files having to agree. (If prerendering is switched on later, the
 * prerender step has no `location`, and the origin has to come from configuration instead.)
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
    private readonly router = inject(Router);
    private readonly document = inject(DOCUMENT);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    private readonly languageService = inject(LanguageService);
    private readonly pageTitleService = inject(PageTitleService);

    private readonly navigation = toSignal(
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(() => this.router.url),
        ),
        { initialValue: this.router.url },
    );

    // Read from the deepest activated route, so a child route can override its parent's entry.
    private readonly routeData = computed<SeoRouteData>(() => {
        this.navigation();
        let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
        while (route.firstChild) {
            route = route.firstChild;
        }
        return (route.data['seo'] as SeoRouteData | undefined) ?? {};
    });

    private readonly pageTitle = computed(() => {
        const pageTitle = this.languageService.translate(this.pageTitleService.pageTitleKey());
        const appTitle = this.languageService.translate('app.title');
        return pageTitle === appTitle ? appTitle : `${pageTitle} — ${appTitle}`;
    });

    private readonly description = computed(() => {
        const descriptionKey = this.routeData().descriptionKey ?? 'seo.default.description';
        return this.languageService.translate(descriptionKey);
    });

    /** Absolute URL of the current page, query and fragment stripped — what a canonical must be. */
    private readonly canonicalUrl = computed(() => {
        const url = this.navigation().split(/[?#]/)[0];
        const origin = this.document.location?.origin ?? '';
        // "/" must not become a trailing-slash-less empty path.
        return `${origin}${url === '/' ? '/' : url}`;
    });

    constructor() {
        effect(() => this.title.setTitle(this.pageTitle()));

        effect(() => {
            const description = this.description();
            const title = this.pageTitle();
            const url = this.canonicalUrl();
            const languageCode = this.languageService.currentLanguageCode();

            this.meta.updateTag({ name: 'description', content: description });
            this.meta.updateTag({
                name: 'robots',
                // "follow" even when noindex: a utility page's links should still be crawled.
                content: this.routeData().noindex ? 'noindex, follow' : 'index, follow',
            });

            this.meta.updateTag({ property: 'og:title', content: title });
            this.meta.updateTag({ property: 'og:description', content: description });
            this.meta.updateTag({ property: 'og:url', content: url });
            this.meta.updateTag({
                property: 'og:locale',
                content: OPEN_GRAPH_LOCALES[languageCode] ?? languageCode,
            });
            this.meta.updateTag({ name: 'twitter:title', content: title });
            this.meta.updateTag({ name: 'twitter:description', content: description });

            this.setCanonical(url);
            // The static lang="en" in index.html is only the default; the app switches language
            // without changing the URL, so the attribute has to follow the choice.
            this.document.documentElement.lang = languageCode;
        });
    }

    private setCanonical(url: string): void {
        let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}
