import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';
import {LocationService} from '../../../services/location.service';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly locationService = inject(LocationService);
    protected readonly environment = environment;
    protected readonly hasServiceWorkerSupport = !!navigator.serviceWorker;
    protected readonly referrer = document.referrer;

    protected readonly googleMapsUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.googleMapsUrl(position) : null;
    });

    protected readonly openStreetMapUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.openStreetMapUrl(position) : null;
    });
}
