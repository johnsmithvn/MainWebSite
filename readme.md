# MainWebSite

Media server cá nhân: đọc **manga**, xem **phim**, nghe **nhạc** và quản lý **thư viện ảnh/video** ngay từ ổ đĩa của máy chủ, truy cập qua LAN hoặc Tailscale. Giao diện React (PWA) hỗ trợ đọc manga offline.

| Thư mục | Vai trò |
|---------|---------|
| `backend/` | Express 5 + SQLite (`better-sqlite3`): API, quét thư mục, stream video/nhạc |
| `react-app/` | React 18 + Vite 4 (PWA): giao diện chính |
| `frontend/` | Giao diện cũ (vanilla JS) — **legacy**, chỉ còn xuất hiện ở `http://localhost:3000` khi chạy dev |

📚 Tài liệu khác: [Mục lục docs](docs/README.md) · [Báo cáo hệ thống](docs/SYSTEM-REPORT.md) · [Danh sách issue](docs/ISSUES-REPORT.md)

---

## Mục lục

1. [Yêu cầu](#1-yêu-cầu)
2. [Cài đặt nhanh](#2-cài-đặt-nhanh)
3. [Cấu hình](#3-cấu-hình)
4. [Chạy ứng dụng](#4-chạy-ứng-dụng)
5. [Lần đầu sử dụng: quét dữ liệu](#5-lần-đầu-sử-dụng-quét-dữ-liệu)
6. [Truy cập từ xa qua Tailscale + HTTPS](#6-truy-cập-từ-xa-qua-tailscale--https)
7. [Xử lý sự cố](#7-xử-lý-sự-cố)

---

## 1. Yêu cầu

| Thành phần | Phiên bản / ghi chú |
|------------|---------------------|
| **Node.js** | **20** hoặc **≥ 22** (Node 18 và 21 không chạy được: `lru-cache@11`, `glob@11`, `cross-env@10` yêu cầu `20 \|\| >=22`) |
| npm | ≥ 8 (đi kèm Node) |
| ffmpeg | *Tuỳ chọn* — cần có trong `PATH` để tạo thumbnail cho phim. `ffprobe` đã có sẵn qua gói `ffprobe-static` |
| Công cụ build C++ | *Chỉ khi* `npm install` báo lỗi `better-sqlite3` (không có bản build sẵn cho phiên bản Node của bạn): Visual Studio Build Tools trên Windows, `build-essential` + `python3` trên Linux |
| Tailscale, mkcert | *Tuỳ chọn* — truy cập từ xa qua HTTPS ([mục 6](#6-truy-cập-từ-xa-qua-tailscale--https)) |

---

## 2. Cài đặt nhanh

**Bước 1 — Tải code và cài thư viện** (một lệnh cài cho cả `backend` và `react-app`):

```bash
git clone https://github.com/johnsmithvn/MainWebSite.git
cd MainWebSite
npm install
```

**Bước 2 — Tạo file cấu hình** từ template (file `.env` không có trong repo):

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.template backend\.env
Copy-Item react-app\.env.template react-app\.env
```

```bash
# Linux / macOS / Git Bash
cp backend/.env.template backend/.env
cp react-app/.env.template react-app/.env
```

> ⚠️ Thiếu `backend/.env` thì backend **crash ngay khi khởi động**.

**Bước 3 — Khai báo thư mục media** trong `backend/.env` (sửa đường dẫn cho đúng máy của bạn):

```env
ROOT_MANGA=E:/File/Manga
V_MOVIE=E:/File/Video
M_MUSIC=E:/File/Music
MEDIA_PHOTOS=E:/File/Photos
```

**Bước 4 — Chạy**:

```bash
npm run dev
```

**Bước 5 — Mở** `http://localhost:3001`, chọn một nguồn và **quét dữ liệu** lần đầu ([mục 5](#5-lần-đầu-sử-dụng-quét-dữ-liệu)).

---

## 3. Cấu hình

Sửa `.env` xong phải **khởi động lại server** thì mới có hiệu lực.

### 3.1. `backend/.env`

**Server**

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `PORT` | `3000` | Cổng của backend. Đổi cổng thì phải sửa cả `API_TARGET` trong `react-app/vite.config.js` (đang cố định `http://localhost:3000`) |
| `ENABLE_HTTPS` | `false` | `true` = chạy HTTPS bằng chứng chỉ trong `ssl/` ([mục 6.2](#62-tạo-chứng-chỉ-https)). Bật mà thiếu chứng chỉ thì server tự chạy HTTP và in hướng dẫn ra console |

**Nguồn media** — mỗi dòng là một *source key*, tiền tố quyết định loại nội dung:

| Tiền tố | Loại | Ví dụ |
|---------|------|-------|
| `ROOT_` | Manga — mỗi thư mục con trực tiếp là một "root" để chọn | `ROOT_MANGA=E:/File/Manga` |
| `V_` | Phim | `V_ANIME=D:/Anime` |
| `M_` | Nhạc | `M_MUSIC=E:/File/Music` |
| `MEDIA_` | Thư viện ảnh/video (media gallery) | `MEDIA_PHOTOS=E:/File/Photos` |

- Phần sau tiền tố đặt tuỳ ý; khai báo bao nhiêu nguồn cũng được.
- Key **chỉ được nạp nếu thư mục tồn tại** lúc server khởi động.
- Mỗi key có một database riêng: `backend/data/<KEY>.db`. Database chạy ở chế độ WAL nên khi server đang chạy, bên cạnh mỗi file còn có `<KEY>.db-wal` và `<KEY>.db-shm`. Tắt server bằng Ctrl+C thì hai file này được gộp vào `.db` rồi tự xoá. **Muốn sao lưu hoặc copy DB sang máy khác: tắt server trước**, hoặc copy đủ cả 3 file.

**Ai được truy cập** — lớp chặn theo IP, áp dụng cho mọi request:

| Biến | Ý nghĩa |
|------|---------|
| `ALLOWED_IPS` | IP được phép. **Bắt buộc giữ `127.0.0.1`** (chính máy chủ và Vite dev proxy). Thêm IP LAN của từng thiết bị khác |
| `ALLOWED_HOSTNAMES` | Với IP không có trong danh sách trên, server tra ngược DNS (Tailscale MagicDNS) và so **khớp chính xác** tên nhận được với danh sách này |

> 💡 Không biết điền hostname gì? Truy cập thử từ thiết bị đó, console server sẽ in `❌ Truy cập bị chặn từ hostname: <tên>` — copy đúng `<tên>` vào `ALLOWED_HOSTNAMES`.

**Mật khẩu cho nguồn riêng tư**

| Biến | Ý nghĩa |
|------|---------|
| `SECURITY` | Danh sách key phải đăng nhập mới xem được, cách nhau bằng dấu phẩy (để trống = tất cả công khai) |
| `SECURITY_PASSWORD` | Mật khẩu đăng nhập |

Cách hoạt động sau khi đăng nhập:

- Server trả về một **token** (không phải mật khẩu) và đặt cookie `ms_auth` để ảnh, video, nhạc tĩnh của nguồn riêng tư tải được. Token được tính từ mật khẩu và file bí mật `backend/data/.auth-secret` (tự tạo lần đầu, không commit), nên vẫn hợp lệ sau khi khởi động lại server.
- Đổi `SECURITY_PASSWORD` hoặc xoá `backend/data/.auth-secret` thì mọi thiết bị phải đăng nhập lại.
- Nhập sai mật khẩu 10 lần trong 15 phút từ cùng một IP sẽ bị khoá đăng nhập 15 phút. Ở chế độ dev, mọi request đi qua Vite nên dùng chung IP `127.0.0.1`.

**CORS và Tailscale**

| Biến | Ý nghĩa |
|------|---------|
| `CORS_DEV_CONFIG` | Các địa chỉ trang web **khác** được gọi API. Định dạng `host:cổng1,cổng2\|giao_thức1,giao_thức2`, nhiều host cách nhau bằng `;`. Thường không cần sửa: domain `*.ts.net` và chính địa chỉ IP đang mở app luôn được chấp nhận (ở dev mode: mọi IP nội bộ) |
| `TAILSCALE_DEVICE`, `TAILSCALE_TAILNET` | Domain máy chủ là `<DEVICE>.<TAILNET>.ts.net` — dùng để in URL lúc khởi động và tạo danh sách CORS |
| `TAILSCALE_PORTS`, `TAILSCALE_PROTOCOLS` | Cổng và giao thức dùng khi tạo danh sách CORS cho domain Tailscale |

### 3.2. `react-app/.env`

Mọi biến đều **tuỳ chọn**. File này chỉ ảnh hưởng tới Vite dev server và bước build; bản production do backend phục vụ.

| Biến | Ý nghĩa |
|------|---------|
| `VITE_BASE` | Đường dẫn gốc của app (mặc định `/`) |
| `VITE_MIN_STORAGE_SPACE` | Dung lượng trống tối thiểu (**MB**) phải còn lại sau khi tải chapter offline. Mặc định 50 (máy tính) / 25 (điện thoại) |
| `VITE_ALLOWED_HOSTS` | Domain **khác** được phép mở dev server, cách nhau bằng dấu phẩy. `localhost`, **mọi địa chỉ IP** và mọi domain `*.ts.net` luôn được phép, nên thường không cần đặt |
| `VITE_HMR_HOST`, `VITE_HMR_PORT` | Host/cổng cho hot reload khi mở dev server qua domain Tailscale (host này cũng được tự thêm vào danh sách được phép) |
| `VITE_ENABLE_HTTPS` | Dev server chạy HTTPS — ⚠️ chưa có cấu hình chứng chỉ cho Vite nên bật lên có thể không vào được ([ISSUES C4](docs/ISSUES-REPORT.md)) |
| `VITE_DISABLE_HMR`, `VITE_DISABLE_STRICT_MODE` | Công cụ debug |

> ⚠️ **Không đặt `NODE_ENV` trong `react-app/.env`.** Vite dùng giá trị này cả khi build: `NODE_ENV=development` làm `vite build` ra bản *development* (nặng, chậm hơn).

### 3.3. Cho thiết bị khác truy cập (điện thoại, laptop…)

| Truy cập bằng | Cần làm |
|---------------|---------|
| IP LAN, VD `http://192.168.1.10:3000` | Thêm **IP của thiết bị** (điện thoại, laptop…) vào `ALLOWED_IPS` |
| Domain Tailscale `https://<DEVICE>.<TAILNET>.ts.net:3000` | Thêm hostname của thiết bị vào `ALLOWED_HOSTNAMES` (hoặc IP Tailscale `100.x.y.z` của thiết bị vào `ALLOWED_IPS`) |

CORS và Vite không cần sửa cho hai cách trên. Chỉ khi mở app bằng một **domain khác** (không phải IP, không phải `*.ts.net`) mới phải thêm domain đó vào `CORS_DEV_CONFIG` và, nếu dùng dev server, `VITE_ALLOWED_HOSTS`.

---

## 4. Chạy ứng dụng

### Development

```bash
npm run dev
```

Chạy song song hai server:

| Địa chỉ | Là gì |
|---------|-------|
| `http://localhost:3001` | **React app** (Vite, hot reload) — dùng địa chỉ này. Tự proxy `/api`, `/manga`, `/video`, `/audio`, `/media`, `/.thumbnail`, `/default` sang backend |
| `http://localhost:3000` | Backend. Mở trực tiếp ở dev mode sẽ thấy **giao diện legacy** (cần build trước bằng `npm run dev:frontendv1`) |

### Production

Build React app vào `react-app/dist` rồi chạy backend ở chế độ production — toàn bộ app phục vụ từ **một cổng 3000**:

```bash
npm run prod
```

Sau đó mở `http://localhost:3000` (hoặc `https://<DEVICE>.<TAILNET>.ts.net:3000` nếu đã bật HTTPS).

> Không dùng `npm start` cho production: lệnh này không đặt `NODE_ENV=production`.

### Scripts ở thư mục gốc

| Script | Tác dụng |
|--------|----------|
| `npm run dev` | Chạy backend (nodemon, cổng 3000) + React dev server (cổng 3001) |
| `npm run build` | Build React app vào `react-app/dist` |
| `npm run prod` / `npm run deploy` | Build + chạy backend production |
| `npm run start` | Chạy backend bằng `node server.js` (không đặt `NODE_ENV`) |
| `npm run preview` | Xem thử bản build bằng Vite (`preview:prod`: build rồi xem ở cổng 3002) |
| `npm run check` | Kiểm tra đã có `react-app/dist` chưa (chỉ Windows) |
| `npm run dev:frontendv1` | Build giao diện legacy (esbuild) |
| `npm run lint` | ⚠️ Chưa chạy được — repo chưa có file cấu hình ESLint |

---

## 5. Lần đầu sử dụng: quét dữ liệu

Danh sách manga, phim, nhạc và media đều đọc từ database, nên **mỗi nguồn phải quét ít nhất một lần** (và quét lại khi thêm file mới). Nút quét nằm ở **Sidebar**, hiện ra sau khi đã chọn nguồn:

| Loại | Thao tác ở Sidebar | Ghi chú |
|------|--------------------|---------|
| Manga | Chọn nguồn → chọn root → **Quét Manga** | Quét toàn bộ root đang chọn, giữ yêu thích và lượt xem. *Reset DB Manga* xoá dữ liệu cũ của root rồi quét lại: mất đánh dấu yêu thích, lượt xem vẫn giữ |
| Phim | **Quét Movie** → **Quét thumbnail Movie** | Tạo thumbnail phim cần `ffmpeg` |
| Nhạc | **Quét Music** → **Quét thumbnail Music** | Thumbnail lấy từ ảnh bìa nhúng trong file nhạc |
| Media | **Quét Media** (mục *Công cụ 📸 Media*) | Thumbnail đọc từ thư mục `.thumbnail` cạnh file, nếu có |

Với phim, nhạc và media, hộp thoại quét cho phép nhập **đường dẫn con** để chỉ quét một thư mục. Bật thêm **shallow** để chỉ quét các mục nằm ngay trong thư mục đó, không đi sâu vào thư mục con. Manga chỉ quét được toàn bộ root nên hộp thoại không có hai tuỳ chọn này.

---

## 6. Truy cập từ xa qua Tailscale + HTTPS

### 6.1. Bật Tailscale

```bash
tailscale status    # kiểm tra trạng thái
tailscale up        # nếu thấy "Tailscale is stopped"
```

Domain `*.ts.net` chỉ phân giải được khi Tailscale đang chạy (lỗi `DNS_PROBE_FINISHED_NXDOMAIN` nghĩa là Tailscale đang tắt).

### 6.2. Tạo chứng chỉ HTTPS

Server đọc **`ssl/certificate.pem`** và **`ssl/private-key.pem`** ở **thư mục gốc repo**. Tạo bằng [mkcert](https://github.com/FiloSottile/mkcert) (thay `<DEVICE>.<TAILNET>` bằng domain thật):

```powershell
mkcert -install
mkcert <DEVICE>.<TAILNET>.ts.net
mkdir ssl
move <DEVICE>.<TAILNET>.ts.net.pem ssl\certificate.pem
move <DEVICE>.<TAILNET>.ts.net-key.pem ssl\private-key.pem
```

Đặt `ENABLE_HTTPS=true` trong `backend/.env` rồi khởi động lại server. Console sẽ in địa chỉ `https://<DEVICE>.<TAILNET>.ts.net:3000`.

> Chứng chỉ mkcert chỉ được tin trên máy đã chạy `mkcert -install`. Thiết bị khác sẽ báo *"Your connection is not private"* cho tới khi cài root CA của mkcert (xem 6.3 cho Android). Trên trình duyệt có thể tạm bấm **Advanced → Proceed**.

### 6.3. Android / ExoPlayer: cài root CA của mkcert

ExoPlayer không phát được video qua HTTPS nếu Android chưa tin chứng chỉ:

1. Lấy file `rootCA.pem` — trên Windows nằm ở `C:\Users\<username>\AppData\Local\mkcert` (chạy `mkcert -CAROOT` để xem đường dẫn).
2. Copy sang điện thoại, đổi tên thành `rootCA.crt` nếu máy không nhận đuôi `.pem`.
3. Cài đặt (ví dụ MIUI/Xiaomi): **Cài đặt → Mật khẩu & Bảo mật → Quyền riêng tư → Mã hoá & chứng chỉ → Cài đặt chứng chỉ từ bộ nhớ** (tên mục khác nhau tuỳ máy) → chọn file → loại **CA chứng thực (VPN và app)** → đồng ý cảnh báo "Mạng có thể bị giám sát".

---

## 7. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|------------|------------------------|-----------|
| Backend tắt ngay, lỗi `ENOENT … .env` | Thiếu `backend/.env` | Làm lại [bước 2](#2-cài-đặt-nhanh) |
| `npm install` lỗi ở `better-sqlite3` | Phiên bản Node không được hỗ trợ / thiếu công cụ build. VD **Node 24**: `better-sqlite3@11.10.0` chưa có bản build sẵn trên Windows | Dùng Node 20 hoặc 22 LTS; cài công cụ build C++ ([mục 1](#1-yêu-cầu)) |
| `Forbidden (blocked)` / `Forbidden (lookup failed)` | IP/hostname thiết bị không có trong whitelist | Thêm vào `ALLOWED_IPS` / `ALLOWED_HOSTNAMES` ([mục 3.3](#33-cho-thiết-bị-khác-truy-cập-điện-thoại-laptop)) |
| Production: trang trắng khi mở bằng `http://localhost:<cổng>` (cổng khác 3000/3001) | CORS ở production chặn cả file JS của app khi origin không nằm trong danh sách | Thêm `localhost:<cổng>` vào `CORS_DEV_CONFIG`, hoặc mở bằng `http://127.0.0.1:<cổng>` / IP LAN |
| Xem được nhưng đăng nhập, scan, yêu thích báo lỗi `CORS blocked` | Mở app bằng một domain lạ (không phải IP / `*.ts.net`) | Thêm domain đó vào `CORS_DEV_CONFIG` |
| Mở dev server bằng domain bị báo *host is not allowed* | Domain đó chưa được khai báo (IP và `*.ts.net` luôn được phép) | Thêm domain vào `VITE_ALLOWED_HOSTS` |
| Không thấy nguồn vừa thêm | Đường dẫn sai / không tồn tại lúc khởi động | Sửa `backend/.env`, khởi động lại server |
| Danh sách manga/phim/nhạc/media trống | Chưa quét database | [Mục 5](#5-lần-đầu-sử-dụng-quét-dữ-liệu) |
| Không tạo được thumbnail phim | Thiếu `ffmpeg` trong `PATH` | Cài ffmpeg, mở terminal mới rồi chạy lại server |
| `This site can't be reached` khi vào `.ts.net` | Tailscale đang tắt / chưa có chứng chỉ | `tailscale up`; kiểm tra thư mục `ssl/` rồi khởi động lại server |
| Bị đẩy về trang chủ, phải đăng nhập lại | Token cũ không còn hợp lệ: vừa cập nhật bản dùng token mới, đã đổi `SECURITY_PASSWORD` hoặc xoá `backend/data/.auth-secret` | Đăng nhập lại (một lần) |
| Nguồn riêng tư không hiện ảnh/thumbnail | Trình duyệt chưa có cookie đăng nhập | Về trang chủ, chọn lại nguồn và đăng nhập |
| Đăng nhập báo *Nhập sai quá nhiều lần* | Sai mật khẩu 10 lần trong 15 phút | Đợi 15 phút hoặc khởi động lại backend |
| Giao diện cũ sau khi build bản mới | Service worker còn giữ bản cũ | DevTools → Application → *Clear site data*, tải lại trang |
| `npm run dev` báo cổng 3001 đang bận | Dev server cũ chưa tắt | Tắt tiến trình đang chiếm cổng 3001 (Vite dùng `strictPort`) |

---

## Cấu trúc repo

```
MainWebSite/
├── backend/            # Express API — server.js, api/, routes/, middleware/, utils/
│   ├── .env.template   # → copy thành .env
│   └── data/           # SQLite: <KEY>.db (tự tạo)
├── react-app/          # React app — src/, public/sw.js (service worker)
│   └── .env.template   # → copy thành .env
├── frontend/           # Giao diện legacy (vanilla JS)
├── scripts/build.js    # Build giao diện legacy
├── ssl/                # Chứng chỉ HTTPS (tự tạo, không commit)
└── docs/               # Tài liệu — bắt đầu từ docs/README.md
```
