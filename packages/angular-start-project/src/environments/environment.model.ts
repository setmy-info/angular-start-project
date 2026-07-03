export interface Environment {
    envName: 'local' | 'dev' | 'ci' | 'test' | 'prelive' | 'live';
    production: boolean;
    apiBaseUrl: string;
}
