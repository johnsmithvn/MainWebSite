# 🚀 Setup HTTPS cho MainWebSite - Hướng dẫn đầy đủ

## 📋 Tổng quan
- **2 server**: `server.js` (HTTP) và `severv2.js` (HTTPS) 
- **SSL certificates**: Tự động tạo bằng script
- **Chỉ cần 3 bước đơn giản**

---

## 🔧 Setup lần đầu (cho người mới)

### Bước 1: Tạo SSL Certificates
```powershell
# Di chuyển vào thư mục dự án
cd "D:\Development\Workspace\Web_Projects\MainWebSite"

# Tạo SSL certificates tự động
cd ssl
node create-ssl.js
```

### Bước 2: Kiểm tra cấu hình `.env`
File `backend/.env` cần có:
```env
PORT=3030
ENABLE_HTTPS=true
```

### Bước 3: Chạy server
```powershell
# HTTP server (port 3000)
cd backend
node server.js

# HTTPS server (port 3030) - KHUYẾN NGHỊ
cd backend  
node severv2.js
```

---

## 🌐 Truy cập ứng dụng

### HTTP (server.js)
- **Local**: `http://localhost:3000`
- **Tailscale**: `http://desktop-v88j9e0.tail2b3d3b.ts.net:3000`

### HTTPS (severv2.js) - CHO OFFLINE FEATURES
- **Local**: `https://localhost:3030`
- **Tailscale**: `https://desktop-v88j9e0.tail2b3d3b.ts.net:3030`

---

## ⚠️ Lưu ý quan trọng

### Khi truy cập HTTPS lần đầu:
1. **Browser sẽ hiện warning** "Your connection is not private"
2. **Click "Advanced"** 
3. **Click "Proceed to [domain] (unsafe)"**
4. **Sau đó HTTPS sẽ hoạt động bình thường**

### Tại sao cần HTTPS?
- ✅ **Service Worker** (offline features)
- ✅ **PWA features**  
- ✅ **Camera/Microphone access**
- ✅ **Geolocation API**
- ✅ **Web Bluetooth/USB**

---

## 🔄 Development workflow

### Development thường ngày:
```powershell
# Chạy HTTP cho dev nhanh
npm run dev:backend

# Hoặc manual
cd backend && node server.js
```

### Test offline features:
```powershell
# Chạy HTTPS cho test PWA/offline
cd backend && node severv2.js
```

### Production:
```powershell
# Build React trước
cd react-app && npm run build

# Chạy HTTPS production  
cd ../backend && node severv2.js
```

---

## 🔐 SSL Files (đã ignore trong git)

Các file sau được tạo tự động và **KHÔNG** commit vào git:
- `ssl/certificate.pfx` - SSL certificate
- `ssl/private-key.pem` - Private key (nếu có)
- `ssl/certificate.pem` - Public cert (nếu có)

**An toàn**: Private keys không bao giờ được commit lên git.

---

## 🛠️ Troubleshooting

### Lỗi "Port already in use":
```powershell
# Kill các Node.js process
Get-Process -Name node | Stop-Process -Force

# Hoặc đổi port
$env:PORT="3031"; node severv2.js
```

### SSL certificate không hoạt động:
```powershell
# Tạo lại certificate
cd ssl
Remove-Item *.pfx -Force
node create-ssl.js
```

### Browser không tin SSL:
- **Bình thường** với self-signed cert
- **Click "Proceed anyway"** là được
- **Hoặc** add certificate vào Trusted Root (nâng cao)

---

## 🎯 Commands tóm tắt

```powershell
# Setup lần đầu
cd ssl && node create-ssl.js

# Chạy HTTP (dev)
cd backend && node server.js

# Chạy HTTPS (offline features)  
cd backend && node severv2.js

# Check server đang chạy
netstat -ano | findstr :3030
```

---

## 🔗 URLs quan trọng

| Server | Protocol | Local | Tailscale |
|--------|----------|-------|-----------|
| `server.js` | HTTP | `http://localhost:3000` | `http://desktop-v88j9e0.tail2b3d3b.ts.net:3000` |
| `severv2.js` | HTTPS | `https://localhost:3030` | `https://desktop-v88j9e0.tail2b3d3b.ts.net:3030` |

**Khuyến nghị**: Dùng HTTPS URL cho đầy đủ tính năng!
