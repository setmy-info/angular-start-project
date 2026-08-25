import { Environment } from './environment.model';

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
