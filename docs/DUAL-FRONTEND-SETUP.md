# 🔄 Dual Frontend Setup - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

MainWebSite hiện đã hỗ trợ **dual frontend** - chạy đồng thời cả React app (modern) và Legacy (traditional) mà **KHÔNG CẦN** rebuild toàn bộ.

## 🎯 Cách Hoạt Động

### 🔍 Smart Frontend Detection

Server sử dụng **intelligent routing** để tự động phát hiện frontend phù hợp:

1. **Query Parameter**: `?ui=react` hoặc `?ui=legacy`
2. **Cookie Preference**: Lưu lựa chọn của user
3. **Path Detection**: `/app/*` → React, `/legacy/*` → Legacy  
4. **Referrer Analysis**: Phát hiện từ đâu user navigate
5. **Default Logic**: Production → React, Development → Legacy

### 🌐 URL Structure

```
# Interface Selector (tự động chọn)
https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/

# Force React App
https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/app
https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/?ui=react

# Force Legacy
https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/?ui=legacy

# Interface Selector
https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/?selector=true
```

## 🚀 Cách Sử Dụng

### 1. **Truy Cập Lần Đầu**
- Vào `https://desktop-v88j9e0.tail2b3d3b.ts.net:3000/`
- Chọn giao diện trong **Interface Selector**
- Lựa chọn được lưu cho các lần sau

### 2. **Chuyển Đổi Giao Diện**

#### Từ React App:
- Vào **Settings** → **Interface** tab
- Click "Switch Interface" 
- Hoặc click "Preview Legacy" để xem trước

#### Từ Legacy:
- Thêm `?ui=react` vào URL bất kỳ
- Hoặc vào `/app` trực tiếp

#### Quick Switching:
```
# Trong URL hiện tại, thêm:
?ui=react   # Chuyển sang React
?ui=legacy  # Chuyển sang Legacy  
```

### 3. **Reset Preference**
```javascript
// Xóa cookie preference trong DevTools
document.cookie = 'ui_preference=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
```

## 🛠️ Development Commands

```bash
# Build cả React và Legacy
npm run build:prod

# Development (dual)
npm run dev              # React + Backend
npm run dev:legacy       # Legacy build

# Production 
npm run prod            # Serve cả hai frontend
```

## 🔧 Technical Details

### Smart Detection Logic
```javascript
function detectFrontendType(req) {
  // 1. Explicit query param
  if (req.query.ui === 'react') return 'react';
  if (req.query.ui === 'legacy') return 'legacy';
  
  // 2. Saved preference
  const preference = req.cookies?.ui_preference;
  if (preference) return preference;
  
  // 3. Path-based
  if (req.path.startsWith('/app/')) return 'react';
  
  // 4. Default
  return isProduction ? 'react' : 'legacy';
}
```

### API Endpoints
```javascript
// Get current preference
GET /api/ui-preference
// Response: { preference: 'react', detected: 'react' }

// Save preference  
POST /api/ui-preference
// Body: { preference: 'react' | 'legacy' }
```

## 📁 File Structure

```
backend/
  server.js              # ✅ Updated với smart routing
frontend/
  public/
    interface-selector.html  # ✅ New interface selector
    home.html               # Legacy entry
react-app/
  src/
    components/common/
      UISwitcher.jsx        # ✅ New UI switcher modal
    pages/
      Settings.jsx          # ✅ Updated với interface tab
```

## 🎨 Interface Features

### React App (V2)
- ⚡ Fast loading với Vite
- 🎨 Modern UI với TailwindCSS
- 📱 PWA support
- 🌙 Dark mode
- 🔄 Live updates
- 📊 Analytics integration

### Legacy (V1)  
- 🛡️ Battle-tested stability
- ✅ Complete feature set
- 🏛️ Classic design
- 🔒 Proven reliability
- 📋 Full functionality

## 🔄 Migration Benefits

### ✅ Advantages
- **Zero Downtime**: Cả hai giao diện chạy song song
- **User Choice**: Người dùng tự chọn giao diện phù hợp
- **Gradual Migration**: Chuyển đổi từ từ, không bắt buộc
- **Same Backend**: Cùng API và data
- **Easy Switching**: Chuyển đổi instant, không cần reload app

### 🛡️ Safety
- Legacy vẫn hoạt động bình thường
- React app được test kỹ
- Có thể rollback bất kỳ lúc nào
- Dữ liệu không bị ảnh hưởng

## 🚀 Next Steps

1. **Test cả hai giao diện** để đảm bảo mọi tính năng hoạt động
2. **Thu thập feedback** từ users về React app
3. **Monitor performance** và stability
4. **Gradually deprecate Legacy** khi React app stable
5. **Add more React features** như advanced PWA, notifications, etc.

## 🐛 Troubleshooting

### Vấn đề: Reload về legacy
**Nguyên nhân**: Conflict routing  
**Giải pháp**: Đã fix với smart fallback trong server.js

### Vấn đề: Port 3000 thay vì 3001
**Nguyên nhân**: Production mode serve React build từ backend  
**Giải pháp**: Hoạt động bình thường, port 3001 chỉ dùng cho dev

### Vấn đề: Giao diện không đúng
**Giải pháp**: 
- Check cookie: `document.cookie`
- Force URL: thêm `?ui=react` hoặc `?ui=legacy`
- Reset preference và chọn lại

---

**🎉 Kết quả**: Bạn đã có dual frontend hoàn chỉnh mà không cần rebuild! Users có thể chọn giao diện phù hợp và chuyển đổi linh hoạt.
