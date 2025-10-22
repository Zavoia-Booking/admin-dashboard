import { createRoot } from 'react-dom/client'
import './shared/styles/globals.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './app/providers/store.ts'
import { Toaster } from './shared/components/ui/sonner.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './shared/lib/i18n'
import { PWAUpdatePrompt } from './shared/components/common/PWAUpdatePrompt.tsx'
import { PWAInstallPrompt } from './shared/components/common/PWAInstallPrompt.tsx'

// Mobile debug console (dev/preview only)
if (import.meta.env.DEV || import.meta.env.MODE === 'preview') {
  import('eruda').then((eruda) => eruda.default.init())
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  </Provider>
)
