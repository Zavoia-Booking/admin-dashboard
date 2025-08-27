import { createRoot } from 'react-dom/client'
import './shared/styles/globals.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './app/providers/store.ts'
import { Toaster } from './shared/components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
    <Toaster position="top-right" />
  </Provider>
)
