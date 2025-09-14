# 🔐 SSL Setup Guide for MainWebSite

## 🎯 Phương án được khuyến nghị: Tailscale Funnel + Self-signed backup

### 📝 Tổng quan
- **Primary**: Tailscale Funnel (tự động SSL, trusted certificates)
- **Backup**: Self-signed certificate (cho dev hoặc khi không dùng Funnel)

---

## 🚀 Phương án 1: Tailscale Funnel (Đơn giản nhất)

### ✅ Ưu điểm
- ✨ **Zero config**: Tailscale tự quản lý SSL certificate
- 🔒 **Trusted certs**: Browser không hiển thị warning
- 🔄 **Auto renewal**: Không cần lo về expiry
- 🛡️ **Built-in security**: Chỉ devices trong tailnet access được

### 📋 Bước thực hiện

#### 1. Cài đặt Tailscale (nếu chưa có)
```powershell
# Download và cài Tailscale từ https://tailscale.com/download/windows
# Hoặc dùng winget
winget install tailscale.tailscale
```

#### 2. Bật Funnel cho device
```powershell
# Bật Funnel để expose HTTPS ra internet
tailscale funnel --bg --https=443 3000

# Hoặc chỉ expose trong tailnet (không ra internet)
tailscale serve --bg --https=443 3000
```

#### 3. Truy cập qua HTTPS
```
https://desktop-v88j9e0.tail2b3d3b.ts.net
```

#### 4. Config app để hoạt động với Funnel
- App vẫn chạy HTTP trên localhost:3000
- Tailscale sẽ handle HTTPS termination
- Không cần thay đổi code gì!

---

## 🔧 Phương án 2: Self-signed Certificate (Backup)

### 📋 Bước thực hiện

#### 1. Tạo self-signed certificate
```powershell
# Tạo private key
openssl genrsa -out ssl/private-key.pem 2048

# Tạo certificate signing request
openssl req -new -key ssl/private-key.pem -out ssl/cert.csr -subj "/CN=desktop-v88j9e0.tail2b3d3b.ts.net"

# Tạo self-signed certificate
openssl x509 -req -in ssl/cert.csr -signkey ssl/private-key.pem -out ssl/certificate.pem -days 365
```

#### 2. Cập nhật backend để support HTTPS
- Update `server.js` để đọc SSL certificates
- Conditionally enable HTTPS based on env vars

---

## 🎯 Kết luận và khuyến nghị

### 💡 Nên dùng Tailscale Funnel vì:
1. **Đơn giản**: Chỉ cần 1 command
2. **Dễ bảo trì**: Tailscale lo mọi thứ
3. **An toàn**: Trusted certificates
4. **Linh hoạt**: Có thể bật/tắt dễ dàng

### 🔄 Workflow thực tế:
1. **Development**: Dùng HTTP localhost
2. **Remote access**: Bật Tailscale Funnel
3. **Production**: Có thể dùng Let's Encrypt hoặc commercial SSL

### ⚠️ Lưu ý:
- Funnel cần Tailscale account có quyền (thường là admin)
- Serve (không phải Funnel) chỉ accessible trong tailnet
- Self-signed cert sẽ có browser warning nhưng vẫn hoạt động

---

## 📚 References
- [Tailscale Funnel Documentation](https://tailscale.com/kb/1223/tailscale-funnel/)
- [Tailscale Serve Documentation](https://tailscale.com/kb/1312/serve/)
