import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../auth/auth.service';
import { LanguageService } from '../../../services/language.service';
import { ProfileApiService, UserProfile } from '../../../services/profile-api.service';

/**
 * EXAMPLE of a protected view. The route that renders it carries `canActivate: [authGuard]`
 * (see app.routes.ts), so reaching this component at all means a session was established.
 *
 * The role check below is a rendering decision only — the backend enforces the same role on the
 * endpoint itself.
 */
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
    protected readonly languageService = inject(LanguageService);
    protected readonly authService = inject(AuthService);
    private readonly profileApiService = inject(ProfileApiService);
    // Captured here because takeUntilDestroyed() below runs from a click handler, outside the
    // component's injection context.
    private readonly destroyRef = inject(DestroyRef);

    protected readonly profile = signal<UserProfile | null>(null);
    protected readonly loadError = signal<string | null>(null);
    protected readonly isAdmin = computed(() => this.authService.hasRole('admin'));

    protected loadProfile(): void {
        this.loadError.set(null);
        this.profileApiService
            .loadProfile()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (profile) => this.profile.set(profile),
                error: (error: unknown) =>
                    this.loadError.set(
                        error instanceof HttpErrorResponse
                            ? `${error.status} ${error.statusText}`
                            : String(error),
                    ),
            });
    }

    protected logout(): void {
        void this.authService.logout();
    }
}
