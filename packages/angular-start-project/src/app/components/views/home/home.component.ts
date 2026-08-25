import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    protected readonly languageService = inject(LanguageService);
}
