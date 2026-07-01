import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrl: './about.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
    protected readonly languageService = inject(LanguageService);
}
