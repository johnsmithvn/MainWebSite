---
applyTo: '**'
---
#  Instructions for MainWebSite
#### Quy trình bắt buộc:
1. **Trước khi fix/sửa**: Ghi nhận vấn đề trong CHANGELOG.md dưới mục `[Unreleased]`
2. **Sau khi fix/sửa**: Cập nhật CHANGELOG.md với chi tiết thay đổi
3. **Khi release**: Di chuyển từ `[Unreleased]` sang version mới

#### Format changelog entry:
```markdown
### Fixed
- 🐛 [YYYY-MM-DD] Fixed [mô tả vấn đề] → [giải pháp]

### Added  
- ✨ [YYYY-MM-DD] Added [tính năng mới] - [mô tả chi tiết]

### Changed
- 🔄 [YYYY-MM-DD] Changed [thay đổi gì] - [lý do]

### Removed
- 🗑️ [YYYY-MM-DD] Removed [xóa gì] - [lý do]
```
**QUAN TRỌNG**: Không cần Kiểm tra terminal và dự án hiện tại có đang chạy hay không, vì server luôn chạy nền, không cần khởi động lại.
**QUAN TRỌNG**: Mỗi khi thực hiện fix bug, thêm feature, hoặc sửa đổi code, PHẢI cập nhật CHANGELOG.md
**QUAN TRỌNG**: user sẽ là người test, không được tự ý tạo file test, debug, backup , và luôn nhớ là sever đang chạy , k cần chạy lại

## Project Architecture Overview

- **Monorepo Structure:**
  - `backend/`: Node.js Express server, REST APIs for manga, movie, music, and system modules. Organized by domain (e.g., `api/manga/`, `api/movie/`, etc.).
  - `frontend/`: Static HTML, JS, and React app (in `react-app/`). Uses constants for configuration and UI logic. Documentation in `frontend/docs/`.
  - `react-app/`: Vite + React + TailwindCSS. Entry: `src/main.jsx`, main app: `src/App.jsx`.
  - it use 2 frontend for project: `react-app/` for main app and `frontend/` for static assets.
  - `frontend/`: Contains static assets like HTML, CSS, and images. => this is full function
  - `react-app/`: Contains the main application code, including React components and state management. => this is refactored , update for better performance and maintainability from `frontend/`

## Key Conventions & Patterns

- **Constants (Static Config):**
  - All static UI and config constants are centralized in `frontend/src/constants.js` (legacy) and maintained in `react-app/src/constants/`.
  - These include fixed values such as pagination defaults, preload counts, API route keys, etc.
  - Always import from `constants` module for consistency and maintainability.

- **Settings (Dynamic Config):**
  - Runtime-adjustable settings are stored in **Zustand stores** (e.g. `useUIStore`, `useMangaStore`, `useMusicStore`).
  - Examples: dark mode flag, manga reader mode, items per page, music player UI variant.
  - A dedicated **Settings Page** (`/settings`) allows users to modify these values, which update the store and persist via localStorage.

- **API Design:**
  - RESTful endpoints grouped by domain (e.g., `/api/manga/scan`, `/api/movie/favorite-movie.js`).
  - Middleware in `backend/middleware/` handles auth, error handling, rate limiting, and security.

- **Frontend Architecture:**
  - Legacy static HTML lives in `frontend/public/` (reference only).
  - The React SPA lives in `react-app/src/`, organized by feature: `pages/`, `components/`, `store/`, `utils/`.
  - Use **TailwindCSS** for styling (`react-app/tailwind.config.js`).

- **Documentation:**
  - All migration, architecture, and usage docs are in `frontend/docs/`.
  - Read `CONSTANTS-MIGRATION.md` for how constants were migrated.
  - Read `CONSTANTS-ANALYSIS.md` for architectural decisions.

## Integration Points

- **Database:**
  - SQLite DB files in `backend/data/` (e.g., `M_MUSIC.db`).
  - Access via custom DB manager in `backend/utils/DatabaseManager.js`.
- **Cross-component Communication:**
  - Frontend calls backend REST APIs for data (no GraphQL or WebSocket detected).
  - Use fetch/axios in React for API calls.
- **State Management:**
  - React app uses Context API and hooks for state management.
  - Global state is managed in `react-app/src/store/`.


  ## Output Format
- Write explanations and steps in **Vietnamese**.  
- Output **entire changed files** in fenced code blocks.  
- Include the updated section of **CHANGELOG.md** in a fenced block.  
- If missing context, **explicitly list required files** and stop.

Project structure:

📦MainWebSite
 ┣ 📂backend
 ┃ ┣ 📂api
 ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┣ 📜favorite.js
 ┃ ┃ ┃ ┣ 📜folder-cache.js
 ┃ ┃ ┃ ┣ 📜reset-cache.js
 ┃ ┃ ┃ ┣ 📜root-thumbnail.js
 ┃ ┃ ┃ ┗ 📜scan.js
 ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┣ 📜extract-movie-thumbnail.js
 ┃ ┃ ┃ ┣ 📜favorite-movie.js
 ┃ ┃ ┃ ┣ 📜movie-folder-empty.js
 ┃ ┃ ┃ ┣ 📜movie-folder.js
 ┃ ┃ ┃ ┣ 📜reset-movie-db.js
 ┃ ┃ ┃ ┣ 📜scan-movie.js
 ┃ ┃ ┃ ┣ 📜set-thumbnail.js
 ┃ ┃ ┃ ┣ 📜video-cache.js
 ┃ ┃ ┃ ┗ 📜video.js
 ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┣ 📜audio-cache.js
 ┃ ┃ ┃ ┣ 📜audio.js
 ┃ ┃ ┃ ┣ 📜extract-thumbnail.js
 ┃ ┃ ┃ ┣ 📜music-folder.js
 ┃ ┃ ┃ ┣ 📜music-meta.js
 ┃ ┃ ┃ ┣ 📜playlist.js
 ┃ ┃ ┃ ┣ 📜reset-music-db.js
 ┃ ┃ ┃ ┣ 📜scan-music.js
 ┃ ┃ ┃ ┗ 📜set-thumbnail.js
 ┃ ┃ ┣ 📜increase-view.js
 ┃ ┃ ┗ 📜log.js
 ┃ ┣ 📂data
 ┃ ┃ ┣ 📜.gitkeep
 ┃ ┃ ┣ 📜M_MUSIC.db
 ┃ ┃ ┣ 📜ROOT_DOW.db
 ┃ ┃ ┣ 📜ROOT_FANTASY.db
 ┃ ┃ ┣ 📜ROOT_MANGAH.db
 ┃ ┃ ┣ 📜ROOT_TEST.db
 ┃ ┃ ┣ 📜V_ANIME.db
 ┃ ┃ ┣ 📜V_ANIMEH.db
 ┃ ┃ ┣ 📜V_JAVA.db
 ┃ ┃ ┗ 📜V_MOVIE.db
 ┃ ┣ 📂logs
 ┃ ┣ 📂middleware
 ┃ ┃ ┣ 📜auth.js
 ┃ ┃ ┣ 📜cors.js
 ┃ ┃ ┣ 📜errorHandler.js
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜rateLimiter.js
 ┃ ┃ ┗ 📜security.js
 ┃ ┣ 📂node_modules
 ┃ ┣ 📂routes
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜manga.js
 ┃ ┃ ┣ 📜movie.js
 ┃ ┃ ┣ 📜music.js
 ┃ ┃ ┗ 📜system.js
 ┃ ┣ 📂services
 ┃ ┃ ┗ 📜MediaService.js
 ┃ ┣ 📂utils
 ┃ ┃ ┣ 📜cache-scan.js
 ┃ ┃ ┣ 📜config.js
 ┃ ┃ ┣ 📜corsUtils.js
 ┃ ┃ ┣ 📜DatabaseManager.js
 ┃ ┃ ┣ 📜databaseUtils.js
 ┃ ┃ ┣ 📜db.js
 ┃ ┃ ┣ 📜folder-loader.js
 ┃ ┃ ┣ 📜imageUtils.js
 ┃ ┃ ┣ 📜movie-scan.js
 ┃ ┃ ┣ 📜music-scan.js
 ┃ ┃ ┣ 📜responseHelpers.js
 ┃ ┃ ┣ 📜stringUtils.js
 ┃ ┃ ┗ 📜thumbnailUtils.js
 ┃ ┣ 📜.env
 ┃ ┣ 📜.env.template
 ┃ ┣ 📜constants.js
 ┃ ┣ 📜package.json
 ┃ ┗ 📜server.js
 ┣ 📂config
 ┣ 📂docs
 ┃ ┣ 📜BACKEND-ANALYSIS.md
 ┃ ┣ 📜FRONTEND_V1-ANALYSIS.md
 ┃ ┗ 📜FRONTEND_V2-ANALYSIS.md
 ┣ 📂frontend
 ┃ ┣ 📂docs
 ┃ ┃ ┣ 📜CONSTANTS-ANALYSIS.md
 ┃ ┃ ┣ 📜CONSTANTS-MIGRATION-SUMMARY.md
 ┃ ┃ ┣ 📜CONSTANTS-MIGRATION.md
 ┃ ┃ ┣ 📜FINAL-SUMMARY.md
 ┃ ┃ ┣ 📜PROJECT-INDEX.md
 ┃ ┃ ┗ 📜README.md
 ┃ ┣ 📂public
 ┃ ┃ ┣ 📂default
 ┃ ┃ ┃ ┣ 📜default-cover.jpg
 ┃ ┃ ┃ ┣ 📜favicon.png
 ┃ ┃ ┃ ┣ 📜folder-thumb.png
 ┃ ┃ ┃ ┣ 📜music-thumb.png
 ┃ ┃ ┃ ┗ 📜video-thumb.png
 ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┣ 📜favorites.html
 ┃ ┃ ┃ ┣ 📜index.html
 ┃ ┃ ┃ ┣ 📜reader.html
 ┃ ┃ ┃ ┗ 📜select.html
 ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┣ 📜favorites.html
 ┃ ┃ ┃ ┣ 📜index.html
 ┃ ┃ ┃ ┗ 📜player.html
 ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┣ 📜index.html
 ┃ ┃ ┃ ┗ 📜player.html
 ┃ ┃ ┗ 📜home.html
 ┃ ┣ 📂src
 ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┗ 📜movieCard.js
 ┃ ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┃ ┣ 📜musicCard.js
 ┃ ┃ ┃ ┃ ┗ 📜playlistMenu.js
 ┃ ┃ ┃ ┣ 📜folderCard.js
 ┃ ┃ ┃ ┣ 📜folderSlider.js
 ┃ ┃ ┃ ┗ 📜readerSettingsModal.js
 ┃ ┃ ┣ 📂core
 ┃ ┃ ┃ ┣ 📂reader
 ┃ ┃ ┃ ┃ ┣ 📜horizontal.js
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┣ 📜scroll.js
 ┃ ┃ ┃ ┃ ┗ 📜utils.js
 ┃ ┃ ┃ ┣ 📜events.js
 ┃ ┃ ┃ ┣ 📜folder.js
 ┃ ┃ ┃ ┣ 📜mangaSettings.js
 ┃ ┃ ┃ ┣ 📜preload.js
 ┃ ┃ ┃ ┣ 📜security.js
 ┃ ┃ ┃ ┣ 📜storage.js
 ┃ ┃ ┃ ┗ 📜ui.js
 ┃ ┃ ┣ 📂pages
 ┃ ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┃ ┣ 📜favorites.js
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┗ 📜reader.js
 ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┣ 📜favorites.js
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┗ 📜player.js
 ┃ ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┗ 📜player.js
 ┃ ┃ ┃ ┣ 📜home.js
 ┃ ┃ ┃ ┗ 📜select.js
 ┃ ┃ ┣ 📂styles
 ┃ ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┃ ┗ 📜movie-card.css
 ┃ ┃ ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┃ ┃ ┣ 📜music-card.css
 ┃ ┃ ┃ ┃ ┃ ┗ 📜play-list-popup.css
 ┃ ┃ ┃ ┃ ┣ 📜folder-card.css
 ┃ ┃ ┃ ┃ ┣ 📜folder-slider.css
 ┃ ┃ ┃ ┃ ┗ 📜readerSettingsModal.css
 ┃ ┃ ┃ ┣ 📂dark
 ┃ ┃ ┃ ┃ ┣ 📜home-dark.css
 ┃ ┃ ┃ ┃ ┗ 📜reader-dark.css
 ┃ ┃ ┃ ┣ 📂pages
 ┃ ┃ ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┃ ┃ ┣ 📜favorites.css
 ┃ ┃ ┃ ┃ ┃ ┣ 📜index.css
 ┃ ┃ ┃ ┃ ┃ ┗ 📜reader.css
 ┃ ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┃ ┣ 📜favorites.css
 ┃ ┃ ┃ ┃ ┃ ┣ 📜index.css
 ┃ ┃ ┃ ┃ ┃ ┗ 📜player.css
 ┃ ┃ ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┃ ┃ ┣ 📜index.css
 ┃ ┃ ┃ ┃ ┃ ┗ 📜player.css
 ┃ ┃ ┃ ┃ ┣ 📜home.css
 ┃ ┃ ┃ ┃ ┗ 📜select.css
 ┃ ┃ ┃ ┗ 📜base.css
 ┃ ┃ ┗ 📜constants.js
 ┃ ┗ 📂styles
 ┃ ┃ ┗ 📂components
 ┃ ┃ ┃ ┗ 📜readerSettingsModal.css
 ┣ 📂react-app
 ┃ ┣ 📂docs
 ┃ ┃ ┣ 📜ARCHITECTURE.md
 ┃ ┃ ┣ 📜DATA_FLOW.md
 ┃ ┃ ┣ 📜README.md
 ┃ ┃ ┣ 📜SERVICE-WORKER-ANALYSIS.md
 ┃ ┃ ┣ 📜STORAGE-QUOTA-MANAGEMENT.md
 ┃ ┃ ┗ 📜UI_UX_OVERVIEW.md
 ┃ ┣ 📂public
 ┃ ┃ ┣ 📂default
 ┃ ┃ ┃ ┣ 📜default-cover.jpg
 ┃ ┃ ┃ ┣ 📜favicon.png
 ┃ ┃ ┃ ┣ 📜folder-thumb.png
 ┃ ┃ ┃ ┣ 📜music-thumb.png
 ┃ ┃ ┃ ┗ 📜video-thumb.png
 ┃ ┃ ┣ 📜favicon.ico
 ┃ ┃ ┣ 📜favicon.svg
 ┃ ┃ ┣ 📜manifest.webmanifest
 ┃ ┃ ┣ 📜offline.html
 ┃ ┃ ┗ 📜sw.js
 ┃ ┣ 📂src
 ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┣ 📂auth
 ┃ ┃ ┃ ┃ ┗ 📜LoginModal.jsx
 ┃ ┃ ┃ ┣ 📂common
 ┃ ┃ ┃ ┃ ┣ 📜Breadcrumb.jsx
 ┃ ┃ ┃ ┃ ┣ 📜BrowserSupportStatus.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Button.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DatabaseActions.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DownloadProgressModal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Header.jsx
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┣ 📜Layout.jsx
 ┃ ┃ ┃ ┃ ┣ 📜LoadingOverlay.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Modal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Pagination.jsx
 ┃ ┃ ┃ ┃ ┣ 📜RandomSlider.jsx
 ┃ ┃ ┃ ┃ ┣ 📜RecentSlider.jsx
 ┃ ┃ ┃ ┃ ┣ 📜SearchModal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜ServiceWorkerStatus.jsx
 ┃ ┃ ┃ ┃ ┣ 📜SettingsModal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Sidebar.jsx
 ┃ ┃ ┃ ┃ ┣ 📜StorageQuotaModal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜Toast.jsx
 ┃ ┃ ┃ ┃ ┣ 📜TopViewSlider.jsx
 ┃ ┃ ┃ ┃ ┗ 📜UniversalCard.jsx
 ┃ ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┣ 📜MangaCard.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MangaRandomSection.jsx
 ┃ ┃ ┃ ┃ ┗ 📜ReaderHeader.jsx
 ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┣ 📜MovieCard.jsx
 ┃ ┃ ┃ ┃ ┗ 📜MovieRandomSection.jsx
 ┃ ┃ ┃ ┗ 📂music
 ┃ ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┃ ┣ 📜MusicCard.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MusicRandomSection.jsx
 ┃ ┃ ┃ ┃ ┣ 📜PlayerFooter.jsx
 ┃ ┃ ┃ ┃ ┣ 📜PlayerHeader.jsx
 ┃ ┃ ┃ ┃ ┗ 📜PlaylistModal.jsx
 ┃ ┃ ┣ 📂constants
 ┃ ┃ ┃ ┣ 📜cacheKeys.js
 ┃ ┃ ┃ ┣ 📜colors.js
 ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┣ 📜timeFormats.js
 ┃ ┃ ┃ ┗ 📜uiStyles.js
 ┃ ┃ ┣ 📂hooks
 ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┣ 📜useMovieData.js
 ┃ ┃ ┃ ┣ 📜useMusicData.js
 ┃ ┃ ┃ ┣ 📜useRandomItems.js
 ┃ ┃ ┃ ┣ 📜useRecentItems.js
 ┃ ┃ ┃ ┣ 📜useRecentManager.js
 ┃ ┃ ┃ ┣ 📜useServiceWorker.js
 ┃ ┃ ┃ ┗ 📜useTopViewItems.js
 ┃ ┃ ┣ 📂pages
 ┃ ┃ ┃ ┣ 📂manga
 ┃ ┃ ┃ ┃ ┣ 📜MangaFavorites.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MangaHome.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MangaReader.jsx
 ┃ ┃ ┃ ┃ ┗ 📜MangaSelect.jsx
 ┃ ┃ ┃ ┣ 📂movie
 ┃ ┃ ┃ ┃ ┣ 📜MovieFavorites.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MovieHome.jsx
 ┃ ┃ ┃ ┃ ┗ 📜MoviePlayer.jsx
 ┃ ┃ ┃ ┣ 📂music
 ┃ ┃ ┃ ┃ ┣ 📜MusicHome.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MusicPlayer.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MusicPlayerV2.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MusicPlaylists.jsx
 ┃ ┃ ┃ ┃ ┗ 📜PlaylistDetail.jsx
 ┃ ┃ ┃ ┣ 📜Home.jsx
 ┃ ┃ ┃ ┣ 📜NotFound.jsx
 ┃ ┃ ┃ ┣ 📜OfflineLibrary.jsx
 ┃ ┃ ┃ ┗ 📜Settings.jsx
 ┃ ┃ ┣ 📂store
 ┃ ┃ ┃ ┗ 📜index.js
 ┃ ┃ ┣ 📂styles
 ┃ ┃ ┃ ┗ 📂components
 ┃ ┃ ┃ ┃ ┣ 📜embla.css
 ┃ ┃ ┃ ┃ ┣ 📜index.css
 ┃ ┃ ┃ ┃ ┣ 📜manga-card.css
 ┃ ┃ ┃ ┃ ┣ 📜manga-reader.css
 ┃ ┃ ┃ ┃ ┣ 📜movie-card.css
 ┃ ┃ ┃ ┃ ┣ 📜music-card.css
 ┃ ┃ ┃ ┃ ┣ 📜random-slider.css
 ┃ ┃ ┃ ┃ ┗ 📜reader-header.css
 ┃ ┃ ┣ 📂utils
 ┃ ┃ ┃ ┣ 📜api.js
 ┃ ┃ ┃ ┣ 📜browserSupport.js
 ┃ ┃ ┃ ┣ 📜databaseOperations.js
 ┃ ┃ ┃ ┣ 📜favoriteCache.js
 ┃ ┃ ┃ ┣ 📜formatters.js
 ┃ ┃ ┃ ┣ 📜logger.js
 ┃ ┃ ┃ ┣ 📜mangaCache.js
 ┃ ┃ ┃ ┣ 📜offlineLibrary.js
 ┃ ┃ ┃ ┣ 📜pathUtils.js
 ┃ ┃ ┃ ┣ 📜randomCache.js
 ┃ ┃ ┃ ┣ 📜serviceWorkerManager.js
 ┃ ┃ ┃ ┣ 📜storageQuota.js
 ┃ ┃ ┃ ┗ 📜thumbnailUtils.js
 ┃ ┃ ┣ 📜App.jsx
 ┃ ┃ ┣ 📜main.jsx
 ┃ ┃ ┗ 📜styles.css
 ┃ ┣ 📜.env
 ┃ ┣ 📜.env.template
 ┃ ┣ 📜index.html
 ┃ ┣ 📜package.json
 ┃ ┣ 📜postcss.config.js
 ┃ ┣ 📜tailwind.config.js
 ┃ ┗ 📜vite.config.js
 ┣ 📂scripts
 ┃ ┗ 📜build.js
 ┣ 📂ssl
 ┃ ┣ 📜.gitkeep
 ┃ ┣ 📜certificate.pem
 ┃ ┗ 📜private-key.pem
 ┣ 📜.gitignore
 ┣ 📜CHANGELOG.md
 ┣ 📜package-lock.json
 ┣ 📜package.json
 ┣ 📜Promt.md
 ┗ 📜readme.md