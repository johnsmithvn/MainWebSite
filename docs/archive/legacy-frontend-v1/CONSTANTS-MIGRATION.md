# 📋 Frontend Constants Migration Guide

> **📜 Tài liệu lịch sử (07/2025) — frontend legacy.** Nội dung thuộc thư mục `frontend/` (vanilla JS), đã được thay thế bởi React app trong `react-app/` và không còn phát triển. Không áp dụng cho React app. Trạng thái hệ thống hiện tại: [docs/SYSTEM-REPORT.md](../../docs/SYSTEM-REPORT.md).

## 🎯 Tổng quan

File `frontend/src/constants.js` được tạo để **tập trung hóa các giá trị constants** trong frontend mà **không thay đổi logic cũ**.

## ✅ Các file đã được migrate:

### **1. `frontend/src/core/folder.js`**
- ✅ `foldersPerPage = 24` → `PAGINATION.FOLDERS_PER_PAGE`

### **2. `frontend/src/pages/music/index.js`**
- ✅ `perPage = 20` → `PAGINATION.MUSIC_PER_PAGE`

### **3. `frontend/src/pages/movie/index.js`**
- ✅ `moviesPerPage = 20` → `PAGINATION.MOVIES_PER_PAGE`

### **4. `frontend/src/pages/manga/favorites.js`**
- ✅ `perPage = 20` → `PAGINATION.MANGA_FAVORITES_PER_PAGE`

### **5. `frontend/src/core/reader/scroll.js`**
- ✅ `imagesPerPage = 200` → `READER.IMAGES_PER_PAGE`

### **6. `frontend/src/components/folderSlider.js`**
- ✅ `window.innerWidth <= 768` → `RESPONSIVE.MOBILE_BREAKPOINT`
- ✅ `30 * 60 * 1000` → `CACHE.SLIDER_CACHE_MS`

### **7. `frontend/src/core/storage.js`**
- ✅ `4 * 1024 * 1024 + 300` → `CACHE.MAX_TOTAL_CACHE_SIZE`
- ✅ `4 * 1024 * 1024 + 300` → `CACHE.MAX_MOVIE_CACHE_SIZE`
- ✅ `7 * 24 * 60 * 60 * 1000` → `CACHE.THUMBNAIL_CACHE_MS`
- ✅ Cache prefixes → `CACHE.MOVIE_CACHE_PREFIX`, `CACHE.FOLDER_CACHE_PREFIX`, `CACHE.ROOT_THUMB_CACHE_PREFIX`

### **8. `frontend/src/core/ui.js`**
- ✅ `"⬅ Trang trước"` → `UI.PREV_PAGE_TEXT`
- ✅ `"Trang sau ➡"` → `UI.NEXT_PAGE_TEXT`
- ✅ `"⏩"` → `UI.JUMP_BUTTON_TEXT`
- ✅ `"Trang..."` → `UI.JUMP_PLACEHOLDER`
- ✅ `"60px"` → `UI.JUMP_INPUT_WIDTH`
- ✅ `SEARCH_LIMIT = 50` → `SEARCH.MAX_SEARCH_RESULTS`

### **9. `frontend/src/components/music/playlistMenu.js`**
- ✅ Added `RESPONSIVE` import (keeping 480px as specific mobile breakpoint)

## 📊 Các Constants đã được tập trung hóa:

### **1. 📄 Pagination Constants**
```javascript
// ❌ Trước (hardcoded)
const perPage = 20;
const foldersPerPage = 24;
const perPageFolder = 16;

// ✅ Sau (constants)
import { PAGINATION } from './constants.js';
const perPage = PAGINATION.MANGA_FAVORITES_PER_PAGE;
const foldersPerPage = PAGINATION.FOLDERS_PER_PAGE;
const perPageFolder = PAGINATION.MOVIE_FAVORITES_FOLDER_PER_PAGE;
```

### **2. 💾 Cache Constants**
```javascript
// ❌ Trước (hardcoded)
const maxTotalSize = 4 * 1024 * 1024 + 300;
if (Date.now() - time > 7 * 24 * 60 * 60 * 1000) {

// ✅ Sau (constants)
import { CACHE } from './constants.js';
const maxTotalSize = CACHE.MAX_TOTAL_CACHE_SIZE;
if (Date.now() - time > CACHE.THUMBNAIL_CACHE_MS) {
```

### **3. 📖 Reader Constants**
```javascript
// ❌ Trước (hardcoded)
const imagesPerPage = 200;

// ✅ Sau (constants)
import { READER } from './constants.js';
const imagesPerPage = READER.IMAGES_PER_PAGE;
```

### **4. 🎨 UI Text Constants**
```javascript
// ❌ Trước (hardcoded)
prev.textContent = "⬅ Trang trước";
next.textContent = "Trang sau ➡";
jumpBtn.textContent = "⏩";

// ✅ Sau (constants)
import { UI } from './constants.js';
prev.textContent = UI.PREV_PAGE_TEXT;
next.textContent = UI.NEXT_PAGE_TEXT;
jumpBtn.textContent = UI.JUMP_BUTTON_TEXT;
```

### **5. 🔍 Search Constants**
```javascript
// ❌ Trước (hardcoded)
ORDER BY RANDOM() LIMIT 30
LIMIT 30

// ✅ Sau (constants)
import { SEARCH } from './constants.js';
ORDER BY RANDOM() LIMIT ${SEARCH.RANDOM_ITEMS_LIMIT}
LIMIT ${SEARCH.TOP_ITEMS_LIMIT}
```

### **6. 🎵 Slider Constants**
```javascript
// ❌ Trước (hardcoded)
setInterval(scrollInterval, 20000);

// ✅ Sau (constants)
import { SLIDER } from './constants.js';
setInterval(scrollInterval, SLIDER.AUTO_SCROLL_INTERVAL);
```

### **7. 💿 Storage Keys Constants**
```javascript
// ❌ Trước (hardcoded)
return `recentViewed::${getRootFolder()}`;
return `recentViewedVideo::${key}`;

// ✅ Sau (constants)
import { STORAGE_KEYS } from './constants.js';
return `${STORAGE_KEYS.RECENT_VIEWED}::${getRootFolder()}`;
return `${STORAGE_KEYS.RECENT_VIEWED_VIDEO}::${key}`;
```

### **8. 🎨 CSS Classes Constants**
```javascript
// ❌ Trước (hardcoded)
section.className = "folder-section grid";
nav.className = "reader-controls";

// ✅ Sau (constants)
import { CSS_CLASSES } from './constants.js';
section.className = `${CSS_CLASSES.FOLDER_SECTION} ${CSS_CLASSES.GRID}`;
nav.className = CSS_CLASSES.READER_CONTROLS;
```

## 🔄 Migration Strategy

### **Phase 1: Immediate (Không ảnh hưởng logic)**
1. ✅ Tạo `frontend/src/constants.js`
2. ✅ Tạo examples và documentation
3. ✅ Test constants import

### **Phase 2: Gradual Migration**
1. 🔄 Migrate từng file một
2. 🔄 Test thoroughly sau mỗi migration
3. 🔄 Giữ nguyên logic cũ 100%

### **Phase 3: Cleanup**
1. 🔄 Remove hardcoded values
2. 🔄 Verify all functionality works
3. 🔄 Update documentation

## 📝 Files cần migrate:

### **High Priority:**
- `frontend/src/core/storage.js` - Cache constants
- `frontend/src/core/folder.js` - Pagination constants
- `frontend/src/core/reader/scroll.js` - Reader constants
- `frontend/src/core/ui.js` - UI constants

### **Medium Priority:**
- `frontend/src/pages/manga/favorites.js` - Pagination
- `frontend/src/pages/movie/favorites.js` - Pagination
- `frontend/src/pages/music/index.js` - Pagination
- `frontend/src/components/folderSlider.js` - Slider constants

### **Low Priority:**
- `frontend/src/pages/home.js` - UI constants
- `frontend/src/pages/select.js` - UI constants
- Other pages with minor constants

## 🚀 Cách sử dụng:

### **Import constants:**
```javascript
import { 
  PAGINATION, 
  CACHE, 
  READER, 
  UI, 
  SEARCH 
} from './constants.js';
```

### **Sử dụng trong code:**
```javascript
// Pagination
const totalPages = Math.ceil(totalItems / PAGINATION.FOLDERS_PER_PAGE);

// Cache
if (size > CACHE.MAX_FOLDER_CACHE_SIZE) { ... }

// Reader
const pages = Math.ceil(images.length / READER.IMAGES_PER_PAGE);

// UI
button.textContent = UI.NEXT_PAGE_TEXT;
```

## ✅ Lợi ích:

1. **Dễ maintenance** - Thay đổi constants ở một nơi
2. **Tránh typo** - IDE autocomplete
3. **Consistency** - Cùng một giá trị trong toàn app
4. **Documentation** - Constants có comment rõ ràng
5. **Testing** - Dễ test với mock constants

## 🔍 Testing:

```javascript
// Test constants import
import { PAGINATION } from './constants.js';
console.log('Pagination constants:', PAGINATION);

// Test functionality
const perPage = PAGINATION.FOLDERS_PER_PAGE;
console.log('Items per page:', perPage);
```

## 🎯 Rollback Plan:

Nếu cần rollback, chỉ cần:
1. Xóa import constants
2. Thay lại bằng hardcoded values
3. Logic vẫn hoạt động bình thường

## 📊 Impact:

- ✅ **Zero impact** on existing functionality
- ✅ **Backward compatible** 100%
- ✅ **Optional migration** - có thể áp dụng từng bước
- ✅ **Easy rollback** - nếu cần thiết

**Constants này chỉ là tools hỗ trợ, không bắt buộc phải migrate ngay!** 🚀
