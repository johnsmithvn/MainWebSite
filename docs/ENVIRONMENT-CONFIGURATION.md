# 🔧 Environment Configuration Guide

## 📋 Tổng quan

Dự án MainWebSite sử dụng **environment variables** để cấu hình cho cả backend (Node.js Express) và frontend (React + Vite). Tài liệu này hướng dẫn chi tiết cách setup và sử dụng các biến môi trường.

## 📁 Cấu trúc Files Environment

```
MainWebSite/
├── backend/
│   ├── .env                     # ❌ Gitignored - Config thực tế
│   ├── .env.template           # ✅ Template cho setup
│   └── server.js               # Sử dụng process.env.*
├── react-app/
│   ├── .env                    # ❌ Gitignored - Config production
│   ├── .env.development        # ❌ Gitignored - Config development  
│   ├── .env.template          # ✅ Template cho setup
│   ├── vite.config.js         # Sử dụng loadEnv()
│   └── src/main.jsx           # Sử dụng import.meta.env.*
└── .gitignore                 # Ignore .env và .env.local
```

## 🚀 Setup Khi Clone Project

### 1. Backend Setup

```bash
# Copy template và edit
cd backend/
cp .env.template .env
nano .env  # hoặc dùng editor khác
```

### 2. React App Setup

```bash
# Copy templates và edit
cd react-app/
cp .env.template .env
cp .env.template .env.development  # Nếu cần config riêng cho dev

# Edit các file
nano .env
nano .env.development
```

### 3. SSL Certificates (Tùy chọn)

```bash
# Tạo SSL certificates cho HTTPS development
cd ssl/
mkcert -install
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 your-tailscale-domain.ts.net
```

---

## 🔧 Backend Environment Variables

### 📍 File: `backend/.env`

#### **Server Configuration**

| Variable | Mô tả | File sử dụng | Default | Ví dụ |
|----------|-------|--------------|---------|-------|
| `PORT` | Port backend server | `server.js:18` | `3000` | `3000` |
| `NODE_ENV` | Môi trường chạy | `server.js:19` | `development` | `production` |

**Code sử dụng:**
```javascript
// backend/server.js:18-19
const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== 'production';
```

#### **Media Root Paths** 

| Variable | Mô tả | File sử dụng | Ví dụ |
|----------|-------|--------------|-------|
| `ROOT_*` | Đường dẫn manga folders | `utils/config.js:20-26` | `ROOT_FANTASY=E:\File\Manga` |
| `V_*` | Đường dẫn video folders | `utils/config.js:48` | `V_MOVIE=E:\File\Videos` |
| `M_*` | Đường dẫn music folders | `utils/config.js:55` | `M_MUSIC=E:\DATA\music` |

**Code sử dụng:**
```javascript
// backend/utils/config.js:20-26
Object.keys(parsedEnv).forEach((key) => {
  if (
    (key.startsWith("ROOT_") || key.startsWith("V_") || key.startsWith("M_")) &&
    value.trim()
  ) {
    ROOT_PATHS[key] = value;
  }
});
```

### Development Tools

| Variable | Mô tả | File sử dụng | Default | Impact |
|----------|-------|--------------|---------|--------|
| `nodemon` | Auto-restart trên dev | `package.json scripts` | Local package | Chạy với `npx nodemon` |
| `cross-env` | Cross-platform ENV setting | `package.json scripts` | Local package | Set NODE_ENV properly |

**Package.json scripts:**
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development npx nodemon server.js",
    "prod": "cross-env NODE_ENV=production node server.js",
    "start": "node server.js"
  }
}
```

**⚠️ Impact khi thay đổi:**
- Thay đổi paths sẽ require re-scan database
- Sai path sẽ gây lỗi "folder not found"
- Backend sẽ tự động filter các path không tồn tại

#### **Security & Access Control**

| Variable | Mô tả | File sử dụng | Ví dụ |
|----------|-------|--------------|-------|
| `SECURITY` | Keys cần password | `utils/config.js:13` | `ROOT_MANGAH,V_JAVA` |
| `SECURITY_PASSWORD` | Password cho protected keys | `utils/config.js:17` | `123456` |
| `ALLOWED_IPS` | IPs được phép truy cập | `middleware/auth.js` | `192.1.,......` |
| `ALLOWED_HOSTNAMES` | Hostnames được phép | `middleware/auth.js` | `desktop-v88j9e0` |

**Code sử dụng:**
```javascript
// backend/utils/config.js:13-17
const SECURITY_KEYS = (parsedEnv.SECURITY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SECURITY_PASSWORD = parsedEnv.SECURITY_PASSWORD || "";
```

#### **CORS Configuration**

| Variable | Mô tả | File sử dụng | Default |
|----------|-------|--------------|---------|
| `CORS_EXTRA_ORIGINS` | Extra CORS origins | `middleware/cors.js` | `http://localhost:3001` |

**Code sử dụng:**
```javascript
// backend/middleware/cors.js
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
```

---

## 🎨 React App Environment Variables

### 📍 Files: `react-app/.env*`

#### **Vite Development Server**

| Variable | Mô tả | File sử dụng | Default | Ví dụ |
|----------|-------|--------------|---------|-------|
| `VITE_HMR_HOST` | Hot Module Reload host | `vite.config.js:9` | `localhost` | `desktop-xxx.ts.net` |
| `VITE_HMR_PORT` | HMR port | `vite.config.js:10` | `3001` | `3001` |
| `VITE_ALLOWED_HOSTS` | Allowed hosts for dev server | `vite.config.js:12` | `localhost` | `desktop-xxx.ts.net` |
| `VITE_DISABLE_HMR` | Disable HMR completely | `vite.config.js:38` | `false` | `true` |

**Code sử dụng:**
```javascript
// react-app/vite.config.js:9-12
const HMR_HOST = env.VITE_HMR_HOST || process.env.VITE_HMR_HOST
const HMR_PORT = Number(env.VITE_HMR_PORT || process.env.VITE_HMR_PORT || 3001)
const extraHosts = (env.VITE_ALLOWED_HOSTS || process.env.VITE_ALLOWED_HOSTS || '')
```

#### **HTTPS Configuration**

| Variable | Mô tả | File sử dụng | Default | Impact |
|----------|-------|--------------|---------|--------|
| `VITE_ENABLE_HTTPS` | Enable HTTPS for dev server | `vite.config.js:35` | `false` | Bật SSL certificates |

**Code sử dụng:**
```javascript
// react-app/vite.config.js:35
https: env.VITE_ENABLE_HTTPS === 'true' || env.NODE_ENV === 'production',
```

#### **Service Worker Control**

| Variable | Mô tả | File sử dụng | Default | Impact |
|----------|-------|--------------|---------|--------|
| `VITE_DISABLE_SW` | Force disable Service Worker | `main.jsx:50` | `false` | Tắt PWA features |
| `VITE_ENABLE_SW_IN_DEV` | Enable SW in development | `main.jsx:51` | `false` | PWA testing |

**Code sử dụng:**
```javascript
// react-app/src/main.jsx:49-52
const isDevelopment = import.meta.env.MODE === 'development';
const disableSW = import.meta.env.VITE_DISABLE_SW === 'true';

if ('serviceWorker' in navigator && !disableSW) {
```

#### **App Configuration**

| Variable | Mô tả | File sử dụng | Default | Ví dụ |
|----------|-------|--------------|---------|-------|
| `VITE_BASE` | Base URL path | `vite.config.js:11,29` | `/` | `/app` |
| `VITE_DISABLE_STRICT_MODE` | Disable React StrictMode | `main.jsx:28` | `false` | `true` |
| `VITE_MIN_STORAGE_SPACE` | Min storage for PWA | `utils/storageQuota.js:34` | `500MB` | `1024000000` |

**Code sử dụng:**
```javascript
// react-app/src/main.jsx:28
const disableStrict = import.meta.env.VITE_DISABLE_STRICT_MODE === 'true';

// react-app/src/utils/storageQuota.js:34
const envOverride = import.meta.env.VITE_MIN_STORAGE_SPACE;
```

#### **Production API URL**

| Variable | Mô tả | File sử dụng | Default | Ví dụ |
|----------|-------|--------------|---------|-------|
| `VITE_API_BASE_URL` | Production API endpoint | Chưa implement | `undefined` | `https://domain.ts.net` |

---

## 🔄 Environment Modes

### Development Mode (.env.development)

```bash
# HTTPS cho development (fix SSL với Tailscale)
VITE_ENABLE_HTTPS=true

# Service Worker disabled để tránh cache conflicts
VITE_DISABLE_SW=true
VITE_ENABLE_SW_IN_DEV=false

# HMR configuration cho Tailscale
VITE_HMR_HOST=desktop-v88j9e0.tail2b3d3b.ts.net
VITE_HMR_PORT=3001
VITE_ALLOWED_HOSTS=desktop-v88j9e0.tail2b3d3b.ts.net
VITE_DISABLE_HMR=false
```

### Production Mode (.env)

```bash
# Tailscale domain config
VITE_HMR_HOST=desktop-v88j9e0.tail2b3d3b.ts.net
VITE_HMR_PORT=3001
VITE_ALLOWED_HOSTS=desktop-v88j9e0.tail2b3d3b.ts.net

# HMR disabled cho production
VITE_DISABLE_HMR=true

# Production settings (uncomment khi deploy)
# VITE_API_BASE_URL=https://desktop-v88j9e0.tail2b3d3b.ts.net
# VITE_ENABLE_HTTPS=true
# VITE_MIN_STORAGE_SPACE=524288000
```

---

## ⚠️ Important Notes

### 1. File Security
- **KHÔNG commit** `.env` files (đã có trong .gitignore)
- Chỉ commit `.env.template` files
- `.env.local` cũng bị gitignore cho personal overrides

### 2. Variable Naming
- Backend: dùng `process.env.VARIABLE_NAME`
- React: dùng `import.meta.env.VITE_VARIABLE_NAME` 
- **PHẢI có prefix `VITE_`** cho React variables

### 3. Development vs Production
- Vite tự động load `.env.development` trong dev mode
- Production load `.env` file
- Variables trong `.env.local` sẽ override tất cả

### 4. SSL Certificates
- Cần có `ssl/cert.pem` và `ssl/key.pem` cho HTTPS
- Backend tự động detect và bật HTTPS nếu có certificates
- Frontend proxy cần match backend protocol (HTTP/HTTPS)

### 5. Restart Required
- **Backend**: Restart khi thay đổi `process.env.*`
- **Frontend**: Restart Vite dev server khi thay đổi `VITE_*`
- Chỉ vài env vars có thể hot reload

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. "CORS blocked origin"
```bash
# Thêm vào backend/.env
CORS_EXTRA_ORIGINS=http://localhost:3001,http://your-domain.ts.net:3001
```

#### 2. "SSL certificate error" 
```bash
# Tạo lại certificates
cd ssl/
mkcert localhost 127.0.0.1 your-tailscale-domain.ts.net -key-file key.pem -cert-file cert.pem
```

#### 3. "Service Worker registration failed"
```bash
# Disable trong development
# react-app/.env.development
VITE_DISABLE_SW=true
```

#### 4. "HMR not working over Tailscale"
```bash
# Enable proper HMR config
VITE_HMR_HOST=your-domain.ts.net
VITE_HMR_PORT=3001
VITE_DISABLE_HMR=false
```

#### 5. "Path not found" cho media folders
```bash
# Kiểm tra đường dẫn trong backend/.env
ROOT_FANTASY=E:\File\Manga     # ✅ Đúng
ROOT_FANTASY=E:\File\Manga\    # ❌ Không nên có trailing slash
```

---

## 📝 Quick Setup Checklist

### Khi clone project mới:

- [ ] Copy `backend/.env.template` → `backend/.env`
- [ ] Copy `react-app/.env.template` → `react-app/.env` 
- [ ] Copy `react-app/.env.template` → `react-app/.env.development`
- [ ] Edit media paths trong `backend/.env`
- [ ] Edit Tailscale domain trong `react-app/.env*`
- [ ] Tạo SSL certificates nếu cần HTTPS
- [ ] Test `npm run dev` và kiểm tra console errors

### Variables cần thiết tối thiểu:

**Backend:**
```bash
PORT=3000
NODE_ENV=development
ROOT_FANTASY=E:\File\Manga    # Ít nhất 1 root path
```

**React App:**
```bash
VITE_HMR_HOST=localhost
VITE_HMR_PORT=3001
```

---

*Cập nhật: September 13, 2025*
*Version: 5.0.4*
