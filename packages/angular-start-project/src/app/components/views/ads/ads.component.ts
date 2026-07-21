import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-ads',
    templateUrl: './ads.component.html',
    styleUrl: './ads.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdsComponent {
    protected readonly languageService = inject(LanguageService);
}
