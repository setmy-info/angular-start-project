import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { ConsentService } from '../../../services/consent.service';

@Component({
    selector: 'app-privacy',
    imports: [RouterLink],
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly consentService = inject(ConsentService);

    protected onCookieConsentChange(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked) {
            this.consentService.accept();
        } else {
            this.consentService.revoke();
        }
    }
}
