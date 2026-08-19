import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './shared/styles/globals.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './app/providers/store.ts'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppErrorBoundary } from './shared/components/common/AppErrorBoundary.tsx'
import './shared/lib/i18n'
import { syncSystemBarsWithTheme } from './shared/lib/theme'
import { pinStableSafeAreaTop } from './shared/lib/safeArea'
import { wireAndroidBackButton } from './shared/lib/backButton'

// @capacitor-community/safe-area v7 auto-enables when viewport-fit=cover is set in index.html.
// It polyfills env(safe-area-inset-*) on Android WebViews where native values return 0.

// The capacitor.config SystemBars style is static (light theme); re-align the
// native system-bar icons with the persisted theme the index.html boot
// script just applied. No-op on web.
syncSystemBarsWithTheme()

// Pin the status-bar inset into --safe-area-top-stable so keyboard-induced
// env() collapses can't drop top padding/scrims mid-typing. No-op on web.
pinStableSafeAreaTop()

// Android back gesture/button closes the top-most overlay, then navigates
// history, then minimizes. No-op on web and iOS.
wireAndroidBackButton()




// Mobile debug console (dev/preview only)
// if (import.meta.env.DEV || import.meta.env.MODE === 'preview') {
//   import('eruda').then((eruda) => eruda.default.init())
// }

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </AppErrorBoundary>
)
