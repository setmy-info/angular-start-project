import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-sponsors',
    templateUrl: './sponsors.component.html',
    styleUrl: './sponsors.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SponsorsComponent {
    protected readonly languageService = inject(LanguageService);
}
