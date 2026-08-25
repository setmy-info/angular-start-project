import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrl: './help.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent {
    protected readonly languageService = inject(LanguageService);
}
