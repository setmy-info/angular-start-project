import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ModalService} from '../../../services/modal.service';

@Component({
    selector: 'modal-body-panel',
    templateUrl: './modal-overlay.component.html',
    styleUrl: './modal-overlay.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalBodyPanelComponent {
    protected readonly modalService = inject(ModalService);
}
