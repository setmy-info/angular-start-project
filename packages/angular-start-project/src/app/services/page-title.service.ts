import {Injectable, computed, effect, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import angularStartProjectLibrary from 'angular-start-project-library';
import {LanguageService} from './language.service';
import {MenuService} from './menu.service';

// Single owner of "what page are we on": maps the current URL to a translation key (shown in the
// header panel), keeps the browser tab title (document.title) in sync with it in the current
// language, and records a page-visit statistics event per navigation — the Angular equivalent of
// the old Vue app's global created-hook mixin (src/plugins/index.js) that wrote a statistics
// event for every *Page component.
@Injectable({providedIn: 'root'})
export class PageTitleService {
    private readonly router = inject(Router);
    private readonly languageService = inject(LanguageService);
    private readonly menuService = inject(MenuService);

    private readonly currentUrl = toSignal(
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(() => this.router.url)
        ),
        {initialValue: this.router.url}
    );

    // Title keys for routes that are not in the menu model (URL-only pages).
    private static readonly URL_TITLE_KEYS: Record<string, string> = {
        '/settings': 'view.settings.title',
        '/terms': 'view.terms.title',
        '/privacy': 'view.privacy.title',
        '/about': 'view.about.title',
        '/productsServices': 'view.productsServices.title',
        '/news': 'view.news.title',
        '/help': 'view.help.title',
        '/tools': 'view.tools.title',
        '/commercials': 'view.commercials.title',
        '/ads': 'view.ads.title',
        '/sponsors': 'view.sponsors.title',
        '/template': 'view.template.title'
    };

    readonly pageTitleKey = computed(() => {
        const url = this.currentUrl();
        const menuItem = this.menuService.rawMenuItems().find(item => item.path === url);
        if (menuItem) {
            return menuItem.translationKey || menuItem.label;
        }
        return PageTitleService.URL_TITLE_KEYS[url] || 'app.title';
    });

    constructor() {
        // Browser tab title, translated, re-set when either the page or the language changes.
        effect(() => {
            const title = this.languageService.translate(this.pageTitleKey());
            const appTitle = this.languageService.translate('app.title');
            document.title = title === appTitle ? appTitle : `${title} — ${appTitle}`;
        });
        // Page-visit statistics (event batch is flushed by the service; sending stays disabled
        // until config.features.statistics is on — see the library's statisticsResource.js).
        effect(() => {
            const url = this.currentUrl();
            angularStartProjectLibrary.statisticsService.write(url, angularStartProjectLibrary.constants.CREATE_EVENT_NAME);
        });
    }
}
