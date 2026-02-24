import {Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

export interface MenuItem {
    id: number;
    path: string;
    label: string;
    icon: string;
    translationKey?: string;
}

@Injectable({providedIn: 'root'})
export class MenuService {

    readonly rawMenuItems = signal<MenuItem[]>(angularStartProjectLibrary.menuModel.default || []);
}
