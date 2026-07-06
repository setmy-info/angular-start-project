import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-news',
    templateUrl: './news.component.html',
    styleUrl: './news.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsComponent {
    protected readonly languageService = inject(LanguageService);
}
