# MainWebSite Monorepo

Ứng dụng gồm **backend** (Express) và **React app** (Vite) được quản lý bằng [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces).

## 📋 Cài đặt

```bash
npm install
```

Lệnh trên sẽ cài đặt phụ thuộc cho cả hai workspace.

## 🚀 Development Mode

```bash
npm run dev
```

- **Backend**: `http://localhost:3000`
- **React app**: `http://localhost:3001`
- **Frontend cũ**: `http://localhost:3000`
- React tự động proxy các request `/api` tới backend
- Code changes được hot-reload tự động

## 🏗️ Production Mode

```bash
npm run prod
```

- Build React app thành static files
- Serve từ backend port 3000 duy nhất
- Tối ưu performance và caching

## ⚠️ QUAN TRỌNG: Tailscale Setup

### 🔍 Kiểm tra Tailscale

```bash
# Kiểm tra trạng thái
tailscale status

# Nếu thấy "Tailscale is stopped" thì chạy:
tailscale up
```

### 🚨 Cảnh báo

- **Domain `.ts.net` chỉ hoạt động khi Tailscale đang chạy**
- Nếu gặp lỗi `DNS_PROBE_FINISHED_NXDOMAIN`: chạy `tailscale up`
- Sau khi start Tailscale, restart server để áp dụng


## 🔐 SSL Certificates Setup

### Lần đầu chạy

1. **Tạo SSL certificates cho Tailscale domain**:

```bash
# Cài đặt mkcert (nếu chưa có)
mkcert -install

# Tạo certificate cho domain Tailscale của bạn
mkcert TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net
```

2. **Di chuyển certificates vào ssl folder**:

```bash
# Tạo thư mục ssl nếu chưa có
mkdir ssl

# Di chuyển files
move TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net.pem ssl/certificate.pem
move TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net-key.pem ssl/private-key.pem
```

### 🔧 Troubleshooting SSL

**Nếu browser báo "This site can't be reached":**

1. **Kiểm tra Tailscale**:
   ```bash
   tailscale status
   # Nếu stopped: tailscale up
   ```

2. **Kiểm tra certificates**:
   ```bash
   # Xem có certificates không
   dir ssl
   
   # Nếu thiếu, tạo lại:
   mkcert TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net
   move *.pem ssl/
   ```

3. **Restart server** sau khi fix certificates

**Nếu browser báo "Your connection is not private":**
- Đây là warning bình thường với self-signed certificates
- Nhấn **"Advanced"** → **"Proceed to [domain] (unsafe)"**
- Hoặc nhập `thisisunsafe` trực tiếp trong browser

## 📖 Hướng dẫn sử dụng

### Development (Hot reload)

```bash
npm run dev
```

- Code changes tự động cập nhật
- Backend: `http://localhost:3000`
- React app: `http://localhost:3001`

### Production (Optimized)

```bash
npm run prod
```

- Build React app thành static files optimized
- Serve từ backend port 3000 duy nhất
- Truy cập được qua:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
  - `https://TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net:3000` (cần Tailscale)

## 🛠️ Environment Configuration

File `.env` trong `backend/` và `react-app/` đã được config sẵn cho:
- Local development
- Tailscale network access
- Production deployment

Không cần sửa gì trừ khi thay đổi domain hoặc ports.


