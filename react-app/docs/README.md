# MainWebSite - React

> **Last verified against code:** 2026-11-04. Installation and configuration (Vietnamese): root
> [readme.md](../../readme.md). For a full system overview see
> [docs/SYSTEM-REPORT.md](../../docs/SYSTEM-REPORT.md); known problems are tracked in
> [docs/ISSUES-REPORT.md](../../docs/ISSUES-REPORT.md).

React SPA (PWA) for the MainWebSite personal media server: manga, movies, music and a
Google-Photos-like media gallery served from local disks by the Express backend in `../backend`.

## 🚀 Features

### 📚 Manga
- Pick a source key (`ROOT_*`) and a root folder (`/manga/select`), browse folders (`/manga`), favorites (`/manga/favorites`)
- Reader (`/manga/reader`) for image chapters **and PDF files**, vertical/horizontal modes, zoom, preload, auto-next
- Folder data from the SQLite cache (`useDb`) or directly from disk
- Recent / random / top-view sliders (cached in `localStorage`)
- Download chapters for offline reading — directly from the reader or through the **download queue** (`/downloads`)

### 🎬 Movie
- Browse `V_*` sources (`/movie`), favorites (`/movie/favorites`)
- Web player (`/movie/player`) with Range streaming from `/api/movie/video`; "open in ExoPlayer" bridge for the Android WebView (`window.Android.openExoPlayer`)
- Thumbnail extraction (needs `ffmpeg` on the server)

### 🎵 Music
- Browse `M_*` sources (`/music`), playlists (`/music/playlists`), global add-to-playlist modal
- Player (`/music/player`): v1 (Spotify-like, always used on mobile) or v2 (Zing-like, desktop, chosen in Settings → `playerSettings.playerUI`)
- Playlist sidebar, drag-to-reorder, lyrics viewer/editor, shuffle/repeat, total playlist duration
- Download tracks to the device (`utils/musicDownloadQueue.js`, 3 concurrent)

### 📸 Media gallery
- `MEDIA_*` sources (`/media`): folder navigation, paginated grid, timeline by date, albums, favorites, lightbox
- Indexes images, videos **and any other file type** (pdf, documents, archives, code…)

### ⚙️ Database management
- Sidebar / Settings → `DatabaseActions`: full or partial (path) scan with optional *shallow* mode (`ScanModal`), delete/reset DB, thumbnail extraction (movie/music)

### 📥 Offline
- `/offline` hub, `/offline/manga` library with storage analytics, per-chapter and bulk delete
- `/offline/movie` and `/offline/music` are placeholders ("đang phát triển")

## 🛠️ Tech stack

| Area | Libraries |
|------|-----------|
| Core | React 18, React Router 6, Vite 4 |
| State | Zustand 4 (with `persist`), TanStack Query 4 (only used by a few hooks) |
| HTTP | axios (`src/utils/api.js`) plus direct `fetch()` calls in several components |
| UI | TailwindCSS 3, framer-motion, lucide-react, react-icons, react-hot-toast, react-modal, embla-carousel, react-lazy-load-image-component |
| Utils | date-fns, use-debounce |

Not used even though they are in `package.json`: `clsx`, `react-intersection-observer`, `react-player`,
`react-virtualized`, `string-natural-compare` (see [DEAD-CODE-REPORT.md](../../docs/DEAD-CODE-REPORT.md)).

## 📁 Project structure

```
react-app/
├── index.html
├── vite.config.js          # alias @ → src, dev proxy, allowedHosts (*.ts.net), HMR over Tailscale
├── tailwind.config.js, postcss.config.js
├── .env.template           # copy to .env
├── public/
│   ├── sw.js               # service worker (v3.1.0)
│   ├── manifest.webmanifest
│   └── default/            # fallback images
└── src/
    ├── main.jsx            # React root, QueryClient, SW registration
    ├── App.jsx             # routes
    ├── styles.css          # global styles (+ styles/components/*.css)
    ├── components/
    │   ├── auth/           # LoginModal
    │   ├── common/         # Layout, Header, Sidebar, sliders, modals, DatabaseActions, ScanModal, UniversalCard…
    │   ├── manga/          # MangaCard, PDFReader, ReaderHeader, MangaRandomSection
    │   ├── movie/          # MovieCard, MovieRandomSection
    │   ├── music/          # MusicCard, PlayerHeader/Footer, FullPlayerModal, LyricsModal, PlaylistModal/Sidebar…
    │   └── media/          # MediaGrid, MediaTimeline, MediaAlbums, MediaToolbar, MediaLightbox
    ├── pages/
    │   ├── Home.jsx, Settings.jsx, NotFound.jsx
    │   ├── manga/          # MangaSelect, MangaHome, MangaReader, MangaFavorites
    │   ├── movie/          # MovieHome, MoviePlayer, MovieFavorites
    │   ├── music/          # MusicHome, MusicPlayer, MusicPlayerV2, MusicPlaylists
    │   ├── media/          # MediaHome
    │   ├── downloads/      # DownloadManager, DownloadTaskCard
    │   └── offline/        # OfflineHome, OfflineMangaLibrary, OfflineMovieLibrary, OfflineMusicLibrary
    ├── store/
    │   ├── index.js        # useAuthStore, useUIStore, useMangaStore, useMovieStore, useMusicStore, useSharedSettingsStore
    │   └── downloadQueueStore.js
    ├── hooks/              # useRandomItems, useRecentItems, useTopViewItems, useRecentManager, …
    ├── utils/              # api, offlineLibrary, storageQuota, mangaCache, favoriteCache, thumbnailUtils, …
    ├── workers/            # downloadWorker.js (plain class running on the main thread, not a Web Worker)
    └── constants/          # index, cacheKeys, colors, uiStyles, timeFormats
```

## 🚦 Getting started

Prerequisites: **Node.js 20 or ≥ 22** (several dependencies require `20 || >=22`) and the backend configured
on port 3000 — see the root [readme.md](../../readme.md) for the full setup (`.env` files, whitelist, first scan).

From the repository root (installs both workspaces and runs both servers):

```bash
npm install
npm run dev          # React app: http://localhost:3001 · backend: http://localhost:3000
```

Only the React dev server (the backend must already be running on port 3000):

```bash
cd react-app
npm run dev          # http://localhost:3001, listens on 0.0.0.0, strictPort
```

Production: `npm run prod` from the repository root builds `dist/` and starts the backend with
`NODE_ENV=production`, serving everything on port 3000.

### Scripts (`react-app/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | Vite dev server on port 3001 (`--host`) |
| `build` | Production build into `dist/` (served by the backend in production) |
| `build:prod` / `build:prod:unix` | Build with `NODE_ENV=production` (`set "NODE_ENV=production"` for Windows cmd — the quotes avoid the trailing-space bug of ISSUES C8 — / POSIX). On POSIX shells `build:prod` also works: the `set` is a no-op and Vite defaults to production |
| `preview`, `preview:prod` | Preview a build (`preview:prod` uses port 3002) |
| `clean` / `clean:unix` | Remove `dist/` |
| `lint`, `lint:fix` | ⚠️ Currently fail: there is no ESLint config file in the repo |

## 🔧 Configuration

### Environment variables (`react-app/.env`)

All variables are optional (`.env.template` documents each one).

| Variable | Purpose |
|----------|---------|
| `VITE_BASE` | Vite `base` (default `/`) |
| `VITE_MIN_STORAGE_SPACE` | Minimum free space (**MB**) that must remain after an offline download. Default 50 (desktop) / 25 (mobile) |
| `VITE_ALLOWED_HOSTS` | Extra comma-separated hostnames allowed by the dev server. `localhost`, **any IP address** (Vite built-in) and every `*.ts.net` domain (`'.ts.net'` in `vite.config.js`) are always allowed |
| `VITE_HMR_HOST`, `VITE_HMR_PORT` | HMR host/port when the dev server is opened through a Tailscale domain; the host is also added to the allowed hosts |
| `VITE_ENABLE_HTTPS` | Serve the dev server over HTTPS — no certificate is configured, so this likely breaks the dev server (ISSUES C4) |
| `VITE_DISABLE_HMR`, `VITE_DISABLE_STRICT_MODE` | Debug switches (`=true`) |

⚠️ Do **not** put `NODE_ENV` in `react-app/.env`: Vite 4 applies `NODE_ENV=development` from `.env` files to
`vite build` as well, producing a development bundle. `vite.config.js` also turns on `server.https` when
`NODE_ENV=production`.

### Dev proxy (`vite.config.js`)

`/api`, `/manga` (HTML requests fall back to the SPA), `/video`, `/audio`, `/media`, `/.thumbnail`, `/default` → `http://localhost:3000`.

### Persisted state (`localStorage`)

`auth-storage`, `manga-storage`, `movie-storage`, `music-storage`, `download-queue-storage`, `userToken`, plus many
cache keys defined in `src/constants/cacheKeys.js` (recent / random / top-view / folder caches).

## 🔒 Authentication

- Source keys come from `GET /api/source-keys.js`; keys listed in the backend `SECURITY` variable require a password.
- `LoginModal` calls `POST /api/login`; the returned token (an HMAC derived from the password, **not** the password
  itself) is stored in `localStorage.userToken` and `auth-storage`. The response also sets the HttpOnly cookie
  `ms_auth`, which is what lets `<img>`/`<video>`/`<audio>` load static files of secure sources (`/manga`, `/video`,
  `/audio`, `/media`). Landing on Home clears the token and calls `POST /api/logout` to clear the cookie.
- `utils/api.js` adds `Authorization: Bearer` and `x-secure-token` headers. **Direct `fetch()` calls do not** — see
  ISSUES B6. API endpoints never accept the cookie alone (CSRF). There is no token refresh, no route guard and no
  error boundary.
- `POST /api/login` returns `429` after 10 wrong passwords in 15 minutes from the same IP.

## 📥 Offline mode

| Piece | Role |
|-------|------|
| `public/sw.js` | Cache-first for `/default/*`; network-first with a 5 s timeout for every `GET /api/*` (except `/api/manga/pdf`); images are served from the `chapter-images` cache when available; navigation falls back to the cached app shell |
| `utils/offlineLibrary.js` | IndexedDB `offline-manga` / store `chapters` (metadata) + Cache Storage `chapter-images` (page images); used by the reader's direct download |
| `store/downloadQueueStore.js` + `workers/downloadWorker.js` | Download queue: max 2 concurrent tasks, 2 images per chunk, 100 ms between chunks, pause/resume/retry |
| `utils/storageQuota.js` | `navigator.storage.estimate()` checks before downloading |

More details: [OFFLINE-GUIDE.md](OFFLINE-GUIDE.md), [SERVICE-WORKER-ANALYSIS.md](SERVICE-WORKER-ANALYSIS.md),
[STORAGE-QUOTA-MANAGEMENT.md](STORAGE-QUOTA-MANAGEMENT.md).

## 🐛 Troubleshooting

1. **API errors in dev** – make sure the backend is running on port 3000 and `backend/.env` exists.
2. **403 `Forbidden (blocked)`** – the device is not in `ALLOWED_IPS` / `ALLOWED_HOSTNAMES` (backend whitelist).
3. **Login / scan / favorite fail with `CORS blocked`** – the app was opened through a domain that is neither an IP nor
   `*.ts.net`; add it to `CORS_DEV_CONFIG` in `backend/.env`.
4. **"Blocked request. This host is not allowed"** – add that domain to `VITE_ALLOWED_HOSTS`.
5. **401 then redirect to `/`** – the stored token is no longer valid (old password-as-token from before the update,
   `SECURITY_PASSWORD` changed, or `backend/data/.auth-secret` deleted); log in again.
6. **Images of a secure source do not load** – the `ms_auth` cookie is missing; go back to Home and log in again.
7. **Manga/movie/music/media lists are empty** – these lists come from the database: scan from the sidebar first
   (manga: *Quét Manga* scans the whole selected root folder; path/shallow options exist only for movie/music/media).
8. **Stale UI after a deploy** – unregister the service worker / clear site data (DevTools → Application).

## 📄 License

ISC
