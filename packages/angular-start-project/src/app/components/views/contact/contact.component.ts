import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
    protected readonly languageService = inject(LanguageService);
}
