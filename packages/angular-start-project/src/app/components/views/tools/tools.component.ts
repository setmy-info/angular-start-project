import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-tools',
    templateUrl: './tools.component.html',
    styleUrl: './tools.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsComponent {
    protected readonly languageService = inject(LanguageService);
}
