import {Injectable, computed, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface SupportedLanguage {
    code: string;
    label: string;
}

@Injectable({providedIn: 'root'})
export class LanguageService {

    readonly supportedLanguages: SupportedLanguage[] = angularStartProjectLibrary.translationService.getSupportedLanguages();

    readonly currentLanguageCode = signal<string>(this.supportedLanguages[0]?.code ?? 'en');

    readonly translations = computed(() =>
        angularStartProjectLibrary.translationService.getTranslations(this.currentLanguageCode())
    );

    changeLanguage(code: string): void {
        this.currentLanguageCode.set(code);
    }

    translate(key: string): string {
        return angularStartProjectLibrary.translationService.getTranslation(this.currentLanguageCode(), key);
    }
}
