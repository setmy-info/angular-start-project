import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet, RouterLink} from '@angular/router';

@Component({
    selector: 'main-panel',
    imports: [RouterOutlet, RouterLink],
    templateUrl: './main-panel.component.html',
    styleUrl: './main-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPanelComponent {}
