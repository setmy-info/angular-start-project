import { Environment } from './environment.model';

export const environment: Environment = {
    envName: 'test',
    production: true,
    apiBaseUrl: 'https://test.angular-start-project.setmy.info',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'https://keycloak.test.setmy.info',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'https://test.angular-start-project.setmy.info/auth/callback',
        postLogoutRedirectUri: 'https://test.angular-start-project.setmy.info/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['https://test.angular-start-project.setmy.info/rest'],
    },
};
