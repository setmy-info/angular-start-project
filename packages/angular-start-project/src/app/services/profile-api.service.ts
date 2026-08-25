import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface UserProfile {
    userName: string;
    displayName: string;
    email: string;
}

/**
 * EXAMPLE of an authenticated API request.
 *
 * Note what is NOT here: no token, no Authorization header, no expiry check, no refresh, no
 * AuthService import. This is an ordinary business service. Because the URL starts with a
 * prefix listed in `keycloak.protectedResourceUrls`, authInterceptor obtains a valid access
 * token (renewing it first if it is within 30s of expiry), adds the bearer header, and retries
 * once if the backend answers 401. Keeping that entirely in the interceptor is what keeps
 * authentication isolated from application code.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
    private readonly httpClient = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/rest`;

    loadProfile(): Observable<UserProfile> {
        return this.httpClient.get<UserProfile>(`${this.baseUrl}/profile`);
    }
}
