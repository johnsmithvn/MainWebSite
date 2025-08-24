# Project Instructions for MainWebSite

## Technology Stack
- **Backend:** Node.js (Express 5), SQLite (Better-SQLite3), APIs for Manga/Movie/Music, static file serving, ffmpeg for media.
- **Frontend (old):** Vanilla JS + esbuild, HTML/CSS, global state via localStorage.
- **Frontend (new):** React 18 (Vite), Zustand for state, React Router v6, React Query, Tailwind CSS, Framer Motion, React Hot Toast, Lucide-React icons.

## Coding Guidelines
- Use **functional React components** with hooks. No class components.
- Follow ESLint rules (no unused vars, exhaustive deps, etc.).
- Code style: clean, readable, consistent naming.
- **All comments must be in Vietnamese.**  
- **Every significant line must be explained with a Vietnamese comment.**
- Do **not** guess missing logic: if something is unclear or missing, request the corresponding file or clarification.
- Role of AI: act as a **senior developer**, providing analysis, refactor suggestions, and code with detailed commentary.

## UX/UI Guidelines
- Main UI: React app.  
- Refer to **old frontend** for full functionality, features, and UX flows.  
- Pages:
  - Home: source selection (Manga/Movie/Music).
  - Manga: Select root, library listing, reader, favorites.
  - Movie: Library, search, player, favorites.
  - Music: Library, playlists, player (v1/v2). (music not favorites)
  - Settings: dark mode, player UI preference, cache/history clear.
- Styling: Tailwind CSS, dark/light theme, responsive.
- Reuse existing components (Button, Layout, Modals, Toasts).

## Backend APIs
- Use `apiService` methods (`manga.getFolders`, `movie.getFolders`, `music.getFolders`, `toggleFavorite`, `getFavorites`, `scan`, `checkEmpty`, etc.).
- Handle secure sources with token via login modal.
- Cache responses where possible (localStorage or utils).
- Preserve error handling and show user-friendly messages.

## Non-functional Requirements
- **Performance:** caching, lazy-loading images, avoid duplicate requests.
- **Security:** token-based access for secure sources, no assumptions about missing logic.
- **Maintainability:** clear Vietnamese comments, no dead code.
- **Consistency:** new React app must mirror old frontend’s features exactly, no regressions.

---

### Output Rules for AI
- **Always answer in Vietnamese.**
- **Always add detailed Vietnamese comments for each line of code.**
- If missing context or file, **ask the user to upload it** instead of guessing.
