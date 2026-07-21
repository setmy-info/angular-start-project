import {Pipe, PipeTransform, inject} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

// Ported from the old app's skip-sanitizing-html.pipe.ts. Only for HTML the app itself produced
// (the objToDomService JSON-document renderer output) — never for user- or network-supplied
// markup from untrusted sources.
@Pipe({name: 'skipSanitizingHtml'})
export class SkipSanitizingHtmlPipe implements PipeTransform {
    private readonly sanitizer = inject(DomSanitizer);

    transform(value: string | null | undefined): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(value ?? '');
    }
}
