# 📊 Constants Configuration

## 🎯 Mục đích
File này tập trung tất cả các constants về timing, size, limits trong dự án để:
- Dễ dàng thay đổi cấu hình ở một chỗ
- Tránh hardcode magic numbers
- Cải thiện maintainability
- Đảm bảo tính nhất quán

## 📁 Cấu trúc Constants mới

### Main Entry Points
- `shared/constants.js` - Main entry point, tương thích cả ES modules và CommonJS
- `shared/constants/index.js` - Central index file

### Specialized Constants Files
- `shared/constants/timing.js` - Timing và delay constants
- `shared/constants/limits.js` - Size, limit, breakpoint constants
- `shared/constants/ui.js` - UI styling constants
- `shared/constants/server.js` - Server và HTTP constants
- `shared/constants/cache.js` - Cache configuration constants

## 🔧 Các Constants chính

### ⏰ TIMING
- `AUTO_SCROLL_INTERVAL`: **20000ms** (20 giây) - Thời gian auto-scroll banner
- `TOAST_TIMEOUT`: **3000ms** (3 giây) - Thời gian hiển thị toast
- `UI_INDICATOR_TIMEOUT`: **5000ms** (5 giây) - Thời gian auto-remove indicator
- `CACHE_CLEANUP_INTERVAL`: **7 ngày** - Thời gian cache cleanup
- `TOKEN_EXPIRY`: **24 giờ** - Thời gian hết hạn token
- `TEST_CACHE_TTL`: **1000ms** (1 giây) - TTL cho testing
- `TEST_TIMEOUT`: **1100ms** (1.1 giây) - Timeout cho testing

### 📊 LIMITS
- `SEARCH_LIMIT`: **50** - Số kết quả search mỗi lần
- `IMAGES_PER_PAGE`: **400** - Số ảnh mỗi trang trong reader
- `MAX_RECENT_ITEMS`: **50** - Số item recent tối đa
- `MOBILE_BREAKPOINT`: **480px** - Breakpoint cho mobile
- `BATCH_SIZE`: **100** - Kích thước batch xử lý DB
- `CACHE_SIZE`: **10000** - Kích thước cache DB
- `MAX_FILE_SIZE`: **500MB** - Kích thước file tối đa
- `MAX_PATH_LENGTH`: **1000** - Độ dài path tối đa
- `CACHE_CLEANUP_THRESHOLD`: **50MB** - Ngưỡng cleanup cache
- `MAX_FOLDER_CACHE_SIZE`: **100MB** - Cache folder tối đa
- `MAX_MOVIE_CACHE_SIZE`: **200MB** - Cache movie tối đa
- `MAX_MUSIC_CACHE_SIZE`: **150MB** - Cache music tối đa
- `READER_MAX_WIDTH`: **400px** - Chiều rộng reader tối đa
- `PLAYLIST_MOBILE_WIDTH`: **400px** - Chiều rộng playlist mobile
- `PLAYLIST_DESKTOP_WIDTH`: **340px** - Chiều rộng playlist desktop
- `THUMBNAIL_SIZE`: **480px** - Kích thước thumbnail

### 🌐 SERVER
- `DEFAULT_PORT`: **3000** - Port mặc định
- `HTTP_STATUS`: Các HTTP status codes
- `ALLOWED_HOSTS`: Hosts được phép

### 🎨 UI_STYLES
- `Z_INDEX`: Các giá trị z-index
  - `TOAST`: **9999**
  - `MODAL`: **99999**
  - `OVERLAY`: **110000**
- `POSITIONING`: Các giá trị positioning
- `COLORS`: Các màu sắc
- `FONT_WEIGHT`: Các font weight

## 🚀 Cách sử dụng

### Frontend (ES Modules)
```javascript
import { TIMING, LIMITS, UI_STYLES } from '/shared/uiConstants.js';

// Sử dụng timing
setTimeout(() => {
  // do something
}, TIMING.TOAST_TIMEOUT);

// Sử dụng limits
const searchLimit = LIMITS.SEARCH_LIMIT;

// Sử dụng UI styles
element.style.zIndex = UI_STYLES.Z_INDEX.TOAST;
```

### Backend (CommonJS)
```javascript
const { TIMING, LIMITS, SERVER } = require('./constants/uiConstants');

// Sử dụng server constants
const PORT = process.env.PORT || SERVER.DEFAULT_PORT;

// Sử dụng status codes
res.status(SERVER.HTTP_STATUS.BAD_REQUEST).json({ error: 'Bad request' });
```

## 🔄 Migration từ hardcoded values

### Trước khi có constants:
```javascript
// ❌ Hardcoded values
const SEARCH_LIMIT = 50;
setTimeout(() => {}, 3000);
element.style.zIndex = "9999";
if (window.innerWidth <= 480) {}
```

### Sau khi có constants:
```javascript
// ✅ Sử dụng constants
import { LIMITS, TIMING, UI_STYLES } from '/shared/uiConstants.js';

const searchLimit = LIMITS.SEARCH_LIMIT;
setTimeout(() => {}, TIMING.TOAST_TIMEOUT);
element.style.zIndex = UI_STYLES.Z_INDEX.TOAST;
if (window.innerWidth <= LIMITS.MOBILE_BREAKPOINT) {}
```

## 📝 Lưu ý

1. **Tập trung**: Tất cả constants về timing/size/limits đều ở đây
2. **Consistency**: Đảm bảo cùng một giá trị được dùng ở mọi nơi
3. **Maintainability**: Dễ dàng thay đổi cấu hình từ một chỗ
4. **Documentation**: Mỗi constant đều có comment giải thích
5. **Type safety**: Tránh lỗi typo khi sử dụng magic numbers

## 🎯 Các file đã được cập nhật

### Frontend:
- `frontend/src/core/ui.js` - Search limits, timing, styles
- `frontend/src/components/folderSlider.js` - Auto-scroll timing
- `frontend/src/utils/uiHelpers.js` - UI timeouts
- `frontend/src/utils/cacheManager.js` - Cache thresholds
- `frontend/src/components/music/playlistMenu.js` - Responsive breakpoints
- `frontend/src/core/reader/scroll.js` - Reader limits

### Backend:
- `backend/server.js` - Server port, HTTP status codes
- `backend/constants/uiConstants.js` - Backend constants
- `test/utils-test.js` - Test timeouts

### Shared:
- `shared/constants.js` - Import từ uiConstants
- `shared/uiConstants.js` - Master constants file

## 🔧 Cách thay đổi constants

1. **Thay đổi timing**: Sửa trong `TIMING` object
2. **Thay đổi limits**: Sửa trong `LIMITS` object
3. **Thay đổi UI styles**: Sửa trong `UI_STYLES` object
4. **Thay đổi server config**: Sửa trong `SERVER` object

Ví dụ thay đổi thời gian auto-scroll banner từ 20 giây thành 30 giây:
```javascript
// shared/uiConstants.js
export const TIMING = {
  AUTO_SCROLL_INTERVAL: 30000, // Thay đổi từ 20000 thành 30000
  // ... các constants khác
};
```

## ✅ Kết quả

- ✅ Loại bỏ hardcoded values
- ✅ Tập trung constants ở một chỗ
- ✅ Dễ dàng thay đổi cấu hình
- ✅ Cải thiện maintainability
- ✅ Đảm bảo consistency
- ✅ Có documentation đầy đủ
