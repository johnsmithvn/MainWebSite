import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Cấu hình Vite để disable HMR - dùng cho production-like testing
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const HMR_HOST = env.VITE_HMR_HOST || process.env.VITE_HMR_HOST
  const HMR_PORT = Number(env.VITE_HMR_PORT || process.env.VITE_HMR_PORT || 3001)
  const VITE_BASE = env.VITE_BASE || process.env.VITE_BASE || '/'
  const extraHosts = (env.VITE_ALLOWED_HOSTS || process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    /.*\.ts\.net$/,
    HMR_HOST || '',
    ...extraHosts,
  ].filter(Boolean)

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    base: VITE_BASE,
    server: {
      host: true,
      port: 3001,
      strictPort: true,
      allowedHosts,
      // DISABLE HMR hoàn toàn để ngừng ping requests
      hmr: false,
      watch: {
        usePolling: false,
        interval: 2000,
      },
      proxy: {
        '/api': { target: 'http://localhost:3000', changeOrigin: true },
        '/manga': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          bypass(req) {
            const accept = req.headers?.accept || ''
            if (req.method === 'GET' && accept.includes('text/html')) return '/'
            return null
          },
        },
        '/video': { target: 'http://localhost:3000', changeOrigin: true },
        '/audio': { target: 'http://localhost:3000', changeOrigin: true },
        '/.thumbnail': { target: 'http://localhost:3000', changeOrigin: true },
        '/default': { target: 'http://localhost:3000', changeOrigin: true },
      },
    },
    build: { outDir: 'dist', assetsDir: 'assets' },
  }
})
