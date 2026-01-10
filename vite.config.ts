import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env files based on mode (.env, .env.local, .env.[mode], etc.)
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get proxy target from environment (if set)
  const apiProxyTarget = env.VITE_API_PROXY_TARGET
  
  // Build proxy config only if we have a target
  const proxyConfig = apiProxyTarget ? {
    '/api': {
      target: apiProxyTarget,
      changeOrigin: true,
      secure: apiProxyTarget.startsWith('https'),
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  } : undefined

  return {
    server: {
      proxy: proxyConfig,
    },
    preview: {
      proxy: proxyConfig,
    },
    plugins: [
      react(),
    ],
  }
})
