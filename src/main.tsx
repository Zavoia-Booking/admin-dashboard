import { createRoot } from 'react-dom/client'
import './shared/styles/globals.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './app/providers/store.ts'
import { Toaster } from './shared/components/ui/sonner.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './shared/lib/i18n'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  </Provider>
)
