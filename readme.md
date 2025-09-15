# MainWebSite Monorepo

Ứng dụng gồm **backend** (Express) và **React app** (Vite) được quản lý bằng [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces).

## Cài đặt

```bash
npm install
```

Lệnh trên sẽ cài đặt phụ thuộc cho cả hai workspace.

## Phát triển

```bash
npm run dev
```

- Backend chạy ở `http://localhost:3000`
- React app chạy ở `http://localhost:3001`

React tự động proxy các request `/api` tới backend.

## Đóng gói

```bash
npm run build
```

Lệnh build sẽ:
- Đóng gói static assets cho backend
- Build React app vào `react-app/dist`

Sau khi build có thể phục vụ React app tại đường dẫn `/app` từ backend.




<!-- note -->

- nếu chạy dev thì sử dụng

```bash
npm run dev
```
- Khi đó vừa sửa code thì nó tự cập nhật 
lúc này nó đang chạy trên các file gốc và react-app ở 3001 

- nếu chạy prod thì sử dụng
```bash
npm run prod
```

- Nó sẽ build react-app thành dist , rồi chạy vào backend và start 
=> khi đó froent chỉ chạy được reac-app trong dist đã build sẽ tối ưu hơn và lúc này sẽ chạy ở port 3000 của sever

=> sử dụng tailce thì cần config trong env của cả 2 env ở backend và react-app để nó build trc khi chạy prod

nó sẽ chạy được ở các http://localhost:3000/ ,http://127.0.0.1:3000/ ,.ts.net:3000 (do đã cấu hình trong env) 
chạy prod trong backend nó tự set "prod": "cross-env NODE_ENV=production node server.js",

- nếu k tin tưởng có thể tự đổi tay



------------------------ Chạy lần đầu ---- 

1. tạo key để chạy https
(domain taiscle mà sever đang chạy)
```bash
mkcert -install
mkcert TAILSCALE_DEVICE.TAILSCALE_TAILNET.ts.net 
```
=> lúc này nó sẽ tạo ra 2 file 
*.pem  => đổi thành  certificate.pem
*-key.pem => đổi thành private-key.pem

=> rồi move vào ssl folder

----------


