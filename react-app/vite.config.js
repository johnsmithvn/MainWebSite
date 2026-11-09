import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Create Vite proxy configuration for backend API
 * @param {string} target - Backend API target URL
 * @returns {object} Proxy configuration object
 */
function createProxyConfig(target) {
  // Base proxy configuration for simple endpoints
  const baseConfig = { target, changeOrigin: true }
  
  // Special configuration for /manga endpoint with HTML bypass
  const mangaConfig = {
    ...baseConfig,
    bypass(req) {
      const accept = req.headers?.accept || ''
      // Redirect HTML requests to SPA for client-side routing
      if (req.method === 'GET' && accept.includes('text/html')) return '/'
      return null
    },
  }

  return {
    '/api': baseConfig,
    '/manga': mangaConfig,
    '/video': baseConfig,
    '/audio': baseConfig,
    '/media': baseConfig,
    '/.thumbnail': baseConfig,
    '/default': baseConfig,
  }
}

// Dùng loadEnv để đọc .env cho config (Vite chỉ inject vào import.meta.env cho app, không cho vite.config tự động)
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const HMR_HOST = env.VITE_HMR_HOST || process.env.VITE_HMR_HOST // ví dụ: desktop-xxxx.ts.net
  const HMR_PORT = Number(env.VITE_HMR_PORT || process.env.VITE_HMR_PORT || 3001)
  const VITE_BASE = env.VITE_BASE || process.env.VITE_BASE || '/'
  
  // Backend API target for proxy (configurable via env)
  const API_TARGET = 'http://localhost:3000'
  
  const extraHosts = (env.VITE_ALLOWED_HOSTS || process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // Cấu hình allowedHosts để cho phép truy cập từ Tailscale và các host bổ sung trong env
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    // Cho phép toàn bộ domain Tailscale (*.ts.net): Vite chỉ so khớp chuỗi, dấu "." ở đầu = mọi subdomain
    '.ts.net',
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
        ? false // Disable HMR completely when disabled
        : HMR_HOST
        ? { host: HMR_HOST, port: HMR_PORT, protocol: 'ws' }
        : true, // Enable HMR with default settings
      proxy: createProxyConfig(API_TARGET),
    },
    // Bản build bỏ console.log/debug/info (giữ warn/error): có ~300 lời gọi, nhiều cái nằm ở đường
    // nóng (mỗi ảnh, mỗi request) — PERFORMANCE-CACHE-REPORT PF18. Dev vẫn giữ log như cũ.
    esbuild: command === 'build'
      ? { pure: ['console.log', 'console.debug', 'console.info'], drop: ['debugger'] }
      : undefined,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // Thư viện ít đổi tách riêng để lần deploy sau trình duyệt vẫn dùng lại cache (PF4).
          // Các thư viện khác để Rollup tự chia theo trang dùng chúng.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) {
              return 'vendor-react';
            }
            if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) return 'vendor-motion';
            return undefined;
          },
        },
      },
    },
  }
})

