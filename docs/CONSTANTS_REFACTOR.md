# 📊 Constants Structure - Updated

## 🎯 Overview
Dự án đã được refactor để tách riêng constants cho backend và frontend, tối ưu hóa performance và maintainability.

## 📁 New Structure

### Backend Constants (CommonJS)
```
backend/constants/
├── timing.js      # Server timing constants
├── limits.js      # Backend limits and sizes
├── server.js      # Server configuration
├── cache.js       # Backend cache settings
├── database.js    # Database configuration
└── index.js       # Main entry point
```

### Frontend Constants (ES Modules)
```
frontend/constants/
├── timing.js      # UI timing and animations
├── limits.js      # Frontend limits and breakpoints
├── ui.js          # UI styling constants
├── cache.js       # Frontend cache settings
└── index.js       # Main entry point
```

## 🔧 Usage Examples

### Backend Usage (CommonJS)
```javascript
// Import all constants
const { TIMING, SERVER, LIMITS } = require('./constants');

// Or import specific files
const TIMING = require('./constants/timing');
const SERVER = require('./constants/server');

// Usage
app.listen(process.env.PORT || 3000);
res.status(SERVER.HTTP_STATUS.OK).json({ success: true });
setTimeout(cleanup, TIMING.CACHE_CLEANUP_INTERVAL);
```

### Frontend Usage (ES Modules)
```javascript
// Import all constants
import { TIMING, LIMITS, UI } from '/frontend/constants/index.js';

// Or import specific files
import { TIMING } from '/frontend/constants/timing.js';
import { UI } from '/frontend/constants/ui.js';

// Usage
setTimeout(showToast, TIMING.TOAST_TIMEOUT);
element.style.zIndex = UI.Z_INDEX.MODAL;
if (window.innerWidth <= LIMITS.MOBILE_BREAKPOINT) { /* mobile */ }
```

## 🎨 Key Benefits

1. **Separation of Concerns**: Backend và frontend có constants riêng biệt
2. **Performance**: Không load constants không cần thiết
3. **Tree Shaking**: Frontend có thể tree-shake unused constants
4. **Module System**: Rõ ràng về CommonJS vs ES Modules
5. **Maintainability**: Dễ dàng thay đổi và maintain
6. **No Magic Numbers**: Loại bỏ hardcoded values

## 📋 Migration Completed

### Files Updated
- ✅ All backend API files now use `backend/constants`
- ✅ All frontend files now use `frontend/constants`
- ✅ Removed old `shared/constants` files
- ✅ Updated middleware and utilities
- ✅ Fixed all import paths

### Magic Numbers Eliminated
- ✅ HTTP status codes → `SERVER.HTTP_STATUS`
- ✅ Timeouts → `TIMING.REQUEST_TIMEOUT`
- ✅ Cache sizes → `LIMITS.MAX_CACHE_SIZE`
- ✅ UI breakpoints → `LIMITS.MOBILE_BREAKPOINT`
- ✅ Animation durations → `TIMING.ANIMATION_DURATION`

## 🛠️ Adding New Constants

### Backend
1. Add to appropriate file in `backend/constants/`
2. Export from `backend/constants/index.js`
3. Use CommonJS syntax: `module.exports = { ... }`

### Frontend
1. Add to appropriate file in `frontend/constants/`
2. Export from `frontend/constants/index.js`
3. Use ES Module syntax: `export const { ... }`

## 🧪 Current State

### Backend Constants
- `TIMING` - Server timing, cache cleanup, timeouts
- `LIMITS` - File sizes, database limits, batch sizes
- `SERVER` - HTTP status codes, CORS, security settings
- `CACHE` - Cache expiry, cleanup settings, prefixes
- `DATABASE` - SQLite settings, table names, indexes

### Frontend Constants
- `TIMING` - UI animations, user interactions, auto-scroll
- `LIMITS` - Breakpoints, UI limits, pagination
- `UI` - Colors, typography, spacing, shadows
- `CACHE` - Frontend cache settings, storage limits
- `PERFORMANCE` - Lazy loading, virtual scrolling

## 🔧 Clear Separation Between Backend & Frontend

### ✅ Backend Constants (Server-Side Only)
- **Database operations**: Connection limits, query timeouts, batch sizes
- **File system**: Server file size limits, path lengths, memory usage
- **Server operations**: HTTP status codes, CORS settings, rate limiting
- **Server-side cache**: File caching, database cache, cleanup intervals

### ✅ Frontend Constants (Client-Side Only)
- **UI components**: Colors, typography, spacing, animations
- **User interactions**: Click delays, hover effects, debounce timings
- **Client-side limits**: Display pagination, search results, UI constraints
- **Client-side cache**: Browser storage limits, cache cleanup thresholds

### ❌ No More Duplication
- Removed duplicate constants between backend and frontend
- Each environment has its own specific constants
- No shared constants that caused confusion

## 📊 Benefits Achieved

1. **No Shared Dependencies**: Frontend và backend hoàn toàn độc lập
2. **Better Performance**: Mỗi environment chỉ load constants cần thiết
3. **Cleaner Code**: Không còn magic numbers
4. **Easier Maintenance**: Thay đổi constants ở một nơi
5. **Type Safety**: Rõ ràng về module system và exports
