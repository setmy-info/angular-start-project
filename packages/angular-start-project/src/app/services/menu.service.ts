import { computed, Injectable, signal } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class MenuService {
    // Per-tenant menu set (the old app's menuService ngo*/llc* selection, keyed by
    // tenantService.getTenant() here) — see menuModel.js in the library.
    readonly rawMenuItems = signal<MenuItem[]>(
        angularStartProjectLibrary.menuModel.getMenuItems(
            angularStartProjectLibrary.tenantService.getTenant(),
        ) || [],
    );

    readonly headerMenuItems = computed(() =>
        this.rawMenuItems().filter((item) => item.header !== false),
    );
}
