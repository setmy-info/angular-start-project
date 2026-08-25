import { Injectable, signal } from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface SupportedLanguage {
    code: string;
    label: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
    readonly supportedLanguages: SupportedLanguage[] =
        angularStartProjectLibrary.translationService.getSupportedLanguages();

    // Starts from the persisted choice (localStorage LANG, like the old app) so the selected
    // language survives a reload; falls back to the first supported language.
    readonly currentLanguageCode = signal<string>(
        angularStartProjectLibrary.translationService.getStoredLanguage() ??
            this.supportedLanguages[0]?.code ??
            'en',
    );

    // Starts from whatever is already cached (instant, synchronous) and is replaced once
    // loadTranslations() resolves — see translationService.js for the version-check/cache design.
    readonly translations = signal<Record<string, string>>(
        angularStartProjectLibrary.translationService.getCachedTranslations(
            this.currentLanguageCode(),
        ),
    );

    constructor() {
        this.loadTranslations(this.currentLanguageCode());
    }

    changeLanguage(code: string): void {
        // language-change statistics event (old app did this in the header's
        // languageSelectionChange; batched + feature-gated, see the library's statisticsService)
        angularStartProjectLibrary.statisticsService.write(
            { fromLanguage: this.currentLanguageCode(), toLanguage: code },
            angularStartProjectLibrary.constants.CHANGE_EVENT_NAME,
        );
        angularStartProjectLibrary.translationService.storeLanguage(code);
        this.currentLanguageCode.set(code);
        this.loadTranslations(code);
    }

    translate(key: string): string {
        return this.translations()[key] || key;
    }

    private loadTranslations(code: string): void {
        angularStartProjectLibrary.translationService
            .loadTranslations(code)
            .then((translations: Record<string, string>) => {
                // guard against a slow, now-stale response overwriting a newer language selection
                if (this.currentLanguageCode() === code) {
                    this.translations.set(translations);
                }
            });
    }
}
