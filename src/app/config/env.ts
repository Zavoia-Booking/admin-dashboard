export type APP_ENV_OPTIONS = 'development' | 'production';

const env = import.meta.env;

const resolvedEnv: APP_ENV_OPTIONS = (env.VITE_APP_ENV as APP_ENV_OPTIONS)
    || (env.DEV ? 'development' : 'production');

const config: {
    API_URL: string,
    APP_ENV: APP_ENV_OPTIONS,
} = {
    API_URL: env.VITE_API_URL || 'http://localhost:3000',
    APP_ENV: resolvedEnv,
}

export default config;