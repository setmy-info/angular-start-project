import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import {filter, map} from 'rxjs';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';
import {LanguageService} from '../../../services/language.service';
import {NetworkService} from '../../../services/network.service';
import {ConsentBodyPanelComponent} from '../consent-panel/consent-body-panel.component';

@Component({
    selector: 'header-panel',
    imports: [RouterLink, RouterLinkActive, ConsentBodyPanelComponent],
    templateUrl: './header-panel.component.html',
    styleUrl: './header-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    protected readonly languageService = inject(LanguageService);
    protected readonly networkService = inject(NetworkService);

    private readonly router = inject(Router);

    private readonly currentUrl = toSignal(
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(() => this.router.url)
        ),
        {initialValue: this.router.url}
    );

    protected readonly pageTitleKey = computed(() => {
        const url = this.currentUrl();
        const menuItem = this.menuService.rawMenuItems().find(item => item.path === url);
        if (menuItem) {
            return menuItem.translationKey || menuItem.label;
        }
        if (url === '/settings') {
            return 'view.settings.title';
        }
        if (url === '/terms') {
            return 'view.terms.title';
        }
        if (url === '/privacy') {
            return 'view.privacy.title';
        }
        return 'app.title';
    });
}
