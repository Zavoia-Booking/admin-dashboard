import type { CapacitorConfig } from '@capacitor/cli';

// Live reload: Set LIVE_RELOAD_IP to your machine's IP address
// Example: LIVE_RELOAD_IP=192.168.1.100 npx cap sync android
const liveReloadIP = process.env.LIVE_RELOAD_IP;

const isProduction = process.env.NODE_ENV === 'production';

// Use HTTP scheme for dev builds to avoid mixed content issues with local HTTP APIs
const useHttpScheme = process.env.CAPACITOR_USE_HTTP === 'true';

const config: CapacitorConfig = {
  appId: 'com.zavoia.admin',
  appName: 'Zavoia Admin',
  webDir: 'dist',

  server: {
    // Live reload: load from Vite dev server
    ...(liveReloadIP ? {
      url: `http://${liveReloadIP}:5173`,
      cleartext: true,
    } : {}),
    // Use HTTP scheme for dev builds (avoids mixed content with http:// APIs)
    ...(useHttpScheme ? {
      androidScheme: 'http',
    } : {}),
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: !isProduction,
  },

  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    webContentsDebuggingEnabled: !isProduction,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#9333ea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
