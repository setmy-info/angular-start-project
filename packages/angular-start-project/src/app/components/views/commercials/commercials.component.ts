import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-commercials',
    templateUrl: './commercials.component.html',
    styleUrl: './commercials.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommercialsComponent {
    protected readonly languageService = inject(LanguageService);
}
