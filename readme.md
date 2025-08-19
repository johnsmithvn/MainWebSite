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
