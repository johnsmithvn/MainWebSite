# 📋 Refactor Documentation

## 🎯 Mục tiêu Refactor

Refactor này **KHÔNG thay đổi logic cũ**, chỉ cải thiện cấu trúc code để:
- Dễ maintain và mở rộng
- Giảm duplicate code
- Tăng tính tái sử dụng
- Cải thiện error handling

## 📁 Cấu trúc mới (Không ảnh hưởng logic cũ)

### **1. Constants & Configuration**
```
backend/
├── constants.js              # ✅ Mới - Centralized constants
├── utils/
│   ├── config.js            # ✅ Giữ nguyên 
│   ├── DatabaseManager.js   # ✅ Mới - Unified DB management
│   ├── responseHelpers.js   # ✅ Mới - Response utilities
│   ├── databaseUtils.js     # ✅ Mới - DB helper functions
│   └── thumbnailUtils.js    # ✅ Mới - Thumbnail utilities
```

### **2. Route Organization**
```
backend/
├── routes/
│   ├── index.js             # ✅ Mới - Route aggregator
│   ├── manga.js             # ✅ Mới - Manga routes
│   ├── movie.js             # ✅ Mới - Movie routes
│   ├── music.js             # ✅ Mới - Music routes
│   └── system.js            # ✅ Mới - System routes
└── server-refactored.js     # ✅ Mới - Clean server structure
```

### **3. Service Layer**
```
backend/
├── services/
│   └── MediaService.js      # ✅ Mới - Business logic layer
└── middleware/
    ├── index.js             # ✅ Mới - Middleware setup
    ├── errorHandler.js      # ✅ Mới - Global error handling
    └── rateLimiter.js       # ✅ Mới - Rate limiting
```

## 🔄 Migration Plan

### **Phase 1: Immediate (Không ảnh hưởng production)**
1. ✅ Tạo `constants.js` - Centralize all constants
2. ✅ Tạo `DatabaseManager.js` - Unified DB management  
3. ✅ Tạo utility files - Helper functions
4. ✅ Tạo route modules - Organize routes

### **Phase 2: Gradual Migration (Từng bước)**
1. 🔄 Cập nhật `BaseScanner.js` để sử dụng constants mới
2. 🔄 Migrage từng API endpoint để sử dụng new helpers
3. 🔄 Thêm error handling và validation
4. 🔄 Implement rate limiting

### **Phase 3: Optional Enhancements**
1. 🔄 Thêm logging system
2. 🔄 Implement caching layer
3. 🔄 Add API documentation
4. 🔄 Performance monitoring

## 📊 Lợi ích Refactor

### **Trước Refactor:**
- 33 routes trực tiếp trong server.js
- 3 cách quản lý DB khác nhau
- Constants phân tán khắp nơi
- Duplicate code nhiều
- Error handling không nhất quán

### **Sau Refactor:**
- Routes được organize theo module
- Unified database management
- Centralized constants
- Reusable helper functions
- Consistent error handling

## 🚀 Cách sử dụng

### **Option 1: Giữ nguyên server cũ**
```bash
npm start  # Vẫn sử dụng server.js cũ
```

### **Option 2: Sử dụng server mới**
```bash
# Thay đổi package.json
"scripts": {
  "start-new": "node backend/server-refactored.js",
  "start": "npm run build && node backend/server-refactored.js"
}
```

### **Option 3: Gradual migration**
```bash
# Copy routes từ server cũ sang server mới từng bước
# Test thoroughly cho mỗi route
```

## 🔍 Testing Strategy

1. **Unit Tests**: Test từng utility function
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test user workflows
4. **Performance Tests**: So sánh performance trước/sau

## 📝 Notes

- ✅ Tất cả logic cũ được giữ nguyên 100%
- ✅ Backward compatibility đảm bảo
- ✅ Có thể rollback bất cứ lúc nào
- ✅ Migration có thể thực hiện từng bước
- ✅ Production không bị ảnh hưởng
