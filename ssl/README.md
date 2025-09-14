# 🔐 Quick SSL Setup Commands

## Phương án 1: Tailscale Serve (Khuyến nghị)

### ⚠️ Nếu gặp lỗi "serve is not enabled"

```powershell
# Mở link này để enable Tailscale Serve:
# https://login.tailscale.com/f/serve?node=njuJdm53rt11CNTRL
# Hoặc vào Tailscale Admin Console > Settings > Features > Enable "Tailscale Serve"
```

### 🚀 Sau khi enable thành công:

```powershell
# Bật HTTPS serve cho app (chỉ trong Tailscale network)
tailscale serve --bg --https=443 3000

# Kiểm tra status
tailscale serve status

# Truy cập app qua HTTPS
# https://desktop-v88j9e0.tail2b3d3b.ts.net
```

### 🔄 Phương án backup (nếu không enable được):

```powershell
# Chỉ dùng HTTP qua Tailscale (không cần enable Serve)
# App vẫn accessible qua: http://desktop-v88j9e0.tail2b3d3b.ts.net:3000
```

## Phương án 2: Chạy Script tự động

```powershell
# Di chuyển đến thư mục dự án
cd "D:\Development\Workspace\Web_Projects\MainWebSite"

# Chạy script setup SSL (Tailscale)
.\scripts\setup-ssl.ps1 -Method tailscale

# Hoặc tạo self-signed certificate
.\scripts\setup-ssl.ps1 -Method self-signed

# Hoặc cả hai
.\scripts\setup-ssl.ps1 -Method both
```

## Phương án 3: Manual Self-signed Certificate

```powershell
# Tạo thư mục SSL
mkdir ssl

# Tạo private key
openssl genrsa -out ssl/private-key.pem 2048

# Tạo certificate
openssl req -new -x509 -key ssl/private-key.pem -out ssl/certificate.pem -days 365 -subj "/CN=desktop-v88j9e0.tail2b3d3b.ts.net"
```

## Sau khi setup SSL

```powershell
# Update .env để bật HTTPS
# ENABLE_HTTPS=true

# Restart server để áp dụng SSL
npm run dev
# hoặc
npm run prod
```

## Lệnh hữu ích

```powershell
# Kiểm tra Tailscale status
tailscale status

# Tắt Tailscale serve
tailscale serve --https=443 off

# Kiểm tra certificate info
openssl x509 -in ssl/certificate.pem -text -noout
```
