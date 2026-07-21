import {Directive, ElementRef, effect, inject, input} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

// Feature-toggle directive — ported from the old app's feature.directive.ts / the Vue app's
// v-feature. Usage: <div feature="bankAccounts">…</div>. Hides the element (display: none) when
// the flag in the library's config.features is missing or false. Flags live in
// angular-start-project-library/src/config/index.js.
@Directive({
    selector: '[feature]'
})
export class FeatureDirective {
    readonly feature = input.required<string>();

    private readonly element = inject(ElementRef<HTMLElement>);

    constructor() {
        effect(() => {
            const enabled = !!angularStartProjectLibrary.config.features[this.feature()];
            this.element.nativeElement.style.display = enabled ? '' : 'none';
        });
    }
}
