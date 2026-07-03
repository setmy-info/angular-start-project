import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {FooterPanelComponent} from '../footer-panel/footer-panel.component';

@Component({
    selector: 'main-panel',
    imports: [RouterOutlet, FooterPanelComponent],
    templateUrl: './main-panel.component.html',
    styleUrl: './main-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPanelComponent {
}
