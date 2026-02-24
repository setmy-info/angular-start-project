import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

@Component({
    selector: 'app-view-not-found',
    templateUrl: './view-not-found.component.html',
    styleUrl: './view-not-found.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewNotFoundComponent {
}
