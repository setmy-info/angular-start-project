import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-template-page',
    templateUrl: './template-page.component.html',
    styleUrl: './template-page.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplatePageComponent {
    protected readonly languageService = inject(LanguageService);
}
