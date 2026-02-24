import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';
import {LanguageService} from '../../../services/language.service';
import angularStartProjectLibrary from 'angular-start-project-library';

@Component({
    selector: 'header-panel',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header-panel.component.html',
    styleUrl: './header-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    protected readonly languageService = inject(LanguageService);

    protected readonly appTitle = computed(() => {
        const isBrand = angularStartProjectLibrary.tenantService.isBrandPage();
        const key = isBrand ? 'app.brandTitle' : 'app.title';
        return this.languageService.translate(key);
    });
}
