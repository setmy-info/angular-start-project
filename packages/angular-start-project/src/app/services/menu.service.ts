import {computed, Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface MenuItem {
    id: number;
    path: string;
    label: string;
    icon: string;
    translationKey?: string;
    // Side navigation (hamburger menu) shows every item; set to false to hide an item from the
    // top header menu, e.g. Terms of use.
    header?: boolean;
}

@Injectable({providedIn: 'root'})
export class MenuService {

    readonly rawMenuItems = signal<MenuItem[]>(angularStartProjectLibrary.menuModel.default || []);

    readonly headerMenuItems = computed(() => this.rawMenuItems().filter(item => item.header !== false));
}
