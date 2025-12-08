import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookaroo.admin',
  appName: 'Bookaroo Admin',
  webDir: 'dist',
  
  // Server configuration for development
  // Comment out for production builds
  // server: {
  //   url: 'http://YOUR_LOCAL_IP:5173',
  //   cleartext: true
  // },

  // Android specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Set to false for production
  },

  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
  },

  // Plugins configuration
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
