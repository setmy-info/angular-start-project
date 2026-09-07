import { Environment } from './environment.model';

// Default file, used by `ng serve`/`ng test` when no build configuration replaces it.
// Identical to local.environment.ts — see angular.json "fileReplacements" per configuration
// (`local` and `live` are the configurations in use; the other files are placeholders).
// Files are named "<name>.environment.ts" (not "environment.<name>.ts") because Vitest's
// default test-file glob matches "*.test.ts", which would otherwise swallow environment.test.ts.
export const environment: Environment = {
    envName: 'local',
    production: false,
    apiBaseUrl: 'http://localhost:4200',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'http://localhost:8080',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'http://localhost:4200/auth/callback',
        postLogoutRedirectUri: 'http://localhost:4200/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['http://localhost:4200/rest'],
    },
};
