import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-header-panel',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header-panel.component.html',
    styleUrl: './header-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    protected readonly languageService = inject(LanguageService);
}
