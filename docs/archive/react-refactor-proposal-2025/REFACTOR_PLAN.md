# 📋 KẾ HOẠCH REFACTOR REACT-APP

> **📋 Đề xuất refactor 10/2025 — CHƯA được thực hiện** (kiểm tra 2026-10-29). Các file mục tiêu như `authStore.js`, `mangaStore.js`, `SettingSection.jsx`, `MangaSettings.jsx`… không tồn tại; store vẫn nằm trong `src/store/index.js`. Danh sách dead code đã cập nhật: [docs/DEAD-CODE-REPORT.md](../../docs/DEAD-CODE-REPORT.md).

## 🎯 Mục Tiêu
Tối ưu hóa cấu trúc code, loại bỏ duplicate code, dead code và cải thiện maintainability

## 🔴 PHASE 1: CRITICAL FIXES (Ưu tiên cao)

### 1.1 Tách `store/index.js` (994 lines → 6 files)
**Tạo các file mới:**
- [x] `store/authStore.js` - Authentication state
- [x] `store/uiStore.js` - UI state (dark mode, sidebar, toast, loading)
- [x] `store/mangaStore.js` - Manga data & operations
- [x] `store/movieStore.js` - Movie data & operations  
- [x] `store/musicStore.js` - Music data & operations
- [x] `store/sharedStore.js` - Shared utilities (clearCache, etc.)
- [x] `store/index.js` - Re-export all stores

**Benefits:**
- Dễ maintain hơn
- Tăng reusability
- Giảm complexity
- Better code organization

### 1.2 Tách `pages/Settings.jsx` (1,880 lines → 7 files)
**Cấu trúc mới:**
```
pages/settings/
  ├── index.jsx (Main component với tabs navigation)
  ├── AppearanceSettings.jsx (Dark mode, animations, UI settings)
  ├── MangaSettings.jsx (Manga-specific settings & DB operations)
  ├── MovieSettings.jsx (Movie-specific settings & DB operations)
  ├── MusicSettings.jsx (Music-specific settings & DB operations)
  ├── OfflineSettings.jsx (Offline library settings)
  └── components/
      ├── SettingSection.jsx (Reusable section component)
      ├── SettingItem.jsx (Reusable setting item)
      └── DatabaseActionButtons.jsx (Scan/Delete/Reset buttons)
```

**Logic chung:** Tất cả 15+ handlers giống nhau sẽ dùng `utils/databaseOperations.js`

### 1.3 Loại Bỏ Code Trùng Lặp

#### a) Thumbnail Processing
**Tạo:** `utils/thumbnailProcessor.js`
```javascript
export const processThumbnailUrl = (item, mediaType = 'movie') => {
  // Unified logic for movie/music thumbnail processing
  // Move duplicate code from store/index.js (lines 434-484, 637-699, 797-844)
}
```

#### b) Cache Operations
**Refactor:** Sử dụng `constants/cacheKeys.js` thay vì duplicate trong store
```javascript
// ❌ Trước
clearRecentHistory: () => { /* duplicate logic */ }

// ✅ Sau  
clearRecentHistory: (type) => {
  const { clearRecentHistory } = useSharedSettingsStore.getState();
  clearRecentHistory(type, sourceKey, rootFolder);
}
```

## 🟡 PHASE 2: MEDIUM FIXES (Ưu tiên trung bình)

### 2.1 Loại Bỏ Dead Code

#### Unused Hooks (hooks/index.js)
**Xóa các hooks không dùng:**
- [ ] `useVirtualizer` - KHÔNG tìm thấy usage
- [ ] `useAsync` - KHÔNG tìm thấy usage  
- [ ] `useClickOutside` - KHÔNG tìm thấy usage
- [ ] `useKeyPress` - KHÔNG tìm thấy usage
- [ ] `useLocalStorage` - KHÔNG tìm thấy usage
- [ ] `useIntersectionObserver` - KHÔNG tìm thấy usage
- [ ] `useMediaQuery` - KHÔNG tìm thấy usage

**Giữ lại hooks đang dùng:**
- [x] `useRandomItems`
- [x] `useRecentItems`
- [x] `useRecentManager`
- [x] `useServiceWorker`
- [x] `useDebounceValue`
- [x] `usePagination`

### 2.2 Tối Ưu `utils/favoriteCache.js` (337 lines)

**Refactor strategy:**
```javascript
// Thay vì 7 separate sections với duplicate logic
// Tạo 1 generic update function:

const updateCacheEntry = (cacheKey, itemPath, isFavorite) => {
  // Generic logic to update any cache entry
}

const CACHE_PATTERNS = {
  manga: [...],
  movie: [...],
  music: [...]
}

export const updateFavoriteInAllCaches = (sourceKey, itemPath, isFavorite, rootFolder) => {
  const patterns = getAllCachePatterns(sourceKey, rootFolder);
  patterns.forEach(pattern => {
    updateCacheEntry(pattern, itemPath, isFavorite);
  });
}
```

### 2.3 Chuẩn Hóa Format Functions

**Tạo:** `utils/formatters.js` (nếu chưa có) với:
```javascript
export const formatDuration = (seconds) => {
  // Unified duration formatter
}

export const formatFileSize = (bytes) => {
  // Unified file size formatter
}

export const formatDate = (timestamp) => {
  // Unified date formatter  
}
```

**Sử dụng trong:** MusicCard, MovieCard, và các components khác

## 🟢 PHASE 3: STRUCTURE IMPROVEMENTS (Ưu tiên thấp)



### 3.2 Create Shared Components

**Tạo:** `components/common/database/`
```
database/
  ├── DatabaseActions.jsx (Already exists)
  ├── ScanButton.jsx
  ├── DeleteButton.jsx
  ├── ResetButton.jsx
  └── ThumbnailButton.jsx (for movie/music)
```

### 3.3 Centralize API Aliases

**Refactor `utils/api.js`:**
```javascript
// ❌ Loại bỏ aliases thừa
system: {
  increaseView: (params) => api.post(`/api/increase-view/movie`, params),
  increaseViewMovie: (params) => api.post(`/api/increase-view/movie`, params), // DUPLICATE
  increaseViewManga: (params) => api.post(`/api/increase-view`, params),
}

// ✅ Giữ lại 1 function với type parameter
system: {
  increaseView: (type, params) => {
    const endpoint = type === 'manga' ? '/api/increase-view' : `/api/increase-view/${type}`;
    return api.post(endpoint, params);
  }
}
```

## 📊 METRICS

### Trước Refactor
- `store/index.js`: **994 lines**
- `pages/Settings.jsx`: **1,880 lines**
- `utils/favoriteCache.js`: **337 lines**
- Total Dead Code: **~200 lines** (7 unused hooks)
- Duplicate Code: **~500 lines** (thumbnail + cache + handlers)

### Sau Refactor (Dự kiến)
- Store files: **6 x ~150 lines** = 900 lines (giảm 94 lines)
- Settings files: **7 x ~250 lines** = 1,750 lines (giảm 130 lines)
- `utils/favoriteCache.js`: **~200 lines** (giảm 137 lines)
- Dead Code: **0 lines** (removed)
- Duplicate Code: **0 lines** (unified)

**Total Reduction: ~561 lines + Better structure**

## 🚀 EXECUTION PLAN

### Week 1: Critical Fixes
- [ ] Day 1-2: Tách store/index.js → 6 files
- [ ] Day 3-5: Tách Settings.jsx → settings folder

### Week 2: Medium Fixes  
- [ ] Day 1-2: Loại bỏ unused hooks
- [ ] Day 3-4: Refactor favoriteCache.js
- [ ] Day 5: Chuẩn hóa formatters

### Week 3: Structure Improvements
- [ ] Day 1-2: Reorganize offline pages
- [ ] Day 3-4: Create shared components
- [ ] Day 5: Clean up API aliases

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG xóa comment code** - Giữ nguyên tất cả comments
2. **KHÔNG thay đổi logic** - Chỉ reorganize và deduplicate
3. **Testing sau mỗi phase** - Đảm bảo không break functionality
4. **Git commits nhỏ** - Mỗi refactor 1 commit riêng
5. **Backup trước khi refactor** - Safety first

## 📝 CHECKLIST

### Phase 1 (Critical)
- [ ] Tách store thành 6 files
- [ ] Tách Settings thành 7 files
- [ ] Tạo thumbnailProcessor utility
- [ ] Refactor cache operations

### Phase 2 (Medium)
- [ ] Xóa unused hooks
- [ ] Tối ưu favoriteCache
- [ ] Chuẩn hóa formatters

### Phase 3 (Low Priority)
- [ ] Reorganize offline pages
- [ ] Create shared DB components
- [ ] Clean up API aliases

## 🎉 EXPECTED BENEFITS

✅ **Code Quality**
- Giảm ~25% dòng code
- Loại bỏ toàn bộ duplicate code
- Không còn dead code

✅ **Maintainability**
- Files ngắn hơn, dễ đọc hơn
- Logic rõ ràng, không lặp lại
- Dễ debug và test

✅ **Performance**
- Bundle size nhỏ hơn
- Faster build time
- Better tree-shaking

✅ **Developer Experience**
- Dễ tìm code hơn
- Dễ thêm features mới
- Onboarding nhanh hơn

---

**Status:** 📋 READY TO START
**Last Updated:** 2025-10-05
**Priority:** 🔴 HIGH
