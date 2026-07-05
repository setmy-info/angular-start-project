import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly environment = environment;
    protected readonly hasServiceWorkerSupport = !!navigator.serviceWorker;
    protected readonly referrer = document.referrer;
}
