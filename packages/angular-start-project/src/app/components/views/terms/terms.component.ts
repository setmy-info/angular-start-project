import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-terms',
    templateUrl: './terms.component.html',
    styleUrl: './terms.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
    protected readonly languageService = inject(LanguageService);
}
