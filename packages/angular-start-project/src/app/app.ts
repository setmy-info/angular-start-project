import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderPanelComponent} from './components/layout/header-panel/header-panel.component';
import {FooterPanelComponent} from './components/layout/footer-panel/footer-panel.component';
import {SideNavPanelComponent} from './components/layout/side-nav-panel/side-nav-panel.component';
import {ModalBodyPanelComponent} from './components/layout/modal-overlay/modal-overlay.component';
import {BackgroundComponent} from './components/background/background.component';

import {MainPanelComponent} from './components/layout/main-panel/main-panel.component';

@Component({
    selector: 'app',
    imports: [
        HeaderPanelComponent,
        MainPanelComponent,
        SideNavPanelComponent,
        ModalBodyPanelComponent,
        BackgroundComponent
    ],
    templateUrl: './app.html',
    styleUrl: './app.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
