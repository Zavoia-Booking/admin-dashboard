export type APP_ENV_OPTIONS = 'development' | 'production';

const env = import.meta.env;

const resolvedEnv: APP_ENV_OPTIONS = (env.VITE_APP_ENV as APP_ENV_OPTIONS)
    || (env.DEV ? 'development' : 'production');

const isDevelopment = resolvedEnv === 'development';

/**
 * Determines the API base URL based on the environment and access method
 * 
 * Priority order:
 * 1. VITE_API_URL environment variable (highest priority)
 * 2. Production mode: relative URL '/api' (assumes API on same domain)
 * 3. Development localhost: '/api' (uses Vite proxy to avoid CORS)
 * 4. Development IP/domain: Direct connection to backend
 * 5. Default fallback: '/api'
 */
const getApiUrl = (): string => {
    // 1. Explicit environment variable override
    if (env.VITE_API_URL) {
        if (isDevelopment) {
            console.info('🔧 Using VITE_API_URL:', env.VITE_API_URL);
        }
        return env.VITE_API_URL;
    }
    
    // 2. Production: use relative URL (same origin as frontend)
    if (!isDevelopment) {
        return '/api';
    }
    
    // 3. Development: auto-detect based on hostname
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // Localhost: use Vite proxy
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            if (isDevelopment) {
                console.info('🔧 Localhost detected: using /api proxy → http://localhost:3000');
            }
            return '/api';
        }
        
        // IP address (mobile testing via IP): direct connection
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            const apiUrl = `http://${hostname}:3000`;
            if (isDevelopment) {
                console.info('🔧 IP address detected:', apiUrl);
            }
            return apiUrl;
        }
        
        // Cloudflare tunnel or custom domain: use proxy
        // Since tunnel serves the preview build which includes Vite proxy
        if (isDevelopment) {
            console.info('🔧 Custom domain detected:', hostname, '→ using /api proxy');
        }
        return '/api';
    }
    
    // 4. Default fallback
    return '/api';
};

interface AppConfig {
    readonly API_URL: string;
    readonly APP_ENV: APP_ENV_OPTIONS;
    readonly BUILD_TIME: string;
    readonly VERSION: string;
}

const config: AppConfig = {
    API_URL: getApiUrl(),
    APP_ENV: resolvedEnv,
    BUILD_TIME: new Date().toISOString(),
    VERSION: env.VITE_APP_VERSION || '1.0.0',
} as const;

// Development-only logging
if (isDevelopment) {
    console.group('🔧 App Configuration');
    console.table({
        'API URL': config.API_URL,
        'Environment': config.APP_ENV,
        'Version': config.VERSION,
        'Build Time': new Date(config.BUILD_TIME).toLocaleString(),
        'Hostname': typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    });
    console.groupEnd();
}

export default config;