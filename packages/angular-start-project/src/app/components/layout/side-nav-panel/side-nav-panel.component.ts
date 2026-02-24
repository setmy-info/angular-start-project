import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';

import {FormsModule} from '@angular/forms';

@Component({
    selector: 'side-navigation-panel',
    imports: [FormsModule],
    templateUrl: './side-nav-panel.component.html',
    styleUrl: './side-nav-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
}
