import { Environment } from './environment.model';

export const environment: Environment = {
    envName: 'dev',
    production: false,
    apiBaseUrl: 'https://dev.angular-start-project.setmy.info',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'https://keycloak.dev.setmy.info',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'https://dev.angular-start-project.setmy.info/auth/callback',
        postLogoutRedirectUri: 'https://dev.angular-start-project.setmy.info/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['https://dev.angular-start-project.setmy.info/rest'],
    },
};
