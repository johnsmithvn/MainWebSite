# Settings.jsx Split Plan

## Current Structure Analysis (1,456 lines)

### Imports & Setup (Lines 1-50)
- React imports
- Icon imports from lucide-react
- Store hooks (useUIStore, useAuthStore, useMangaStore, useMovieStore, useMusicStore, useSharedSettingsStore)
- Utility imports (cache, browser support, database operations)
- Component imports (Button, DatabaseActions, Modal)

### Cache Clear Handlers (Lines 51-462)
#### Manga Cache (Lines 51-230)
- handleClearMangaCurrentRoot
- handleClearMangaCurrentSource  
- handleClearMangaSourceAndStorage
- handleClearMangaAllSourcesAndStorage

#### Movie Cache (Lines 230-346)
- handleClearMovieCurrentSource
- handleClearMovieSourceAndStorage
- handleClearMovieAllSourcesAndStorage

#### Music Cache (Lines 346-462)
- handleClearMusicCurrentSource
- handleClearMusicSourceAndStorage
- handleClearMusicAllSourcesAndStorage

### App Management (Lines 462-512)
- handleExportSettings
- handleImportSettings  
- handleResetApp

### Database Operations (Lines 512-1330)
Uses createMediaHandlers utility:
- mangaHandlers (scan, delete, reset, scanAndDelete)
- movieHandlers (scan, delete, reset, scanAndDelete)
- musicHandlers (scan, delete, reset, scanAndDelete)

### JSX Layout (Lines 1330-1454)
- Tab navigation (mobile + desktop)
- Content rendering per tab
- Modal component

## Split Strategy

### File 1: AppearanceSettings.jsx (~120 lines)
**Content:**
- Dark mode toggle
- Animations toggle
- Language select
- UI customization

**Dependencies:**
- useUIStore
- SettingSection
- SettingItem

### File 2: MangaSettings.jsx (~280 lines)
**Content:**
- Manga database operations (scan, delete, reset)
- Manga cache clear handlers (4 functions)
- Reader settings
- Manga-specific settings

**Dependencies:**
- useMangaStore, useAuthStore
- createMediaHandlers
- Cache utilities
- SettingSection, DatabaseActions

### File 3: MovieSettings.jsx (~250 lines)
**Content:**
- Movie database operations
- Movie cache clear handlers (3 functions)
- Player settings

**Dependencies:**
- useMovieStore, useAuthStore
- createMediaHandlers
- Cache utilities
- SettingSection, DatabaseActions

### File 4: MusicSettings.jsx (~250 lines)
**Content:**
- Music database operations
- Music cache clear handlers (3 functions)
- Player settings

**Dependencies:**
- useMusicStore, useAuthStore
- createMediaHandlers
- Cache utilities
- SettingSection, DatabaseActions

### File 5: OfflineSettings.jsx (~300 lines)
**Content:**
- Offline library management
- Storage quota info
- Service worker status
- Downloaded content

**Dependencies:**
- Offline utilities
- Storage quota utilities
- SettingSection

### File 6: index.jsx (~200 lines)
**Content:**
- Main layout with tab navigation
- Quick actions sidebar (export/import/reset)
- Tab routing logic
- Import all setting pages

**Dependencies:**
- All setting page components
- Tab configuration
- Modal hook

### Shared Components (~140 lines total)
- SettingSection.jsx (40 lines) ✅ DONE
- SettingItem.jsx (40 lines) ✅ DONE
- CacheActionButtons.jsx (60 lines) - TODO

## Execution Order
1. ✅ Create folder structure
2. ✅ Create SettingSection component
3. ✅ Create SettingItem component
4. Create CacheActionButtons component
5. Create AppearanceSettings.jsx
6. Create MangaSettings.jsx
7. Create MovieSettings.jsx
8. Create MusicSettings.jsx
9. Create OfflineSettings.jsx
10. Create settings/index.jsx
11. Update imports in other files
12. Backup & replace Settings.jsx

## Expected Benefits
- **Maintainability:** 1,456 lines → avg 220 lines/file (84% reduction per file)
- **Reusability:** Shared components eliminate duplication
- **Testability:** Each settings page can be tested independently
- **Performance:** Lazy loading potential for each tab
- **Developer Experience:** Easy to find and edit specific settings
