import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3001,
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