import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrl: './about.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
}
