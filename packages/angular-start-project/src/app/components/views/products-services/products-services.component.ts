import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';

@Component({
    selector: 'app-products-services',
    templateUrl: './products-services.component.html',
    styleUrl: './products-services.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsServicesComponent {
    protected readonly languageService = inject(LanguageService);
}
