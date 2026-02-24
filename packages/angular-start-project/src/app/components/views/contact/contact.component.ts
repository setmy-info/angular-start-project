import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
}
