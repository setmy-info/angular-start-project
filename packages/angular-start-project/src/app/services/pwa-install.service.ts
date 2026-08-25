import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

// Mirror of the library's pwaInstallService state — see PwaUpdateState for why it is declared here.
export interface PwaInstallState {
    canInstall: boolean;
    installed: boolean;
    standalone: boolean;
    dismissedAt: number | null;
    lastOutcome: 'accepted' | 'dismissed' | 'unavailable' | null;
    shouldPrompt: boolean;
}

// Thin Angular adapter over angular-start-project-library/src/services/pwaInstallService.js.
//
// Note what is NOT here: the `beforeinstallprompt` listener. That event fires once, very early,
// and is unrecoverable if missed, so it is captured by the library from main.ts before Angular
// bootstraps (see main.ts). This service only mirrors the resulting state into signals and
// forwards the two user actions.
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
    private readonly library = angularStartProjectLibrary.pwaInstallService;

    readonly state = signal<PwaInstallState>(this.library.getState());
    readonly canInstall = computed(() => this.state().canInstall);
    readonly installed = computed(() => this.state().installed);
    readonly standalone = computed(() => this.state().standalone);
    // What the banner binds to: installable, not already installed, not recently dismissed.
    readonly showInstallBanner = computed(() => this.state().shouldPrompt);

    constructor() {
        const unsubscribe = this.library.subscribe((next: PwaInstallState) => this.state.set(next));

        inject(DestroyRef).onDestroy(unsubscribe);
        // Idempotent: main.ts already called it. Repeated here so the service is self-sufficient
        // if it is ever used outside this app's bootstrap.
        this.library.listen();
    }

    // Must be called from a user gesture (a click handler) — browsers reject a programmatic
    // prompt() otherwise. Never rejects.
    install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
        return this.library.prompt();
    }

    // "Later" — suppressed for config.pwa.installPromptDismissDays, persisted in localStorage.
    dismiss(): void {
        this.library.dismiss();
    }
}
