import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ConsentService} from '../../../services/consent.service';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'consent-body-panel',
    imports: [RouterLink],
    templateUrl: './consent-body-panel.component.html',
    styleUrl: './consent-body-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsentBodyPanelComponent {
    protected readonly consentService = inject(ConsentService);
    protected readonly languageService = inject(LanguageService);
}
