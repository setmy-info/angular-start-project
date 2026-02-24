import {computed, Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface Language {
    code: string;
    label: string;
}

@Injectable({providedIn: 'root'})
export class LanguageService {
    readonly supportedLanguages = signal<Language[]>(angularStartProjectLibrary.translationService.getSupportedLanguages());
    readonly currentLanguageCode = signal<string>('en');

    readonly currentLanguage = computed(() =>
        this.supportedLanguages().find(l => l.code === this.currentLanguageCode()) ?? this.supportedLanguages()[0]
    );

    readonly translations = computed(() =>
        angularStartProjectLibrary.translationService.getTranslations(this.currentLanguageCode())
    );

    changeLanguage(code: string): void {
        if (this.supportedLanguages().some(l => l.code === code)) {
            this.currentLanguageCode.set(code);
        }
    }

    translate(key: string): string {
        return this.translations()[key] || key;
    }
}
