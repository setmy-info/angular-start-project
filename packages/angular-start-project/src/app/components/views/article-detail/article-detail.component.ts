import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {map} from 'rxjs';
import angularStartProjectLibrary from 'angular-start-project-library';
import {LanguageService} from '../../../services/language.service';
import {SkipSanitizingHtmlPipe} from '../../../pipes/skip-sanitizing-html.pipe';

// JSON-document article rendering — ported from the old app's articles-page/json-articles
// components. Loads public/json/documents/<id>.json via the library's jsonDocumentService,
// renders it to HTML (objToDomService) into [innerHTML], and offers the reverse round-trip: the
// rendered document is contenteditable, and "Parse" converts the (possibly edited) DOM back into
// the JSON document format (domToJsonService) shown in the textarea. Unknown ids show the
// fallback message (old unknown-article component).
@Component({
    selector: 'app-article-detail',
    imports: [RouterLink, SkipSanitizingHtmlPipe],
    templateUrl: './article-detail.component.html',
    styleUrl: './article-detail.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleDetailComponent {
    protected readonly languageService = inject(LanguageService);
    private readonly route = inject(ActivatedRoute);

    protected readonly id = toSignal(this.route.params.pipe(map(params => params['id'] as string)), {initialValue: ''});
    protected readonly documentHtml = signal<string | null>(null);
    protected readonly unknown = signal<boolean>(false);
    protected readonly parsed = signal<string>('');

    constructor() {
        effect(() => {
            const id = this.id();
            this.documentHtml.set(null);
            this.unknown.set(false);
            this.parsed.set('');
            if (!id) {
                this.unknown.set(true);
                return;
            }
            angularStartProjectLibrary.jsonDocumentService.load(id)
                .then((html: string) => {
                    if (this.id() === id) {
                        this.documentHtml.set(html);
                    }
                })
                .catch(() => {
                    if (this.id() === id) {
                        this.unknown.set(true);
                    }
                });
        });
    }

    protected parse(): void {
        const element = document.getElementById('jsonDocument');
        if (element) {
            this.parsed.set(angularStartProjectLibrary.jsonDocumentService.parse(element));
        }
    }
}
