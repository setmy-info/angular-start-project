import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ModalService } from '../../../services/modal.service';
import { MenuService } from '../../../services/menu.service';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'side-navigation-panel',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './side-navigation-panel.component.html',
    styleUrl: './side-navigation-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    protected readonly languageService = inject(LanguageService);

    protected onLanguageChange(event: Event): void {
        this.languageService.changeLanguage((event.target as HTMLSelectElement).value);
    }
}
