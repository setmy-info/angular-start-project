import { Environment } from './environment.model';

export const environment: Environment = {
    envName: 'live',
    production: true,
    apiBaseUrl: 'https://angular-start-project.setmy.info',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'https://keycloak.setmy.info',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'https://angular-start-project.setmy.info/auth/callback',
        postLogoutRedirectUri: 'https://angular-start-project.setmy.info/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['https://angular-start-project.setmy.info/rest'],
    },
};
