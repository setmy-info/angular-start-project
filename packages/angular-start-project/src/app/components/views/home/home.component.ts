import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { DetailLevelPanelComponent } from '../../detail-level-panel/detail-level-panel.component';
import { DetailLevelDirective } from '../../../directives/detail-level.directive';

@Component({
    selector: 'app-home',
    imports: [DetailLevelPanelComponent, DetailLevelDirective],
    templateUrl: './home.component.html',
    styleUrl: './home.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    protected readonly languageService = inject(LanguageService);
}
