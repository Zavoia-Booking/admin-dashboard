export type APP_ENV_OPTIONS = 'development' | 'production';

const env = import.meta.env;

const resolvedEnv: APP_ENV_OPTIONS = (env.VITE_APP_ENV as APP_ENV_OPTIONS)
    || (env.DEV ? 'development' : 'production');

const isDevelopment = resolvedEnv === 'development';

/**
 * Detects if the app is running inside a Capacitor native container
 */
const isNativeApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Capacitor sets this when running in native context
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
 * Determines the API base URL based on the environment and access method
 * 
 * Priority order:
 * 1. VITE_API_URL environment variable (highest priority)
 * 2. Native app (Capacitor): Use the configured production API URL
 * 3. Production mode: relative URL '/api' (assumes API on same domain)
 * 4. Development localhost: '/api' (uses Vite proxy to avoid CORS)
 * 5. Development IP/domain: Direct connection to backend
 * 6. Default fallback: '/api'
 */
const getApiUrl = (): string => {
    // 1. Explicit environment variable override
    if (env.VITE_API_URL) {
        return env.VITE_API_URL;
    }
    
    // 2. Native app: MUST use absolute URL since there's no web server
    // The app is loaded from local files, so relative URLs don't work
    if (isNativeApp()) {
        // You MUST set VITE_API_URL in your .env.production for native builds
        // Example: VITE_API_URL=https://api.bookaroo.com
        console.warn(
            '[Bookaroo] Running as native app without VITE_API_URL configured. ' +
            'Please set VITE_API_URL in .env.production to your production API URL.'
        );
        // Fallback for development/testing - update this to your actual API URL
        return 'https://api.bookaroo.com';
    }
    
    // 3. Production web: use relative URL (same origin as frontend)
    if (!isDevelopment) {
        return '/api';
    }
    
    // 4. Development: auto-detect based on hostname
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // Localhost: use Vite proxy
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return '/api';
        }
        
        // IP address (mobile testing via IP): direct connection
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            const apiUrl = `http://${hostname}:3000`;
            return apiUrl;
        }
        
        // Cloudflare tunnel or custom domain: use proxy
        // Since tunnel serves the preview build which includes Vite proxy
        return '/api';
    }
    
    // 5. Default fallback
    return '/api';
};

interface AppConfig {
    readonly API_URL: string;
    readonly APP_ENV: APP_ENV_OPTIONS;
    readonly BUILD_TIME: string;
    readonly VERSION: string;
    readonly IS_NATIVE: boolean;
    readonly PLATFORM: 'android' | 'ios' | 'web';
}

const config: AppConfig = {
    API_URL: getApiUrl(),
    APP_ENV: resolvedEnv,
    BUILD_TIME: new Date().toISOString(),
    VERSION: env.VITE_APP_VERSION || '1.0.0',
    IS_NATIVE: isNativeApp(),
    PLATFORM: getNativePlatform(),
} as const;

export default config;

// Export utilities for use in other parts of the app
export { isNativeApp, getNativePlatform };