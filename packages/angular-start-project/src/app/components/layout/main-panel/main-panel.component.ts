import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
    selector: 'main-panel',
    imports: [RouterOutlet],
    templateUrl: './main-panel.component.html',
    styleUrl: './main-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPanelComponent {}
