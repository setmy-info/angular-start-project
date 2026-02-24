import {computed, inject, Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';
import {LanguageService} from './language.service';

export interface MenuItem {
    id: number;
    path: string;
    label: string;
    icon: string;
    translationKey?: string;
}

@Injectable({providedIn: 'root'})
export class MenuService {
    private readonly languageService = inject(LanguageService);

    readonly rawMenuItems = signal<MenuItem[]>(angularStartProjectLibrary.menuModel.default || []);

    readonly menuItems = computed(() =>
        this.rawMenuItems().map(item => ({
            ...item,
            label: item.translationKey ? this.languageService.translate(item.translationKey) : item.label
        }))
    );
}
