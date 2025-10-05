# 🔍 PHÂN TÍCH CÁC HOOKS KHÔNG SỬ DỤNG

## 📋 Tổng Quan

**File:** `src/hooks/index.js`  
**Ngày phân tích:** 2025-10-05  
**Trạng thái:** ❌ 7/14 hooks KHÔNG được sử dụng

---

## ❌ DANH SÁCH HOOKS KHÔNG DÙNG

### 1. `useLocalStorage` (Lines 14-36)

**Mục đích ban đầu:**
- Hook quản lý localStorage với React state
- Auto-sync giữa localStorage và component state
- Error handling khi read/write

**Tại sao tạo ra:**
- Pattern phổ biến trong React apps
- Tiện cho việc persist user preferences
- Chuẩn bị cho tương lai khi cần lưu settings vào localStorage

**Tại sao KHÔNG dùng:**
- ✅ Project đã dùng **Zustand với persist middleware**
- ✅ `store/index.js` đã handle localStorage tự động
- ✅ Không cần custom hook riêng

**Ví dụ thay thế:**
```javascript
// ❌ Không dùng useLocalStorage
const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);

// ✅ Đã dùng Zustand store
const { darkMode, toggleDarkMode } = useUIStore();
```

**Verdict:** 🗑️ **XÓA** - Zustand persist đã thay thế

---

### 2. `useIntersectionObserver` (Lines 45-66)

**Mục đích ban đầu:**
- Hook theo dõi element visibility trong viewport
- Dùng cho lazy loading images/components
- Infinite scroll implementation

**Tại sao tạo ra:**
- Cần lazy load manga thumbnails
- Optimize performance với large lists
- Infinite scroll cho manga grid

**Tại sao KHÔNG dùng:**
- ✅ Project dùng **`react-lazy-load-image-component`** library
- ✅ Components dùng `LazyLoadImage` component thay vì custom hook
- ✅ Đã có pagination thay vì infinite scroll

**Ví dụ thay thế:**
```javascript
// ❌ Không dùng useIntersectionObserver
const [ref, entry] = useIntersectionObserver();
if (entry?.isIntersecting) loadMore();

// ✅ Đã dùng LazyLoadImage component
import { LazyLoadImage } from 'react-lazy-load-image-component';
<LazyLoadImage src={thumbnail} alt={name} />
```

**Verdict:** 🗑️ **XÓA** - Library component thay thế tốt hơn

---

### 3. `useMediaQuery` (Lines 68-85)

**Mục đích ban đầu:**
- Hook detect screen size/device type
- Responsive behavior trong components
- Mobile/desktop conditional rendering

**Tại sao tạo ra:**
- Cần responsive UI cho manga reader
- Mobile vs desktop layout khác nhau
- Conditional features based on screen size

**Tại sao KHÔNG dùng:**
- ✅ Project dùng **TailwindCSS responsive classes**
- ✅ CSS breakpoints handle responsive đủ tốt
- ✅ Vài chỗ cần JS check thì dùng inline logic

**Ví dụ thay thế:**
```javascript
// ❌ Không dùng useMediaQuery
const isMobile = useMediaQuery('(max-width: 768px)');

// ✅ Dùng Tailwind classes
<div className="hidden md:block">Desktop only</div>

// ✅ Hoặc inline check khi cần
const isMobile = window.innerWidth <= 768;
```

**Verdict:** ⚠️ **XÓA hoặc GIỮ** - Tailwind đủ, nhưng có thể hữu ích sau này

---

### 4. `useClickOutside` (Lines 87-103)

**Mục đích ban đầu:**
- Hook detect click outside element
- Dùng cho close modal/dropdown
- Click-away behavior

**Tại sao tạo ra:**
- Cần close SearchModal khi click outside
- Sidebar toggle khi click outside
- Dropdown menu behavior

**Tại sao KHÔNG dùng:**
- ✅ Components dùng **modal libraries** (react-modal)
- ✅ Modal/Sidebar có built-in click outside
- ✅ Không cần custom implementation

**Ví dụ thay thế:**
```javascript
// ❌ Không dùng useClickOutside
const ref = useClickOutside(() => setOpen(false));

// ✅ Dùng Modal component props
<Modal
  isOpen={isOpen}
  onRequestClose={() => setOpen(false)}
  shouldCloseOnOverlayClick={true}
/>
```

**Verdict:** 🗑️ **XÓA** - Modal library đã handle

---

### 5. `useKeyPress` (Lines 105-117)

**Mục đích ban đầu:**
- Hook detect keyboard shortcuts
- Navigation với arrow keys
- ESC to close modal

**Tại sao tạo ra:**
- Manga reader cần arrow keys navigation
- Close modal với ESC
- Keyboard shortcuts cho power users

**Tại sao KHÔNG dùng:**
- ✅ **MangaReader có inline keyboard handlers**
- ✅ Modal libraries handle ESC key
- ✅ Không cần abstract thành hook

**Ví dụ hiện tại:**
```javascript
// ✅ MangaReader.jsx có inline logic
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [nextPage, prevPage]);
```

**Verdict:** ⚠️ **XÓA hoặc GIỮ** - Inline đủ, nhưng có thể refactor sau

---

### 6. `useAsync` (Lines 119-148)

**Mục đích ban đầu:**
- Hook quản lý async operations
- Loading/error states tự động
- Retry mechanism

**Tại sao tạo ra:**
- Handle API calls với loading states
- Error handling tự động
- Retry failed requests

**Tại sao KHÔNG dùng:**
- ✅ Project dùng **@tanstack/react-query**
- ✅ `useQuery` và `useMutation` đã cover mọi use case
- ✅ Better caching, retry, stale data handling

**Ví dụ thay thế:**
```javascript
// ❌ Không dùng useAsync
const { data, loading, error } = useAsync(fetchData);

// ✅ Dùng react-query
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData
});
```

**Verdict:** 🗑️ **XÓA** - React Query thay thế hoàn toàn

---

### 7. `useVirtualizer` (Lines 189-234)

**Mục đích ban đầu:**
- Hook render large lists efficiently
- Virtual scrolling cho performance
- Windowing technique

**Tại sao tạo ra:**
- Manga grid có thể có 1000+ items
- Performance issue khi render all
- Smooth scrolling với large datasets

**Tại sao KHÔNG dùng:**
- ✅ Project dùng **simple pagination**
- ✅ `PAGINATION.FOLDERS_PER_PAGE = 24` items per page
- ✅ Không cần virtual scroll với pagination
- ✅ Nếu cần có library: `react-virtualized`, `react-window`

**Ví dụ hiện tại:**
```javascript
// ✅ Dùng pagination thay vì virtual scroll
const { currentPage, goToPage } = usePagination(totalItems, 24);
const displayItems = allItems.slice(startIndex, endIndex);
```

**Verdict:** 🗑️ **XÓA** - Pagination đủ tốt, không cần virtual scroll

---

## 📊 TỔNG KẾT

### Hooks Đang Dùng (7/14) ✅

| Hook | Usage | Status |
|------|-------|--------|
| `useRandomItems` | ✅ RandomSlider | KEEP |
| `useRecentItems` | ✅ RecentSlider | KEEP |
| `useRecentManager` | ✅ Multiple pages | KEEP |
| `useServiceWorker` | ✅ ServiceWorkerStatus | KEEP |
| `useDebounceValue` | ✅ Search functionality | KEEP |
| `usePagination` | ✅ Multiple pages | KEEP |

### Hooks Không Dùng (7/14) ❌

| Hook | Lý do không dùng | Thay thế bằng | Action |
|------|------------------|---------------|--------|
| `useLocalStorage` | Zustand persist | Zustand store | 🗑️ DELETE |
| `useIntersectionObserver` | Library tốt hơn | LazyLoadImage | 🗑️ DELETE |
| `useMediaQuery` | Tailwind CSS | Responsive classes | ⚠️ MAYBE |
| `useClickOutside` | Modal library | Modal props | 🗑️ DELETE |
| `useKeyPress` | Inline logic | Direct handlers | ⚠️ MAYBE |
| `useAsync` | React Query | useQuery/useMutation | 🗑️ DELETE |
| `useVirtualizer` | Pagination | usePagination | 🗑️ DELETE |

---

## 🎯 KẾT LUẬN & ĐỀ XUẤT

### 1. XÓA NGAY (5 hooks - 100% chắc chắn)

✅ **Xóa các hooks sau vì đã có giải pháp tốt hơn:**

```javascript
// 🗑️ DELETE THESE
export const useLocalStorage = ...    // → Zustand persist
export const useIntersectionObserver = ... // → LazyLoadImage
export const useClickOutside = ...     // → Modal props
export const useAsync = ...            // → React Query
export const useVirtualizer = ...      // → Pagination
```

**Lý do:**
- Không được dùng ở bất kỳ đâu
- Có giải pháp thay thế tốt hơn
- Làm tăng bundle size vô ích
- Gây confusion cho developers

---

### 2. CÂN NHẮC GIỮ LẠI (2 hooks - có thể hữu ích)

⚠️ **Có thể giữ với comment "Reserved for future use":**

```javascript
// ⚠️ MAYBE KEEP (with comment)

// useMediaQuery - Reserved for advanced responsive features
// Currently using Tailwind, but may need JS-based detection later
export const useMediaQuery = (query) => { ... }

// useKeyPress - Reserved for keyboard shortcuts
// Currently using inline handlers, but may need unified shortcuts later
export const useKeyPress = (targetKey, handler) => { ... }
```

**Lý do giữ:**
- `useMediaQuery`: Có thể cần check device type trong JS logic
- `useKeyPress`: Có thể cần unified keyboard shortcuts system

**Lý do xóa:**
- Hiện tại KHÔNG dùng
- Có thể implement lại khi cần
- Git history vẫn lưu code

---

### 3. ĐỀ XUẤT CUỐI CÙNG

#### Option A: XÓA TẤT CẢ 7 HOOKS (Recommended) ✅

**Ưu điểm:**
- Clean code, không còn dead code
- Giảm ~200 lines unused code
- Giảm bundle size
- Code dễ maintain hơn

**Nhược điểm:**
- Nếu cần sau này phải implement lại
- Mất ~30 phút công implement

**Verdict:** ✅ **RECOMMEND** - Git lưu history, implement lại không khó

---

#### Option B: GIỮ 2 HOOKS với Comment (Alternative)

**Giữ lại:**
- `useMediaQuery` - có thể cần cho responsive logic
- `useKeyPress` - có thể cần cho keyboard shortcuts

**Xóa:**
- 5 hooks còn lại (có thay thế rõ ràng)

**Code after cleanup:**
```javascript
// 📁 src/hooks/index.js
// 🎣 Custom hooks

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { SEARCH } from '@/constants';

// Export specialized hooks
export { default as useRandomItems } from './useRandomItems';
export { default as useRecentItems } from './useRecentItems';
export { default as useRecentManager } from './useRecentManager';
export { default as useServiceWorker } from './useServiceWorker';

// useDebounceValue hook
export const useDebounceValue = (value, delay = SEARCH.SEARCH_DEBOUNCE) => {
  const [debouncedValue] = useDebounce(value, delay);
  return debouncedValue;
};

// usePagination hook
export const usePagination = (totalItems, itemsPerPage) => {
  // ... existing code
};

// ⚠️ RESERVED FOR FUTURE USE - May need for advanced responsive features
// Currently using Tailwind classes, but keeping for potential JS-based detection
export const useMediaQuery = (query) => {
  // ... existing code
};

// ⚠️ RESERVED FOR FUTURE USE - May need for unified keyboard shortcuts
// Currently using inline handlers, but keeping for potential shortcuts system
export const useKeyPress = (targetKey, handler) => {
  // ... existing code
};
```

---

## 📝 IMPLEMENTATION PLAN

### Step 1: Backup

```bash
git checkout -b cleanup/remove-unused-hooks
git add src/hooks/index.js
git commit -m "backup: hooks before cleanup"
```

### Step 2: Remove Unused Hooks

**Option A - Xóa tất cả 7 hooks:**
```javascript
// Xóa lines 14-36 (useLocalStorage)
// Xóa lines 45-66 (useIntersectionObserver)
// Xóa lines 68-85 (useMediaQuery)
// Xóa lines 87-103 (useClickOutside)
// Xóa lines 105-117 (useKeyPress)
// Xóa lines 119-148 (useAsync)
// Xóa lines 189-234 (useVirtualizer)
```

**Option B - Giữ 2 hooks:**
```javascript
// Xóa lines 14-36 (useLocalStorage)
// Xóa lines 45-66 (useIntersectionObserver)
// GIỮ lines 68-85 (useMediaQuery) + thêm comment
// Xóa lines 87-103 (useClickOutside)
// GIỮ lines 105-117 (useKeyPress) + thêm comment
// Xóa lines 119-148 (useAsync)
// Xóa lines 189-234 (useVirtualizer)
```

### Step 3: Test

```bash
# Build test
npm run build

# Check imports
npm run lint

# Runtime test
npm run dev
# → Navigate through app, ensure no errors
```

### Step 4: Commit

```bash
git add src/hooks/index.js
git commit -m "refactor: remove unused hooks (7 hooks, ~200 lines)

- Remove useLocalStorage (replaced by Zustand persist)
- Remove useIntersectionObserver (replaced by LazyLoadImage)
- Remove useClickOutside (replaced by Modal props)
- Remove useAsync (replaced by React Query)
- Remove useVirtualizer (using pagination instead)
[Optional: - Keep useMediaQuery and useKeyPress for future use]

Reduces bundle size and improves code maintainability.
Dead code found in code analysis on 2025-10-05."
```

---

## 📈 IMPACT ANALYSIS

### Before Cleanup

```javascript
// File: src/hooks/index.js
// Lines: 234
// Hooks: 14 (7 used, 7 unused)
// Dead code: ~200 lines (85%)
```

### After Cleanup (Option A)

```javascript
// File: src/hooks/index.js
// Lines: ~80
// Hooks: 7 (all used)
// Dead code: 0 lines (0%)
// Lines saved: ~154 lines
```

### After Cleanup (Option B)

```javascript
// File: src/hooks/index.js  
// Lines: ~140
// Hooks: 9 (7 used, 2 reserved)
// Dead code: ~60 lines (43%)
// Lines saved: ~94 lines
```

---

## ✅ FINAL RECOMMENDATION

### ĐỀ XUẤT: **Option A - XÓA TẤT CẢ 7 HOOKS**

**Lý do:**
1. ✅ **Không ai dùng** - 0 imports found
2. ✅ **Có thay thế tốt hơn** - Zustand, React Query, Libraries
3. ✅ **Giảm complexity** - Ít code hơn, dễ maintain hơn
4. ✅ **Git lưu history** - Có thể restore khi cần
5. ✅ **Easy to reimplement** - Không khó implement lại

**Next Steps:**
1. Review report này
2. Confirm với team
3. Implement cleanup theo Step-by-step plan
4. Test thoroughly
5. Commit và update CHANGELOG

---

**Report By:** Code Analysis  
**Date:** 2025-10-05  
**Status:** ✅ READY FOR CLEANUP  
**Recommendation:** 🗑️ DELETE ALL 7 UNUSED HOOKS
