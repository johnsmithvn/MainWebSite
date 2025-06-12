# MainWebSite

This project serves static pages for reading manga, watching movies and listening to music from local directories.

## Prerequisites

- **Node.js** 18 or later.
- A `.env` file placed inside `backend/` defining paths and access rules:
  - `ROOT_*` variables for manga directories.
  - `V_*` variables for movie directories.
  - `M_*` variables for music directories.
  - `ALLOWED_HOSTNAMES` and `ALLOWED_IPS` for request filtering.

An example file can be found in `backend/.env exampe`.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `backend/.env exampe` to `backend/.env` and update the variable values.
3. Start the server:
   ```bash
   npm start
   ```

The application listens on port `3000` by default.

## Project Structure

```
backend/   Node.js Express server and API logic
frontend/  Static files served to the browser
```

- **backend/** contains `api/`, `middleware/`, `utils/` and `server.js` which is the entry point.
- **frontend/** is split into `public/` HTML files and `src/` JavaScript, CSS and components.

