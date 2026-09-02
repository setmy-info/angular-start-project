import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { DetailLevelPanelComponent } from '../../detail-level-panel/detail-level-panel.component';
import { DetailLevelDirective } from '../../../directives/detail-level.directive';

@Component({
    selector: 'app-template-page',
    imports: [DetailLevelPanelComponent, DetailLevelDirective],
    templateUrl: './template-page.component.html',
    styleUrl: './template-page.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePageComponent {
    protected readonly languageService = inject(LanguageService);
}
