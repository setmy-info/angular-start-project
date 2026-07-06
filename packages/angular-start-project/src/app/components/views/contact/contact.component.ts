import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {LanguageService} from '../../../services/language.service';
import {ContentService} from '../../../services/content.service';
import {FeatureDirective} from '../../../directives/feature.directive';

@Component({
    selector: 'app-contact',
    imports: [FeatureDirective],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
    protected readonly languageService = inject(LanguageService);
    private readonly contentService = inject(ContentService);

    // Contact data comes from the per-tenant content JSON
    // (public/json/content/<tenant>/<lang>.json), like the old app's modelService.system.contacts.
    protected readonly contacts = computed(() => this.contentService.content().contacts ?? {});
}
