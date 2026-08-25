import { Injectable, effect, inject, signal } from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';
import { LanguageService } from './language.service';

export interface ContactsContent {
    organisation?: string;
    address?: string;
    phone?: string;
    email?: string;
    facebook?: string;
    github?: string;
    x?: string;
    slack?: string;
    bank?: string;
    swift?: string;
    bankAccount?: string;
}

export interface TenantContent {
    pageTitle?: string;
    subSystem?: string;
    contacts?: ContactsContent;
}

// Per-tenant content (the old app's pagesService/modelService.system equivalent): loads
// public/json/content/<tenant>/<lang>.json through the library's version-checked cache and
// re-loads whenever the language changes. See contentService.js in the library.
@Injectable({ providedIn: 'root' })
export class ContentService {
    private readonly languageService = inject(LanguageService);
    private readonly tenant: string = angularStartProjectLibrary.tenantService.getTenant();

    readonly content = signal<TenantContent>(
        angularStartProjectLibrary.contentService.getCachedContent(
            this.tenant,
            this.languageService.currentLanguageCode(),
        ),
    );

    constructor() {
        effect(() => {
            const lang = this.languageService.currentLanguageCode();
            angularStartProjectLibrary.contentService
                .loadContent(this.tenant, lang)
                .then((content: TenantContent) => {
                    if (this.languageService.currentLanguageCode() === lang) {
                        this.content.set(content);
                    }
                });
        });
    }
}
