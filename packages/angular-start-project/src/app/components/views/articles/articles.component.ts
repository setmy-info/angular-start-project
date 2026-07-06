import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-articles',
    imports: [RouterLink],
    templateUrl: './articles.component.html',
    styleUrl: './articles.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticlesComponent {
    protected readonly languageService = inject(LanguageService);
}
