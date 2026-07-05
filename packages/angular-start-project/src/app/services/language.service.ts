import {Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface SupportedLanguage {
    code: string;
    label: string;
}

@Injectable({providedIn: 'root'})
export class LanguageService {

    readonly supportedLanguages: SupportedLanguage[] = angularStartProjectLibrary.translationService.getSupportedLanguages();

    readonly currentLanguageCode = signal<string>(this.supportedLanguages[0]?.code ?? 'en');

    // Starts from whatever is already cached (instant, synchronous) and is replaced once
    // loadTranslations() resolves — see translationService.js for the version-check/cache design.
    readonly translations = signal<Record<string, string>>(
        angularStartProjectLibrary.translationService.getCachedTranslations(this.currentLanguageCode())
    );

    constructor() {
        this.loadTranslations(this.currentLanguageCode());
    }

    changeLanguage(code: string): void {
        this.currentLanguageCode.set(code);
        this.loadTranslations(code);
    }

    translate(key: string): string {
        return this.translations()[key] || key;
    }

    private loadTranslations(code: string): void {
        angularStartProjectLibrary.translationService.loadTranslations(code).then((translations: Record<string, string>) => {
            // guard against a slow, now-stale response overwriting a newer language selection
            if (this.currentLanguageCode() === code) {
                this.translations.set(translations);
            }
        });
    }
}
