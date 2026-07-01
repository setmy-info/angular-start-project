import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-view-not-found',
    imports: [RouterLink],
    templateUrl: './view-not-found.component.html',
    styleUrl: './view-not-found.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewNotFoundComponent {
    protected readonly languageService = inject(LanguageService);
}
