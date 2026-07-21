import {DestroyRef, Injectable, inject, signal} from '@angular/core';

// Ported from the old app's HeaderPanelComponent (isOnline/setOnline/setOffline + the
// window 'online'/'offline' listeners) — dropped when the header was migrated to Angular,
// leaving a dead `<li class="hidden"></li>` placeholder in header-panel.component.html.
@Injectable({providedIn: 'root'})
export class NetworkService {
    readonly isOnline = signal<boolean>(navigator.onLine);

    constructor() {
        const setOnline = () => this.isOnline.set(true);
        const setOffline = () => this.isOnline.set(false);

        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);

        inject(DestroyRef).onDestroy(() => {
            window.removeEventListener('online', setOnline);
            window.removeEventListener('offline', setOffline);
        });
    }
}
