import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { CallbackFailure, isCallbackFailure } from '../../../auth/auth.model';
import { LanguageService } from '../../../services/language.service';

/**
 * Owns the `auth/callback` route — the path in `keycloak.redirectUri`. Keycloak redirects the
 * browser here with `?code=...&state=...` (or `?error=...`); this component hands the URL to
 * AuthService, which validates the state, exchanges the code and stores the tokens, and then
 * routes the user on to wherever they were going before the login.
 *
 * The route is intentionally NOT guarded: it is how a session comes into existence.
 */
@Component({
    selector: 'app-auth-callback',
    templateUrl: './auth-callback.component.html',
    styleUrl: './auth-callback.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackComponent {
    protected readonly languageService = inject(LanguageService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly failure = signal<CallbackFailure | null>(null);

    constructor() {
        void this.completeLogin();
    }

    protected retry(): void {
        const returnUrl = this.failure()?.returnUrl ?? '/';
        this.failure.set(null);
        void this.authService.login(returnUrl);
    }

    private async completeLogin(): Promise<void> {
        const result = await this.authService.handleCallback();

        if (!isCallbackFailure(result)) {
            // navigateByUrl also replaces the address bar, so the one-time code and state do not
            // stay in the URL, in the history, or in a bookmark.
            await this.router.navigateByUrl(result.returnUrl);
            return;
        }

        // A prompt=none probe (keycloak.silentSsoOnStartup) reports "there is no SSO session" as
        // an error. That is the expected answer for an anonymous visitor, not a failure to show.
        if (
            result.reason === 'provider_error' &&
            (result.error === 'login_required' || result.error === 'interaction_required')
        ) {
            await this.router.navigateByUrl(result.returnUrl);
            return;
        }

        this.failure.set(result);
    }
}
