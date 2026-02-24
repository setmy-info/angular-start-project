import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ModalService} from '../../../services/modal.service';
import {MenuService} from '../../../services/menu.service';

@Component({
    selector: 'header-panel',
    imports: [],
    templateUrl: './header-panel.component.html',
    styleUrl: './header-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderPanelComponent {
    protected readonly modalService = inject(ModalService);
    protected readonly menuService = inject(MenuService);
    nothing() {
        console.log('nothing');
    }
}
