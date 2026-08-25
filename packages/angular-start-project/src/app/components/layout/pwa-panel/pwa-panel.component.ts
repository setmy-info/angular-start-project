import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { PwaInstallService } from '../../../services/pwa-install.service';
import { PwaUpdateService } from '../../../services/pwa-update.service';

// The two PWA prompts the app owes the user, in one banner strip: "a new version is ready" and
// "install this app". Both are normally invisible — the strip renders nothing at all unless one of
// the services says otherwise, so it costs an empty <div> on every other page load.
@Component({
    selector: 'pwa-panel',
    templateUrl: './pwa-panel.component.html',
    styleUrl: './pwa-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaPanelComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly updateService = inject(PwaUpdateService);
    protected readonly installService = inject(PwaInstallService);
}
