import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'app-footer-panel',
    templateUrl: './footer-panel.component.html',
    styleUrl: './footer-panel.component.less',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterPanelComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly currentYear = new Date().getFullYear();
    protected readonly environment = environment;
}
