import { Environment } from './environment.model';

export const environment: Environment = {
    envName: 'ci',
    production: true,
    apiBaseUrl: 'https://ci.angular-start-project.setmy.info',
    keycloak: {
        // Master switch for the whole Keycloak enhancement — see environment.model.ts.
        enabled: false,
        issuer: 'https://keycloak.ci.setmy.info',
        realm: 'angular-start-project',
        clientId: 'angular-start-project',
        redirectUri: 'https://ci.angular-start-project.setmy.info/auth/callback',
        postLogoutRedirectUri: 'https://ci.angular-start-project.setmy.info/',
        scopes: ['openid', 'profile', 'email'],
        silentSsoOnStartup: false,
        protectedResourceUrls: ['https://ci.angular-start-project.setmy.info/rest'],
    },
};
