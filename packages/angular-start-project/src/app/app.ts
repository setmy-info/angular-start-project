import {ChangeDetectionStrategy, Component} from '@angular/core';
import {HeaderPanelComponent} from './components/layout/header-panel/header-panel.component';
import {SideNavPanelComponent} from './components/layout/side-navigation-panel/side-navigation-panel.component';
import {ModalOverlayComponent} from './components/layout/modal-body-panel/modal-overlay.component';
import {BackgroundComponent} from './components/background/background.component';
import {MainPanelComponent} from './components/layout/main-panel/main-panel.component';

@Component({
    selector: 'app',
    imports: [
        HeaderPanelComponent,
        MainPanelComponent,
        SideNavPanelComponent,
        ModalOverlayComponent,
        BackgroundComponent
    ],
    templateUrl: './app.html',
    styleUrl: './app.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
