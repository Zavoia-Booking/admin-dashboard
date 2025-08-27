export enum APP_ENV_OPTIONS {
    'development' = 'development',
    'production' = 'production',
    'staging' = 'staging',
    'local' = 'local'
}

const config: {
    API_URL: string,
    APP_ENV: APP_ENV_OPTIONS,
    BASE_CDN: string,
} = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'localhost:3000',
    APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV) as APP_ENV_OPTIONS || APP_ENV_OPTIONS.local,
    BASE_CDN: process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://s3.sys.alexandruleca.com',
}

export default config;