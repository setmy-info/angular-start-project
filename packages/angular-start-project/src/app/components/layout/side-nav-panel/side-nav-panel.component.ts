import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';

import {LanguageService} from '../../../services/language.service';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'side-navigation-panel',
    imports: [RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './side-nav-panel.component.html',
    styleUrl: './side-nav-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    protected readonly languageService = inject(LanguageService);
}
