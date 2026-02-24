import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
    selector: 'app-footer-panel',
    templateUrl: './footer-panel.component.html',
    styleUrl: './footer-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterPanelComponent {}
