# Offline Architecture & Implementation Guide

> **Updated 2026-10-29** against commit `a511bcd`: the service worker no longer pre-caches the React bundle, the
> download queue (`/downloads`) is a second download path, `media-thumbnails-v1` was added, and
> `serviceWorkerManager.js` is not wired into the UI. Known problems are tracked in
> [docs/ISSUES-REPORT.md](../../docs/ISSUES-REPORT.md) (B14, B15, D3, D4, P4).

This document explains how the manga reader application implements offline support, the storage layers that power it, and how to extend or troubleshoot the flow when building new features.

## 1. High-level overview

1. The browser registers `public/sw.js` as the service worker when the React bundle boots (`src/main.jsx`).
2. The service worker pre-caches only the default fallback images under `/default/`. The React app shell (`/`, `/index.html`) is cached the first time a navigation succeeds online; JS/CSS bundles are cached on demand by the network-first rule.
3. When a user chooses to download a chapter in the reader (`src/pages/manga/MangaReader.jsx`) — either directly or by adding it to the download queue (`src/store/downloadQueueStore.js` + `src/workers/downloadWorker.js`, managed at `/downloads`) — the app collects the page URLs, streams them into the `chapter-images` cache, and stores chapter metadata in IndexedDB via `src/utils/offlineLibrary.js`.
4. Offline library pages (`src/pages/offline/OfflineHome.jsx` and `src/pages/offline/OfflineMangaLibrary.jsx`) read from IndexedDB and the caches to render saved sources, manga, and chapters.
5. When the network drops, navigation requests fall back to the cached React app shell and the previously downloaded chapter images so the reader can keep working.

## 2. Storage layers

### 2.1 Cache Storage (service worker)

| Cache name pattern | Purpose | Populated by |
| --- | --- | --- |
| `offline-core-<version>` | Default icons & shell assets required to render the SPA while offline. | `install` handler in `public/sw.js` |
| `reader-dynamic-<version>` | JSON/API responses that are needed while offline (manga metadata, reader payloads, app shell). Uses a network-first strategy with a 5s timeout and falls back to cache on failure. | `fetch` handler for API and navigation requests in `public/sw.js` |
| `chapter-images` | All downloaded page images for offline chapters. | `downloadChapter()` in `src/utils/offlineLibrary.js` and `DownloadWorker.processTask()` in `src/workers/downloadWorker.js` |
| `media-thumbnails-v1` | Movie/music/media thumbnails (stale-while-revalidate, max 1000 entries). Currently almost never hit because image requests are captured by the manga-image rule first (ISSUES B14). | `thumbnailCacheStrategy()` in `public/sw.js` |

Important implementation notes:

- Cache version bumps: update `CACHE_VERSION` in `public/sw.js` whenever cache shape changes so old entries can be purged during the next activation.
- Only assets under `/default/` are pre-cached. `/api/` responses are cached on demand when the network-first strategy succeeds; if a feed should never persist (e.g., random or favorites listings) filter it out before calling `cache.put()` or clear the `reader-dynamic-*` cache from DevTools.
- Navigation fallback: when offline, `navigationStrategy()` returns the cached React app shell (`/` or `/index.html`) so the SPA can boot and hydrate offline pages.

### 2.2 IndexedDB (`offline-manga` database)

`src/utils/offlineLibrary.js` manages a single IndexedDB database:

- **Database**: `offline-manga`
- **Object store**: `chapters`
- **Primary key**: `id` (full chapter path, e.g., `source/manga/chapter/__self__`)

Each stored record includes:

| Field | Description |
| --- | --- |
| `id` | Unique chapter identifier (folder path). |
| `sourceKey` / `rootFolder` | Identify which source/root saved the chapter so the offline UI can group results correctly. |
| `mangaTitle` / `chapterTitle` | Human-readable titles extracted from the path when missing from metadata. |
| `pageUrls` | Array of image URLs persisted in the `chapter-images` cache. |
| `totalPages` | Number of pages downloaded. |
| `bytes` | Total estimated download size (real bytes when the response is readable, estimated via `CACHE.FALLBACK_IMAGE_SIZE_BYTES` otherwise). |
| `coverImage` | Cached URL to the first page for displaying thumbnails. |
| `createdAt` / `updatedAt` | Timestamps that power sorting and status indicators in the offline library. |

Helper utilities exposed by `offlineLibrary.js`:

- `downloadChapter(meta, onProgress)` – Streams images into the cache and writes chapter metadata. Accepts an optional progress callback.
- `getChapter(id)` / `getChapters()` – Fetch metadata for a single chapter or all chapters.
- `isChapterDownloaded(id)` – Determined in the reader to toggle download buttons.
- `deleteChapterCompletely(id)` – Removes both IndexedDB metadata and cached images.
- `clearAllOfflineData()` – Bulk cleanup used by the offline management UI.

### 2.3 Browser storage APIs

- **Quota checks**: `MangaReader.jsx` uses `navigator.storage.estimate()` to show warnings before large downloads and surface the storage info modal.
- **LocalStorage**: authentication-derived keys (`sourceKey`, `rootFolder`) are stored to rehydrate the reader and offline library contexts.

## 3. Runtime flow

### 3.1 Service worker lifecycle

1. **Registration** – Triggered in `src/main.jsx` once `window` finishes loading. Registration logs success/failure for debugging.
2. **Install** – `public/sw.js` caches default icons defined in `DEFAULT_IMAGES` to guarantee the UI has base assets offline.
3. **Activate** – Cleans up caches that match the managed prefixes (`manga-`, `mainws-`, `offline-core-`, `reader-dynamic-`) but do not use the current version suffix. It also broadcasts `SW_ACTIVATED` so the app can refresh cache stats.
4. **Fetch handling** –
   - Static `/default/` assets → cache-first.
   - `/api/` requests → network-first with timeout, store successful responses for offline fallback.
   - Manga images → check `chapter-images` first, otherwise fall back to the network without caching to avoid bloating storage for online-only reads.
   - Navigation requests → network-first and cache the SPA shell for later offline navigation.

### 3.2 Downloading a chapter

1. The reader composes the list of page URLs from the current chapter and builds metadata (`MangaReader.jsx`, `proceedWithDownload`).
2. Before downloading, the quota modal inspects `navigator.storage.estimate()` to ensure the user has enough space.
3. `downloadChapter()` iterates over each page URL, fetches it (switching to `no-cors` when the domain disallows CORS), and writes the response into `caches.open('chapter-images')`.
4. The helper keeps a running byte total. If the response is opaque, it uses `CACHE.FALLBACK_IMAGE_SIZE_BYTES` for the estimate.
5. After the loop finishes, the function writes enriched metadata to IndexedDB and emits completion to the progress callback. If any page failed, nothing is saved: the function throws `Tải thiếu N/M trang (trang …)` (the reader shows it as a toast) and removes the pages it just cached — unless a complete copy of the chapter was already saved, which is kept as is (ISSUES D3, fixed 2026-11-04).
6. The reader refreshes offline status so the UI updates instantly.

### 3.2b Downloading through the queue

1. `MangaReader` adds a task to `useDownloadQueueStore` (persisted in `localStorage` as `download-queue-storage`). Only unfinished tasks keep `pageUrls` (needed to resume); at most the 200 most recent finished tasks are persisted, and a full `localStorage` no longer throws — the store then saves only unfinished tasks (ISSUES D4, fixed 2026-11-04).
2. The store starts up to `MAX_CONCURRENT_DOWNLOADS = 2` tasks; `downloadWorker.processTask()` fetches the page list from `/api/manga/folder-cache?mode=path`, downloads images 2 at a time with a 100 ms pause between chunks, supports pause/resume/cancel via `AbortController`, and saves metadata with `saveChapter()`. If any page fails, the task errors with `Tải thiếu N/M trang`, so the store retries it (exponential backoff) and finally marks it `failed` instead of `completed`.
3. `/downloads` (`DownloadManager.jsx`) shows progress, retry and cleanup actions.
4. The worker uses a plain `fetch()` without the `x-secure-token` header, so queue downloads fail for password-protected sources (ISSUES B6).

### 3.3 Reading offline

1. When the user opens an offline chapter, the reader queries IndexedDB via `getChapter()` and checks `chapter-images` for each page.
2. Because navigation requests hit the cached app shell, routing to `/offline/...` works even without a network.
3. Missing cache entries fall back to the inline HTML offline page rendered by `navigationStrategy()` as a safety net.

## 4. Extending offline support

Follow these steps when adding a new offline-capable feature:

1. **Decide what needs to persist.** Only cache what the user explicitly downloads. Avoid bulk caching list endpoints to conserve storage.
2. **Write metadata to IndexedDB.** Reuse `offlineLibrary.js` or extend it with a new object store if you need a different data shape. Remember to bump `DATABASE.OFFLINE_MANGA.VERSION` when migrating the schema.
3. **Store binary assets deliberately.** Use a dedicated cache name (similar to `chapter-images`) for large blobs. Keep it separate from `reader-dynamic-*` so you can clear content without wiping app shell caches.
4. **Expose UI hooks.** Update the offline pages to surface the new content source. The current implementation filters by `sourceKey` so you only see entries that belong to the selected provider.
5. **Test service worker updates.** After changing `public/sw.js`, bump `CACHE_VERSION` and reload the app twice or run `navigator.serviceWorker.getRegistrations()` in DevTools to ensure old caches are purged.
6. **Respect storage limits.** Run the built-in quota modal (trigger a large download) to confirm that warnings show correctly and the fallback flow handles low-space conditions.

## 5. Configuration & build considerations

- **Development**: `npm run dev` serves `sw.js` from `public/`. If you are testing offline features locally, run the Vite dev server over HTTPS or use a production preview build (`npm run build && npm run preview`) so the service worker can control the scope.
- **Deployment**: Make sure the hosting environment serves `sw.js` at the root (`/sw.js`). Most static hosts require copying the file during build or configuring rewrite rules.
- **Cache busting**: Increment `CACHE_VERSION` whenever you change caching rules or the list of `OFFLINE_CORE_ASSETS` to avoid mixing incompatible cache entries.
- **Feature flags**: If you want to disable the service worker in development, guard the registration in `src/main.jsx` with an environment variable (e.g., `if (import.meta.env.PROD)`), but leave it enabled in production builds.

## 6. Maintenance & troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Offline page shows dark/loading screen | Service worker caches missing app shell. | Verify `offline-core-*` and `reader-dynamic-*` caches exist via DevTools > Application > Cache Storage. Reload after clearing old caches. |
| Chapter downloads stall | CORS blocked an image request. | `downloadChapter()` automatically retries in `no-cors` mode. Confirm the source domain allows HEAD requests; update `checkCorsSupport()` if new domains need custom handling. |
| Storage usage keeps growing | Old cache versions not cleared. | Bump `CACHE_VERSION`, reload twice, or call `clearAllOfflineData()` from the offline management UI. |
| Favorites/random lists still appear offline | Their API responses were cached before you disabled caching. | Open DevTools > Application > Cache Storage and delete entries under `reader-dynamic-*`. Going forward, only requests the service worker sees while offline will be served from cache. |

## 7. Useful utilities & entry points

- `src/utils/serviceWorkerManager.js` – Programmatic control (checking caches, clearing caches, applying updates). **Not used by any rendered component today** (see DEAD-CODE-REPORT).
- `src/store/downloadQueueStore.js`, `src/workers/downloadWorker.js`, `src/pages/downloads/DownloadManager.jsx` – Download queue.
- `src/utils/storageQuota.js` – Quota checks (`VITE_MIN_STORAGE_SPACE`, in MB).
- `src/pages/offline/OfflineHome.jsx` – Source selector and storage statistics UI.
- `src/pages/offline/OfflineMangaLibrary.jsx` – Library grid & modal interactions for offline chapters.
- `src/utils/offlineLibrary.js` – IndexedDB helpers and download pipeline.
- `react-app/public/sw.js` – Service worker strategies and cache configuration.

By following this guide you can confidently maintain the offline experience, reduce unnecessary caching, and extend the system to support future offline-first features.
