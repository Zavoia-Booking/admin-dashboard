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
      // Minimum visible duration. Native splash provides instant brand
      // background while the web view boots; once boot completes the
      // splash auto-hides. The web splash animation begins immediately
      // after that. Shorter = less time the user sees the static logo
      // image before the animated mark takes over.
      // For a fully seamless transition, the source asset at
      // `assets/splash.png` should be a SOLID #FAFAF7 image (no logo) —
      // then the native splash is just a colored background and the
      // logo only appears once, animated, in the web splash.
      // Regenerate with `npx capacitor-assets generate` after editing.
      launchShowDuration: 200,
      launchAutoHide: true,
      backgroundColor: '#FAFAF7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // System-bar ownership split: Capacitor core's SystemBars plugin owns the
    // bar icon style (initial value here, runtime changes via
    // SystemBars.setStyle in src/shared/lib/theme.ts — core re-applies its
    // remembered style on configuration changes, so it must be the single
    // writer). The community SafeArea plugin only polyfills
    // env(safe-area-inset-*); giving it a style config too would make the two
    // plugins fight over the same WindowInsetsController. insetsHandling is
    // disabled per the SafeArea plugin's requirement — it logs an error and
    // misbehaves when core also injects inset variables.
    SystemBars: {
      insetsHandling: 'disable',
      style: 'LIGHT',
    },
  },
};

export default config;
