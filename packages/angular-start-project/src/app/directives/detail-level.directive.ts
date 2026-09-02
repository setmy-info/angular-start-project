import { Directive, ElementRef, effect, inject, input, numberAttribute } from '@angular/core';
import { DetailLevelService } from '../services/detail-level.service';

// Marks a block of text with the detail level it belongs to, and hides it (display: none) while
// the page view's slider sits below that level — the same way FeatureDirective hides a
// feature-gated block. Usage:
//
//     <div class="detailed" detailLevel="2">…</div>
//
// `.detailed` is the green left border from setmy-info-less (utility/notes.less), carried over
// from the old app; the attribute is what makes the block appear from level 2 upwards.
@Directive({
    selector: '[detailLevel]',
})
export class DetailLevelDirective {
    readonly detailLevel = input.required<number, unknown>({ transform: numberAttribute });

    private readonly element = inject(ElementRef<HTMLElement>);
    private readonly detailLevelService = inject(DetailLevelService);

    constructor() {
        effect(() => {
            const visible = this.detailLevelService.isVisible(this.detailLevel());
            this.element.nativeElement.style.display = visible ? '' : 'none';
        });
    }
}
