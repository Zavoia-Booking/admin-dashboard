export type APP_ENV_OPTIONS = 'development' | 'production';

const env = import.meta.env;

const isDevelopment = env.DEV === true;

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
 * Gets the API URL.
 * 
 * Set VITE_API_URL in your .env files:
 *   - .env (or .env.local): For web dev, usually not needed (uses Vite proxy via /api)
 *   - .env.android: http://10.0.2.2:3000 (emulator) or http://YOUR_IP:3000 (device)
 *   - .env.production: https://api.bookaroo.com
 */
const getApiUrl = (): string => {
    // Use explicit env var if set (recommended)
    if (env.VITE_API_URL) {
        return env.VITE_API_URL;
    }
    
    // Fallback: /api works with Vite proxy in dev, same-origin in production web
    // WARNING: This won't work for native apps! Set VITE_API_URL for mobile builds.
    if (isNativeApp()) {
        console.error(
            '[Bookaroo] Native app running without VITE_API_URL! ' +
            'Set VITE_API_URL in .env.android or .env.production'
        );
    }
    
    return '/api';
};

interface AppConfig {
    readonly API_URL: string;
    readonly APP_ENV: APP_ENV_OPTIONS;
    readonly VERSION: string;
    readonly IS_NATIVE: boolean;
    readonly PLATFORM: 'android' | 'ios' | 'web';
}

const config: AppConfig = {
    API_URL: getApiUrl(),
    APP_ENV: isDevelopment ? 'development' : 'production',
    VERSION: env.VITE_APP_VERSION || '1.0.0',
    IS_NATIVE: isNativeApp(),
    PLATFORM: getNativePlatform(),
} as const;

export default config;

export { isNativeApp, getNativePlatform };
