import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';
import {LanguageService} from '../../../services/language.service';
import {NetworkService} from '../../../services/network.service';
import {PageTitleService} from '../../../services/page-title.service';
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
    private readonly pageTitleService = inject(PageTitleService);

    protected readonly pageTitleKey = this.pageTitleService.pageTitleKey;
}
