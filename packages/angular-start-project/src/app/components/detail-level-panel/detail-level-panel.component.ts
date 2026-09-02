import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    computed,
    inject,
    input,
    numberAttribute,
} from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { DetailLevelService } from '../../services/detail-level.service';

// The reading-depth slider that replaces the old app's "kompaktne" / "detailne" button pair.
// A view drops it at the top of its section and says which key it is and how much text it opens
// with; everything else — remembering where the visitor left the slider, and gating the blocks
// marked with `detailLevel` — is the service's job.
//
//     <app-detail-level-panel viewKey="home" [defaultLevel]="1" />
@Component({
    selector: 'app-detail-level-panel',
    templateUrl: './detail-level-panel.component.html',
    styleUrl: './detail-level-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailLevelPanelComponent implements OnInit, OnDestroy {
    /** Identifies the page view whose level this slider drives. */
    readonly viewKey = input.required<string>();
    /** The level this view opens at when the visitor has not moved the slider on it yet. */
    readonly defaultLevel = input<number, unknown>(DetailLevelService.MIN_LEVEL, {
        transform: numberAttribute,
    });

    protected readonly languageService = inject(LanguageService);
    private readonly detailLevelService = inject(DetailLevelService);

    protected readonly minLevel = DetailLevelService.MIN_LEVEL;
    protected readonly maxLevel = DetailLevelService.MAX_LEVEL;

    protected readonly level = computed(() => this.detailLevelService.levelOf(this.viewKey()));
    protected readonly levelName = computed(() =>
        this.languageService.translate(`view.detailLevel.level${this.level()}`),
    );

    ngOnInit(): void {
        this.detailLevelService.registerView(this.viewKey(), this.defaultLevel());
    }

    ngOnDestroy(): void {
        this.detailLevelService.releaseView(this.viewKey());
    }

    protected onLevelChange(event: Event): void {
        const slider = event.target as HTMLInputElement;
        this.detailLevelService.select(this.viewKey(), Number(slider.value));
    }
}
