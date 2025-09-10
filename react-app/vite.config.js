import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Dùng loadEnv để đọc .env(.local) cho config (Vite chỉ inject vào import.meta.env cho app, không cho vite.config tự động)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const HMR_HOST = env.VITE_HMR_HOST || process.env.VITE_HMR_HOST // ví dụ: desktop-xxxx.ts.net
  const HMR_PORT = Number(env.VITE_HMR_PORT || process.env.VITE_HMR_PORT || 3001)
  const VITE_BASE = env.VITE_BASE || process.env.VITE_BASE || '/'
  const extraHosts = (env.VITE_ALLOWED_HOSTS || process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    // Cho phép toàn bộ domain Tailscale theo mẫu *.ts.net
    /.*\.ts\.net$/,
    HMR_HOST || '',
    ...extraHosts,
  ].filter(Boolean)

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    base: VITE_BASE,
    server: {
      host: true, // lắng nghe 0.0.0.0 để Tailscale có thể truy cập
      port: 3001,
      strictPort: true,
      // Enable HTTPS for PWA features to work across network
      https: env.VITE_ENABLE_HTTPS === 'true' || env.NODE_ENV === 'production',
      // Chỉ nhận chuỗi (không dùng regex) và loại bỏ giá trị rỗng
      allowedHosts,
      hmr: env.VITE_DISABLE_HMR === 'true' 
        ? false // Disable HMR for offline testing
        : HMR_HOST
        ? { host: HMR_HOST, port: HMR_PORT, protocol: 'ws' }
        : undefined,
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




// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     // Ensure SPA fallback for client routes under /manga in dev
//     {
//       name: 'manga-spa-fallback',
//       configureServer(server) {
//         server.middlewares.use((req, _res, next) => {
//           const accept = req.headers?.accept || ''
//           if (
//             req.method === 'GET' &&
//             req.url &&
//             req.url.startsWith('/manga') &&
//             typeof accept === 'string' &&
//             accept.includes('text/html')
//           ) {
//             // Rewrite HTML navigations to root so React Router can handle it
//             req.url = '/'
//           }
//           next()
//         })
//       },
//     },
//     react(),
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   server: {
//     port: 3001,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       // Proxy only static manga assets to backend; client HTML navigations are handled by the plugin above
//       '/manga': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/video': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/audio': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/.thumbnail': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/default': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//     },
//   },
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//   },
// })



// 