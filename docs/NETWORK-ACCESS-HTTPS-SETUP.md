# Network Access và HTTPS Setup

## Vấn đề: "caches is not defined" khi truy cập từ máy khác

Khi truy cập ứng dụng từ máy khác trong network (không phải localhost), bạn có thể gặp lỗi "caches is not defined". Đây là do Caches API chỉ hoạt động trong Secure Context (HTTPS hoặc localhost).

## Nguyên nhân

- **Caches API** yêu cầu Secure Context để hoạt động
- **Service Worker** cũng yêu cầu HTTPS (trừ localhost)
- Browser block các Web API quan trọng khi truy cập qua HTTP không an toàn

## Giải pháp

### 1. Enable HTTPS cho Development Server

#### Sử dụng environment variable:

```bash
# Tạo file .env.local trong react-app/
echo "VITE_ENABLE_HTTPS=true" > .env.local

# Khởi động server
npm run dev
```

#### Hoặc modify vite.config.js:

```javascript
export default defineConfig({
  server: {
    https: true, // Force enable HTTPS
    host: true,
    port: 3001
  }
})
```

### 2. Sử dụng Self-signed Certificate

```bash
# Tạo self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite.config.js
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
    },
    host: true,
    port: 3001
  }
})
```

### 3. Sử dụng Tunneling Tools

#### ngrok:
```bash
npm install -g ngrok
ngrok http 3001
```

#### localtunnel:
```bash
npm install -g localtunnel
lt --port 3001 --subdomain your-app-name
```

### 4. Network Setup với Tailscale

Nếu đang sử dụng Tailscale, có thể configure HTTPS:

```bash
# Install Tailscale certificate
tailscale cert your-machine.tailscale-network.ts.net

# Update vite.config.js với cert
```

## Fallback Mode

App đã được cập nhật để hoạt động gracefully khi Caches API không có:

- **Hiển thị banner cảnh báo** về browser compatibility
- **Disable offline download features** nhưng vẫn cho phép đọc online
- **Provide clear error messages** với hướng dẫn giải quyết

## Testing Browser Support

Chạy test script trong DevTools Console:

```javascript
// Copy nội dung từ test-browser-support.js và paste vào Console
```

## Browser Compatibility

### ✅ Fully Supported:
- Chrome 40+ trên HTTPS
- Firefox 44+ trên HTTPS  
- Safari 11.1+ trên HTTPS
- Edge 79+ trên HTTPS

### ⚠️ Limited Support:
- Tất cả browsers trên HTTP (không HTTPS)
- Internet Explorer (không hỗ trợ)
- Browsers cũ trước 2018

### ❌ Not Supported:
- Incognito/Private mode (một số tính năng)
- Corporate networks với strict security policies

## Development Workflow

### Local Development:
```bash
# HTTPS không cần thiết
npm run dev
# → http://localhost:3001 ✅
```

### Network Testing:
```bash
# Enable HTTPS cho network access
VITE_ENABLE_HTTPS=true npm run dev
# → https://your-ip:3001 ✅
```

### Production:
```bash
# Luôn enable HTTPS trong production
npm run build
```

## Troubleshooting

### Certificate Warnings:
- Self-signed certificates sẽ hiển thị warning
- Click "Advanced" → "Proceed to localhost (unsafe)" để continue

### Still Getting "caches is not defined":
1. Kiểm tra URL có https:// prefix
2. Kiểm tra browser support (Chrome/Firefox recommended)
3. Try hard refresh (Ctrl+Shift+R)
4. Check DevTools Console cho chi tiết errors

### Performance Issues với HTTPS:
- Self-signed certificates có thể chậm hơn
- Consider sử dụng development proxy như Caddy hoặc nginx

## Security Notes

- Self-signed certificates chỉ dùng cho development
- Production phải sử dụng valid SSL certificate
- Không commit private keys vào git repository

## Alternative Solutions

Nếu không thể setup HTTPS:

1. **Chỉ sử dụng localhost** cho testing offline features
2. **Deploy lên hosting có HTTPS** (Vercel, Netlify, etc.)
3. **Sử dụng browser flags** (không recommended):
   ```bash
   chrome --unsafely-treat-insecure-origin-as-secure=http://your-ip:3001
   ```
