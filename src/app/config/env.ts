export type APP_ENV_OPTIONS = 'development' | 'staging' | 'production';

const env = import.meta.env;

/**
 * Detects if the app is running inside a Capacitor native container
 */
const isNativeApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    // @ts-expect-error - Capacitor global is injected at runtime
    return window.Capacitor?.isNativePlatform?.() === true;
};

/**
 * Gets the native platform name (android, ios, web)
 */
const getNativePlatform = (): 'android' | 'ios' | 'web' => {
    if (typeof window === 'undefined') return 'web';
    // @ts-expect-error - Capacitor global is injected at runtime
    return window.Capacitor?.getPlatform?.() ?? 'web';
};

/**
 * Determines the current app environment.
 * 
 * - Local dev: import.meta.env.DEV is true → 'development'
 * - Vercel staging: VITE_APP_ENV=staging → 'staging'
 * - Vercel production: VITE_APP_ENV=production → 'production'
 */
const getAppEnv = (): APP_ENV_OPTIONS => {
    // Local development (Vite dev server)
    if (env.DEV) {
        return 'development';
    }
    
    // Deployed builds must explicitly set VITE_APP_ENV
    const appEnv = env.VITE_APP_ENV as APP_ENV_OPTIONS | undefined;
    
    if (!appEnv || !['staging', 'production'].includes(appEnv)) {
        console.error(
            '[Zavoia] Missing or invalid VITE_APP_ENV! ' +
            'Set VITE_APP_ENV=staging or VITE_APP_ENV=production in Vercel.'
        );
        // Default to staging to avoid accidentally hitting production
        return 'staging';
    }
    
    return appEnv;
};

/**
 * Gets the API URL.
 * 
 * - Local dev: Falls back to '/api' (works with Vite proxy)
 * - Staging/Production: Must be set via VITE_API_URL in Vercel
 */
const getApiUrl = (): string => {
    // Use explicit env var if set
    if (env.VITE_API_URL) {
        return env.VITE_API_URL;
    }
    
    // Fallback for local web dev (Vite proxy handles /api → backend)
    if (env.DEV && !isNativeApp()) {
        return '/api';
    }
    
    // Native apps or deployed builds without VITE_API_URL - this is a config error
    console.error(
        '[Zavoia] Missing VITE_API_URL! ' +
        'Set VITE_API_URL in your Vercel environment variables.'
    );
    
    return '/api';
};

interface AppConfig {
    readonly API_URL: string;
    readonly APP_ENV: APP_ENV_OPTIONS;
    readonly IS_NATIVE: boolean;
    readonly PLATFORM: 'android' | 'ios' | 'web';
    readonly IS_DEV: boolean;
    readonly IS_STAGING: boolean;
    readonly IS_PROD: boolean;
}

const appEnv = getAppEnv();

const config: AppConfig = {
    API_URL: getApiUrl(),
    APP_ENV: appEnv,
    IS_NATIVE: isNativeApp(),
    PLATFORM: getNativePlatform(),
    // Convenience flags
    IS_DEV: appEnv === 'development',
    IS_STAGING: appEnv === 'staging',
    IS_PROD: appEnv === 'production',
} as const;

export default config;

export { isNativeApp, getNativePlatform };
