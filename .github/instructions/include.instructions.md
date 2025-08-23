---
applyTo: '**'
---
#  Instructions for MainWebSite

## Project Architecture Overview

- **Monorepo Structure:**
  - `backend/`: Node.js Express server, REST APIs for manga, movie, music, and system modules. Organized by domain (e.g., `api/manga/`, `api/movie/`, etc.).
  - `frontend/`: Static HTML, JS, and React app (in `react-app/`). Uses constants for configuration and UI logic. Documentation in `frontend/docs/`.
  - `react-app/`: Vite + React + TailwindCSS. Entry: `src/main.jsx`, main app: `src/App.jsx`.
  - it use 2 frontend for project: `react-app/` for main app and `frontend/` for static assets.
  - `frontend/`: Contains static assets like HTML, CSS, and images. => this is full function
  - `react-app/`: Contains the main application code, including React components and state management. => this is refactored , update for better performance and maintainability from `frontend/`

## Key Conventions & Patterns

- **Constants:**
  - All UI and config constants are centralized in `frontend/src/constants.js`.
  - Migration from hardcoded values is documented in `frontend/docs/CONSTANTS-MIGRATION.md`.
  - Always import from `constants.js` for UI/config values. => this is important for consistency and maintainability
- **API Design:**
  - RESTful endpoints grouped by domain (e.g., `/api/manga/scan`, `/api/movie/favorite-movie.js`).
  - Middleware in `backend/middleware/` for auth, error handling, rate limiting, security.
- **Frontend:**
  - Static HTML in `frontend/public/`, React SPA in `react-app/src/`.
  - Use TailwindCSS for styling (`react-app/tailwind.config.js`).
- **Documentation:**
  - All migration, architecture, and usage docs in `frontend/docs/`.
  - Read `CONSTANTS-MIGRATION.md` for constants usage, `CONSTANTS-ANALYSIS.md` for architecture.

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
  
---

_Last updated: August 23, 2025_

Please review and suggest any missing or unclear sections for further improvement.
