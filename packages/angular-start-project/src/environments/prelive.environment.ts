import { Environment } from './environment.model';

export const environment: Environment = {
    envName: 'prelive',
    production: true,
    apiBaseUrl: 'https://prelive.angular-start-project.setmy.info',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'https://keycloak.prelive.setmy.info',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'https://prelive.angular-start-project.setmy.info/auth/callback',
        postLogoutRedirectUri: 'https://prelive.angular-start-project.setmy.info/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['https://prelive.angular-start-project.setmy.info/rest'],
    },
};
