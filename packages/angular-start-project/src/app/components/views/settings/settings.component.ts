import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';
import {LanguageService} from '../../../services/language.service';
import {LocationService} from '../../../services/location.service';
import {ContentService} from '../../../services/content.service';
import {environment} from '../../../../environments/environment';
import {version} from '../../../config/version';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly locationService = inject(LocationService);
    private readonly contentService = inject(ContentService);
    protected readonly environment = environment;
    protected readonly version = version;
    // Whether this build's version differs from the one stored on the previous visit
    // (check() is idempotent — cached after the first call at startup, see versionService.js).
    protected readonly versionState = angularStartProjectLibrary.versionService.check(version.version);
    protected readonly hasServiceWorkerSupport = !!navigator.serviceWorker;
    protected readonly referrer = document.referrer;
    // The old settings page showed "Sub system" (per-tenant content JSON) and "Is IE"
    // (browserService.fillBrowserInfo) — subSystem is kept, isIE is replaced with a
    // current browser summary.
    protected readonly subSystem = computed(() => this.contentService.content().subSystem);
    protected readonly browserInfo = `${navigator.userAgent}`;

    protected readonly googleMapsUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.googleMapsUrl(position) : null;
    });

    protected readonly openStreetMapUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.openStreetMapUrl(position) : null;
    });
}
