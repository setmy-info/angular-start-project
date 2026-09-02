import { ChangeDetectionStrategy, Component, VERSION, computed, inject } from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';
import { LanguageService } from '../../../services/language.service';
import { LocationService } from '../../../services/location.service';
import { ContentService } from '../../../services/content.service';
import { PwaInstallService } from '../../../services/pwa-install.service';
import { PwaUpdateService } from '../../../services/pwa-update.service';
import { environment } from '../../../../environments/environment';
import { version } from '../../../config/version';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly locationService = inject(LocationService);
    private readonly contentService = inject(ContentService);
    protected readonly environment = environment;
    protected readonly version = version;
    // Angular's own version, read from the framework at runtime rather than from package.json,
    // so the page reports what actually shipped in this bundle.
    protected readonly angularVersion = VERSION.full;
    // Whether this build's version differs from the one stored on the previous visit
    // (check() is idempotent — cached after the first call at startup, see versionService.js).
    protected readonly versionState = angularStartProjectLibrary.versionService.check(
        version.version,
    );
    protected readonly hasServiceWorkerSupport = !!navigator.serviceWorker;
    // PWA diagnostics. `hasServiceWorkerSupport` above only answers "could this browser run one";
    // these answer "is one actually running, is a new build waiting, and can this be installed" —
    // the three questions asked whenever a deployed change does not show up for someone.
    protected readonly pwaUpdateService = inject(PwaUpdateService);
    protected readonly pwaInstallService = inject(PwaInstallService);
    protected readonly lastUpdateCheck = computed(() => {
        const timestamp = this.pwaUpdateService.lastCheckedAt();
        return timestamp ? new Date(timestamp).toLocaleString() : null;
    });
    protected readonly referrer = document.referrer;
    // The old settings page showed "Sub system" (per-tenant content JSON) and "Is IE"
    // (browserService.fillBrowserInfo) — subSystem is kept, isIE is replaced with a
    // current browser summary.
    protected readonly subSystem = computed(() => this.contentService.content().subSystem);
    protected readonly browserInfo = `${navigator.userAgent}`;

    protected readonly systemsService = angularStartProjectLibrary.systemsService;
    protected readonly devTenantSwitchEnabled = this.systemsService.isLocalDevHostname();
    protected readonly knownTenants = this.systemsService.KNOWN_TENANTS;
    protected readonly activeTenant = this.systemsService.getTenant();
    protected readonly tenantOverride = this.systemsService.getTenantOverride();

    protected onTenantOverrideChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.systemsService.setTenantOverride(select.value);
        globalThis.location.reload();
    }

    protected clearTenantOverride(): void {
        this.systemsService.clearTenantOverride();
        globalThis.location.reload();
    }

    protected readonly googleMapsUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.googleMapsUrl(position) : null;
    });

    protected readonly openStreetMapUrl = computed(() => {
        const position = this.locationService.lastKnownPosition();
        return position ? this.locationService.openStreetMapUrl(position) : null;
    });
}
