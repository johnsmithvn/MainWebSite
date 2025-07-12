# 📊 Constants Structure

## 🎯 Cấu trúc Constants

### Tách biệt theo chức năng:

```
📁 shared/constants/
├── 📄 index.js          # Main entry point
├── ⏰ timing.js         # Timing constants (20s auto-scroll, 3s toast, etc.)
├── 📊 limits.js         # Size & limits (search limit 50, 400 images/page, etc.)
├── 🎨 ui.js             # UI styles (z-index, colors, fonts, etc.)
├── 🌐 server.js         # Server constants (HTTP codes, security, etc.)
└── 🔄 cache.js          # Cache constants (expiry, prefixes, strategies)

📄 shared/constants.js   # Compatibility layer - re-exports everything
```

## 🔗 Import Usage

### Frontend (ES Modules):
```javascript
// Option 1: Import specific constants
import { TIMING, LIMITS } from '/shared/constants.js';

// Option 2: Import from specific files
import { TIMING } from '/shared/constants/timing.js';
import { LIMITS } from '/shared/constants/limits.js';

// Use constants
setTimeout(() => {}, TIMING.TOAST_TIMEOUT); // 3000ms
const limit = LIMITS.SEARCH_LIMIT; // 50
```

### Backend (CommonJS):
```javascript
// Import from main file
const { TIMING, LIMITS, SERVER } = require('../shared/constants.js');

// Use constants
const port = process.env.PORT || 3000; // ENV takes priority
res.status(SERVER.HTTP_STATUS.BAD_REQUEST).json({...});
```

## 📝 Key Constants

### ⏰ TIMING:
- `AUTO_SCROLL_INTERVAL`: **20000ms** (20s) - Banner auto-scroll
- `TOAST_TIMEOUT`: **3000ms** (3s) - Toast notification
- `UI_INDICATOR_TIMEOUT`: **5000ms** (5s) - UI indicator removal
- `TOKEN_EXPIRY`: **24h** - Authentication token

### 📊 LIMITS:
- `SEARCH_LIMIT`: **50** - Search results per request
- `IMAGES_PER_PAGE`: **400** - Images per manga page
- `MOBILE_BREAKPOINT`: **480px** - Mobile responsive breakpoint
- `MAX_FILE_SIZE`: **500MB** - Maximum file size
- `CACHE_CLEANUP_THRESHOLD`: **50MB** - Cache cleanup trigger

### 🎨 UI_STYLES:
- `Z_INDEX.TOAST`: **9999** - Toast notifications
- `Z_INDEX.MODAL`: **99999** - Modal dialogs
- `Z_INDEX.OVERLAY`: **110000** - Full screen overlays
- `COLORS.TOAST_BACKGROUND`: **#333** - Toast background

### 🌐 SERVER:
- `HTTP_STATUS.*`: HTTP status codes (200, 400, 404, 500, etc.)
- `SECURITY.ALLOWED_HOSTS`: ['localhost', '127.0.0.1']
- `TIMEOUTS.REQUEST`: **30s** - Request timeout

### 🔄 CACHE:
- `EXPIRY.WEEK`: **7 days** - Long-term cache
- `PREFIXES.*`: Cache key prefixes to avoid conflicts
- `STRATEGY.*`: Cache strategies (cacheFirst, networkFirst, etc.)

## 🚫 What's NOT in constants:

- **Environment variables** (.env) - Keep using `process.env.PORT`, etc.
- **Dynamic values** - Runtime computed values
- **User settings** - User-configurable preferences
- **API keys/secrets** - Security-sensitive data

## ✅ Benefits:

- 🎯 **Single source of truth** - All timing/limits in one place
- 🔧 **Easy maintenance** - Change values in one location
- 📂 **Organized** - Grouped by functionality
- 🔄 **Compatible** - Works with both frontend & backend
- 📖 **Documented** - Comments explain each constant
- 🚀 **Performance** - No runtime computation for static values
