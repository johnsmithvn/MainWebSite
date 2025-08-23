React Frontend Migration Instructions for MainWebSite
Tech Stack Overview
Backend: Node.js with Express 5 (REST API) and SQLite database (using Better-SQLite3)
GitHub
. The backend provides API endpoints for manga, movie, and music content (e.g. folder listings, search, favorites, media streaming) and serves static files.
Old Frontend: A static web app (vanilla JS, bundled by esbuild) that directly manipulates the DOM and uses fetch for API calls. It utilizes HTML/CSS/JS with no framework (logic is in /frontend/src with modules, built into /frontend/public via esbuild) and relies on global functions and localStorage for state.
New Frontend: A modern React 18 application (in /react-app) bootstrapped with Vite. It uses React Router v6 for routing, Zustand for state management, and TanStack React Query for data fetching
GitHub
GitHub
. Tailwind CSS is used for styling (utility classes and dark mode support), alongside component libraries like Lucide-React and React Icons for icons, Framer Motion for animations, and React Hot Toast for notifications
GitHub
GitHub
.
The goal is to migrate all functionality from the old frontend to this new React app, without regressing features or introducing new logic. The backend and database remain unchanged.
Codebase Structure
backend/: Node/Express server code (e.g. API routes under backend/api/, DB helpers in backend/utils/). This includes endpoints such as GET /api/manga/folder-cache, /api/movie/..., etc., which the frontend calls for data. (Do not modify backend code during the migration.)
frontend/: Legacy frontend (to be replaced). Contains HTML pages (in frontend/public) and JS modules (in frontend/src) implementing UI logic for manga, movies, and music. This is the reference for existing features and behavior, but will no longer be used once React migration is complete.
react-app/: New React application where all new code will reside. It’s structured by feature: e.g. components in src/components, pages in src/pages (with subfolders for manga, movie, music), global state in src/store, utilities in src/utils, etc. All new implementation must be placed here. Only modify/create files in this react-app folder; do not alter anything in frontend/ or backend/
GitHub
. The build uses Vite and outputs to its own dev server or build folder (integrated via proxy to the backend for API calls in development).
Coding Style and Conventions
General Style: Follow clean, modern JavaScript/React practices. Use functional components and React Hooks (no class components). Use arrow functions and clear, self-explanatory variable and function names (in English). The codebase follows ESLint recommended rules (no unused vars, exhaustive deps for hooks, etc.) – ESLint is configured with zero warnings tolerated
GitHub
. Code formatting (via Prettier/Vite) uses 2-space indentation, semicolons, single quotes, etc., consistent with existing files.
Comments: Write all comments in Vietnamese, as the original codebase did, to maintain consistency for local developers. Provide clear, detailed comments for every significant line or block of code, explaining the purpose in simple terms
GitHub
. Aim for clarity and completeness so that even complex logic is easily understood. (The original code uses Vietnamese comments with emoji markers for important notes – you may continue this practice for clarity, e.g. use icons like 🔄, ⚠️, ✅ to highlight steps or warnings, but only if it enhances readability.) The key is to ensure the migrated code is well-documented for future maintainers.
UI/UX and Styling: Use the established design framework:
Tailwind CSS utility classes for styling elements (e.g. bg-white dark:bg-dark-800, text-gray-900 dark:text-white, responsive grid classes, etc. as seen in existing React components). Avoid inline styles; leverage Tailwind and the defined CSS variables for colors (see src/index.css for dark/light mode variables). Ensure the UI is responsive and works in both light and dark mode, matching the old UI’s behavior.
Follow existing component patterns. For example, common UI elements like buttons, modals, toasts are already implemented (e.g. Button component in components/common/Button.jsx, LoginModal in components/auth/LoginModal.jsx, toast via react-hot-toast). Reuse these rather than creating new ones, to maintain consistency.
Preserve UX details from the old interface. For instance, animations or transitions (the new code uses Framer Motion for subtle animations on list items and modals), and consistent layout spacing. Use the same icons and visuals (Lucide or Feather icons, emoji indicators where appropriate) to give a familiar look and feel.
State Management: Leverage the global Zustand stores (useAuthStore, useUIStore, useMangaStore, etc. in src/store/index.js) for managing app state instead of using global variables or singletons. For example, user authentication status, selected sourceKey, current folder path, dark mode flag, etc., already have getters/setters in these stores – use them. Avoid introducing new global state unless necessary; integrate with the existing store structure.
Error Handling and Edge Cases: Maintain robust error handling as in the old code. For instance, if an API call fails or returns an empty result, show a user-friendly error message (using the toast system for notifications, e.g. toast.error('Lỗi tải ...') as seen in the new Home page). If a required condition isn’t met (e.g. user hasn’t selected a source or root folder), handle it by redirecting or prompting (the old code would redirect to home or show a warning – the new code should do similarly via React Router navigation or modals).
No Guesswork: Do not invent new logic or change how features work unless necessary. All functionalities should mirror the old frontend’s behavior. If any aspect of the old logic is unclear, refer to the corresponding file in frontend/src for guidance. In cases where something is truly ambiguous or not covered by existing code, ask for clarification or for the relevant file to be provided
GitHub
 rather than making an assumption. The goal is functional parity.
Feature Parity Requirements
Make sure to implement all features from the old interface in the new React app. This includes (but is not limited to):
Source Selection (Home Page): On launch, the app should display available data sources for Manga, Movies, and Music (e.g. list of keys or library names to choose from, divided by category). This is the “Home” page (/, see Home.jsx).
It should fetch the available source keys from the backend (the old app loads a source-keys.js script that populates window.mangaKeys, etc.; the new app does a fetch to /api/source-keys.js and parses it
GitHub
GitHub
). Implement similar logic to retrieve and list all sources.
Display the sources in a nice UI (the new design uses a card grid with icons and names
GitHub
GitHub
). Only show secure (password-protected) sources if the user chooses to (there is a toggle for showing secure keys, showSecure state).
If a source is secure and the user is not authenticated, clicking it should open the login modal (as implemented in Home.jsx using <LoginModal> and related state
GitHub
). Upon successful login (i.e. obtaining a token from the backend), it should proceed to load the source.
After selecting a source:
If it’s a Manga source: navigate to the Manga Select page (/manga/select) where the user will pick a root folder (more on this below).
If Movie source: ensure the backend has scanned the source. The old code calls an API to check if the movie database is empty and triggers a scan if needed
GitHub
. In the new app, use apiService.movie.checkEmpty and apiService.movie.scan for this purpose
GitHub
. After ensuring data availability, navigate to /movie (Movies home).
If Music source: navigate directly to /music (Music home), presumably the music sources don’t require a scan step (unless the backend has a similar check – if so, implement accordingly using provided API functions).
Manga Section:
Select Root Folder (MangaSelect page): After choosing a Manga source, the user may need to select a root folder (e.g. if a source contains multiple root directories for manga). The old UI’s select.html likely presented a list of root folders (maybe using an API call or global variable). Implement the MangaSelect page (/manga/select) to list available root folders for the chosen manga source. Use the backend API if available (possibly an endpoint like /api/manga/root-folders or it might be included in the source keys data). If only one root exists, you might auto-select it. Once a root is chosen, update the rootFolder in state and navigate to the Manga home page.
Manga Home (MangaHome page): This page (/manga) displays the contents of the manga library for the selected root. It should replicate all behaviors from the old frontend/src/pages/manga/index.js
GitHub
GitHub
:
On page load (or when sourceKey/rootFolder changes), perform security checks. In the old code, if the sourceKey is secure and no token is present, it triggers a login modal
GitHub
. In React, ensure that if a manga source is secure and the user isn’t authenticated (useAuthStore.isAuthenticated false), you redirect back to home or show the login. (Likely this is handled already by the Home page forcing login before navigation, but double-check).
If no sourceKey or no rootFolder is set, redirect to the appropriate selection page (the new code does this: see MangaHome effect guarding sourceKey and rootFolder
GitHub
GitHub
 which navigates to / or /manga/select as needed).
Once ready, load the list of manga folders (or manga entries) for the current path. The new app uses fetchMangaFolders from the store, which calls apiService.manga.getFolders with appropriate params
GitHub
GitHub
. This function already handles caching (check local cache first, then fetch from API) and updates mangaList state. Ensure that calling fetchMangaFolders('') on initial load will fetch the top-level folders (or manga series list) for the root. This corresponds to old code calling loadFolder(initialPath) with initialPath possibly empty
GitHub
.
Display Mode & Layout: The MangaHome should allow switching between grid and list view (the old UI had a toggle for list ⧓ vs grid ⧉ view). In the new UI, there are probably icons (e.g. a grid icon and list icon from lucide-react) and a state viewMode toggled between 'grid' and 'list'
GitHub
. Ensure the UI toggles layout accordingly (e.g. different CSS grid vs list styles). Also, implement sorting or filtering controls if present (e.g. maybe a sort dropdown by name/date; there is a sortBy state in MangaHome
GitHub
, likely to be used to sort the displayed list).
Pagination: The old code paginated the folder listing (possibly loading a set number of items at a time, using constants like PAGINATION.FOLDERS_PER_PAGE which was 24
GitHub
). Check if the new design implements infinite scroll or paging for manga list. There is a concept of pageParam and sizeParam in the new state
GitHub
, and storing manga.perPage in localStorage
GitHub
GitHub
. This suggests the new MangaHome may support jumping pages or adjusting page size. Ensure that if the list is very long, the user can navigate through it (either by infinite scroll or pagination controls). Implement the logic for pagination as intended (e.g. query params page and size in the URL as seen in code).
Search: In the old UI, typing in the search box (#floatingSearchInput) would show a dropdown of results with infinite scroll (loading more as you scroll)
GitHub
GitHub
. The results came from GET /api/manga/folder-cache?mode=search&q=.... In the new React app, implement a search input for manga that queries the backend for matching folders. Likely, an API function exists (e.g. apiService.manga.search or reusing getFolders with mode: 'search'). You can manage search state in the store (there is searchTerm in useMangaStore
GitHub
). The dropdown suggestions could be a component (e.g. a list that appears below the input). Use React state or context to manage the dropdown’s open/closed state (useUIStore.searchOpen exists
GitHub
, possibly for this). Ensure that:
When the user types, if the query is non-empty, results are fetched and shown (with a loading indicator like a spinner or “Đang tìm kiếm…” text as in old code
GitHub
).
If the user clears the input, hide the dropdown (old code clears results on empty
GitHub
).
If results are fewer than a page, or none, handle accordingly (old code shows “No results” message
GitHub
).
Support loading more on scroll: if the user scrolls to bottom of the dropdown and more results are available, fetch the next batch (old code used an attached flag to only attach one scroll listener
GitHub
 and a hasMore flag
GitHub
GitHub
). In React, you might use an onScroll event on the results list or utilize an intersection observer to load more when the user nears bottom.
Clicking a search result should navigate to either the reader or load that folder. In old code: if on the reader page already, clicking result navigated to that manga’s reader page; otherwise it called window.loadFolder to load the folder content in place
GitHub
. In the new app, likely clicking a result should route appropriately. If the result is a folder (not a single series), navigate within MangaHome (update path param). If it’s a direct reader link (perhaps indicated by a different type), navigate to MangaReader page. The store’s fetchMangaFolders already handles data.type === 'reader' by setting shouldNavigateToReader state
GitHub
; the MangaHome effect then sees shouldNavigateToReader and navigates to the Reader page
GitHub
. Ensure this flow works when selecting a search result that is a reader (i.e., a single manga with images).
Random Banners & Top Views: The manga homepage in old code loads a random selection of manga (for a banner slider) and a top-viewed list:
Random: Old loadRandomBanner() fetched /api/manga/folder-cache?mode=random and showed a banner slider of random manga
GitHub
GitHub
. In the new app, implement a Random Manga section (perhaps MangaRandomSection component exists, as imported in MangaHome
GitHub
). Use apiService.manga.getRandom or similar to fetch random items. Cache the random list in localStorage (old code caches for 30 minutes with key randomView::<sourceKey>::<rootFolder>
GitHub
). The new component can handle caching via the mangaCache utils or localStorage directly. Provide a way to refresh the random list (old UI had a refresh button 🔄 that clears cache and reloads
GitHub
).
Top viewed: Old loadTopView() fetched /api/manga/folder-cache?mode=top to get most viewed manga
GitHub
, then rendered a section. Implement a Top Manga section similarly (maybe as another component or part of MangaHome). Call the appropriate API (likely apiService.manga.getTop if available) and display the list of top items. This could be a horizontal slider or a grid. If an item is clicked, navigate to it (likely similar to selecting a folder or going to reader).
Recent viewed: Old code retrieved a list of recently viewed manga from localStorage (key via recentViewedKey()) and displayed them
GitHub
. The new app should include a Recently Viewed section, showing recently accessed series. The Zustand store or utilities (favoriteCache or similar) might have support for this. If not already implemented, you can track views in the reader page (each time user reads a manga, add it to recent list in localStorage or store) and then show on MangaHome.
Favorites: Manga has a favorites feature (user can mark series as favorite). The old manga favorites page (manga/favorites.html with script frontend/src/pages/manga/favorites.js) displayed all favorite series for that source. In the React app:
There is a MangaFavorites page (/manga/favorites route, component imported in App.jsx
GitHub
). Implement it to fetch and display the list of favorites. Use apiService.manga.getFavorites (the store’s fetchFavorites() calls this
GitHub
). The favorites can be shown as a simple list or grid of series, similar to MangaHome but filtered to only favorites.
On MangaHome itself, favorite icons (♥) should be shown on each item to allow toggling. The new design likely includes a heart icon overlay on each manga card. When clicked, call the store’s toggleFavorite (which likely uses apiService.manga.toggleFavorite to update backend and then updates state
GitHub
). Ensure the UI immediately reflects the change (e.g. filled heart vs outline, and maybe triggers a state update so if on favorites page it refreshes). The store uses a favoritesRefreshTrigger to signal changes
GitHub
GitHub
; MangaHome listens to this to update the UI if needed.
Dark Mode Toggle: The app supports dark mode globally. In the old UI, window.toggleDarkMode() would switch themes. In React, this is managed by useUIStore.darkMode state and applied by adding/removing a .dark class on the document root
GitHub
. Ensure there is a toggle (possibly in a settings menu or header) that calls useUIStore.toggleDarkMode() to switch themes.
Manga Reader (Reading view): The page for reading a manga (/manga/reader) should replicate the functionality of reader.html (frontend/src/pages/manga/reader.js and related components like readerSettingsModal.js). Key points:
Display the manga images (all pages) either in a scrollable list (vertical reading mode) or one at a time (maybe horizontal/page-by-page mode). The old reader.js likely had logic for different modes (the constants category READER in old constants suggests settings like readingMode, zoom, etc.). The new store has readerSettings in manga store
GitHub
 to track readingMode (vertical vs horizontal, etc.), zoom level, etc. Use those settings to determine how to render the images.
The images to display: The store’s readerPrefetch is set when fetchMangaFolders finds data.type === 'reader'
GitHub
, containing images (an array of image URLs) for the folder. The MangaReader component should retrieve useMangaStore.readerPrefetch or possibly call a specific API to get images if navigated directly. Ensure that if a user refreshes the reader page or navigates directly, the app can fetch the images (maybe an API like /api/manga/folder-cache?mode=reader&path=... exists).
Navigation: Provide a back button to return to the manga listing (old reader had a close or back to series button). The React MangaReader likely has a header with a back arrow (perhaps ReaderHeader.jsx). Implement proper navigation (e.g. using useNavigate() to go back or to the parent folder).
Favorites and history from reader: If a user is reading a manga, allow them to favorite it (a heart icon for the series in the reader UI, toggling calls toggleFavorite). Also, update recent history (when reading, maybe each image or on unload, mark that series as recently viewed).
Settings in reader: The old reader had a settings modal (toggle for reading mode vertical/horizontal, toggling dark mode specifically for reader, etc.). The new app likely integrated these into a Settings page or a floating menu. Check frontend/src/components/readerSettingsModal.js for what was offered (e.g. toggling reading direction, preload count, etc.) and ensure those features exist. The readerSettings in store indicates readingMode, zoom, autoNext, etc., which should be adjustable. If the new UI hasn’t implemented it yet, you should implement a basic settings button in reader to toggle those (or integrate it into the global Settings page).
Performance: The reader might need to load many images. Use best practices like lazy-loading images (the new app has react-lazy-load-image-component library
GitHub
 – utilize this for loading images only when they are in view to save memory). Also respect the preloadCount (store has a setting to preload a certain number of images ahead
GitHub
). Implement preloading logic using that setting (e.g. load N images ahead of current view to allow smooth reading).
Gesture controls: If the old code supported keyboard arrows or swipes (maybe HammerJS was included on backend for gesture support
GitHub
), consider adding basic support for navigation via keyboard (e.g. left/right arrows to go previous/next if in single-page mode) or enabling swipe events for mobile (possibly the library HammerJS was used for that; in React, we might not need it or could use a small utility if required).
Movie Section:
Movie Home (MovieHome page, /movie): This should list movie folders or items similar to manga. The old frontend/src/pages/movie/index.js would load either categories or a list of movies. Implement using apiService.movie.getFolders to fetch movies for the current source (the store likely has a useMovieStore with similar fetch logic as manga – check src/store/index.js for movie). Display movies with thumbnails (perhaps use a card grid). If the movie source is organized in folders (like by genres or collections), ensure navigation into folders works (navigate with React Router, e.g. maybe also using query param path like manga does).
The MovieHome should also allow searching videos. The old search for movies had an extra filter for type (video vs series)
GitHub
GitHub
. If the backend search API supports a type parameter (as seen in old code, they set type=${encodeURIComponent(type)} for movie search
GitHub
), include a filter UI (dropdown or toggle for type of video).
Also implement favorites for movies: an endpoint exists for movie.getFavorites and movie.toggleFavorite (store usage is visible
GitHub
GitHub
). So allow marking movies or folders as favorites and list them on a MovieFavorites page (/movie/favorites). Add a MovieFavorites component similar to MangaFavorites.
Movie Player (MoviePlayer page, /movie/player): When a user selects a specific video to play, load this page. It should embed a video player. The new app likely uses react-player library
GitHub
 for this. Provide controls for play/pause, seek, volume, fullscreen etc., which react-player can manage. The video source URL might be provided by an API call or could be a local file path accessible via a static route. Possibly the backend exposes files under a certain path. (Check how the old player works – frontend/public/movie/player.html might have script to fetch the video URL or stream.)
Implement the logic to retrieve the video: The old code might call an API to get a video URL or stream key. If apiService.movie has something like getVideo(id) or similar, use that. Otherwise, the video might just be accessible via a path. For now, assume you can construct the video URL from the known path (maybe the API that listed movies gave a file path or ID).
Ensure to handle if a video is not ready or an error occurs (show an error toast).
Possibly include additional info: The old UI might have displayed video metadata or allow selecting subtitles? If subtitle or multiple audio track support existed, note it but implementing might require extensive details – if not in scope, can skip.
Note: The old backend uses fluent-ffmpeg and ffprobe-static
GitHub
 likely to generate thumbnails or probe video info. This suggests that for each video, a thumbnail or duration might be available via API. The MovieHome and Player should utilize any such info (e.g. show a thumbnail preview, display video length, etc., if provided by the API data).
Music Section:
Music Home (MusicHome page, /music): List music items (songs or albums). The old frontend/src/pages/music/index.js likely listed either all songs or folders of songs. Determine how the music is structured: possibly by folder (artist/album directories). Use apiService.music.getFolders to fetch the listing (store likely has similar fetch logic for music as well
GitHub
 for folders). Display as a list or grid of either songs (with maybe an icon) or subfolders. If subfolders, allow navigating into them (similar to manga folders).
Searching music: If implemented, allow search by song name. The old UI possibly had search too (less clear, but likely yes). If apiService.music.search exists, implement a search bar.
Favorites: Support favoriting songs or albums. The backend has toggleFavorite for music
GitHub
. Implement MusicFavorites page (/music/favorites) to show favorite songs.
Music Player (MusicPlayer page, /music/player): This is the playback interface for music. The new app actually has two versions: MusicPlayer (the default, perhaps simpler UI optimized for mobile) and MusicPlayerV2 (an enhanced UI for desktop)
GitHub
. The app uses MusicPlayerRouter logic to choose which to render based on screen size or user setting
GitHub
GitHub
. Implement both as needed:
MusicPlayer (v1): Likely a straightforward player with basic controls (play/pause, next, previous, seek bar, volume). Ensure it can play through a playlist or album sequentially. Use the HTML5 <audio> element or a library to play music (react-player can handle audio as well, or you can use the Web Audio API via a simpler approach since an audio tag might suffice). The old code might have directly manipulated an <audio> element (frontend/src/pages/music/player.js would reveal this).
MusicPlayerV2: This probably provides a more advanced or interactive UI (maybe waveform seek bar, queue management, etc.). If not fully implemented yet, at least scaffold it so that on larger screens it provides a richer experience (perhaps with the playlist visible, album art, etc.). The selection between v1 and v2 is based on useMusicStore.playerSettings.playerUI which can be 'v2' or not
GitHub
. Make sure that setting (likely toggled in the Settings page) switches the UI.
Playback logic: When a user clicks a song (from MusicHome or from a playlist), navigate to /music/player (or just open the player component perhaps as a fixed bottom player?). The new design might have the music player as a separate route or possibly as a persistent footer (some apps keep a mini-player visible). The App routes show /music/player as a route that renders the player full-screen outside the main layout
GitHub
 (similar to how video player and manga reader are full-screen routes).
Retrieve the list of songs to play (if an album or folder was clicked, fetch its songs). Possibly apiService.music.getFolders returns an object with songs or similar. Or there might be a separate API like getSongs.
Manage playback state in useMusicStore: There should be state for current track, playback status, volume, etc. If not present, you might need to add it or manage within the player component.
Implement controls: play/pause button, next/prev track (if a queue), seek slider that updates as song progresses, volume control, and a way to exit player (e.g. a close or back button to go back to browsing).
If the old app had playlists (user-created playlists of songs), integrate that: The new route /music/playlists (MusicPlaylists page) indicates the user can view and manage playlists. Implement:
Listing all playlists (these could be stored in the SQLite DB tables playlists and playlist_items).
Creating a new playlist, renaming, deleting.
Viewing a playlist’s songs and an option to play the playlist (which would essentially set the player’s queue to that playlist).
Adding or removing a song from playlists (the old UI likely had a context menu for each song to "Add to Playlist" – playlistMenu.js).
The backend likely provides endpoints (perhaps apiService.music.createPlaylist, addToPlaylist, etc.). If not obvious, these might need to be implemented, but given the DB structure, assume the API exists. If unsure, you can ask for the relevant backend files (e.g. any file mentioning playlist in backend/api).
Music Player UI/UX: Make it user-friendly – show track title, maybe artist (if available), and if possible album art or a placeholder image. The old UI might not have album art unless the file’s folder has an image. If backend extracts music metadata (the dependency music-metadata suggests it might), perhaps an API gives album art URL. If not, this can be an enhancement for later (not critical for functionality).
Ensure that the favorites functionality for music is accessible (maybe a heart icon on the player to favorite the current song, or on lists next to each song).
Settings and Other Pages:
Settings Page (/settings): The new app has a Settings page route
GitHub
GitHub
. Implement it to allow the user to configure preferences. Possible settings to include:
Dark Mode: A toggle for dark/light theme (hooked to useUIStore.toggleDarkMode()).
Music Player UI preference: Toggle between Music Player v1 and v2 (this would update useMusicStore.playerSettings.playerUI).
Manga Settings: Options like using database vs disk for loading (the mangaSettings.useDb, gridLoadFromDb, etc. in store
GitHub
), toggling lazy loading images, recent history tracking, etc. Expose these as checkboxes or toggles so user can turn features on/off.
Clear Cache: A button to clear cached data (the store has useSharedSettingsStore.clearAllCache() which clears local caches
GitHub
). Also a way to clear recent view history (store has clearRecentHistory(type, sourceKey, rootFolder)
GitHub
GitHub
). Wire these to buttons in settings (e.g. “Clear all caches”, “Clear recently viewed history”).
About/Info: Optionally, display app version or author info if needed.
NotFound (404) Page: The App has a catch-all route for not found
GitHub
. You can implement a simple message or redirect on unknown routes.
Common Layout and Navigation: The Layout component (components/common/Layout.jsx) likely contains the main shell (header, sidebar, etc.). Ensure that:
The header has navigation links or at least a title and perhaps a menu for settings. For example, a common header might show buttons for Home, toggling sidebar (if sidebar exists for navigation between sections), and maybe current source info.
The sidebar (if any) lists the different sections (Manga, Movie, Music, Settings). In the old UI, there was likely a sidebar for navigating within a section (for manga, maybe listing subfolders or options). The new UI might unify navigation differently. If a sidebar is implemented (see useUIStore.sidebarOpen state
GitHub
 and toggleSidebar()), then include it in Layout for desktop view or overlay for mobile.
Include a loading indicator global state: useUIStore.loading is true while data is loading (set in Home when fetching sources
GitHub
, in store fetch actions
GitHub
). Possibly the Layout or a top-level component should show a spinner or progress bar when any loading is true.
Integration with Backend APIs
Leverage the existing backend API endpoints via the apiService utilities rather than writing fetch calls from scratch (to keep code consistent and handle errors uniformly). The project already defines apiService (likely in src/utils/api.js) which has methods namespaced by content type. Use these methods for all data operations:
Manga APIs: apiService.manga.getFolders(params) – fetch list of folders or images for manga. params typically include key (sourceKey), root (rootFolder), path (subpath), and mode ('path' for normal listing, 'search' for search results, 'random' for random picks, 'top' for top viewed, etc.), as well as useDb flag. The response data structure needs to be handled (as seen in store: it can return data.type being 'folder' or 'reader' and different fields
GitHub
GitHub
).
Similarly, apiService.manga.getFavorites() returns an array of favorite items. apiService.manga.toggleFavorite(sourceKey, itemPath, newState) to add/remove a favorite. Use these to implement the favorite toggling logic (and update UI optimistically for responsiveness).
If available, use apiService.manga.search(query) for search (or getFolders with mode search as mentioned). Also look for apiService.manga.resetCache for the "Reset cache" feature (old UI had a button to clear cache for current root
GitHub
GitHub
, which hit DELETE /api/manga/reset-cache?root=<rootFolder>). If not already wrapped in apiService, you can call fetch directly for this endpoint when user clicks "Reset cache".
Movie APIs: apiService.movie.getFolders(params) for listing movies/folders, apiService.movie.getFavorites(), apiService.movie.toggleFavorite(). Also apiService.movie.checkEmpty({ key }) and apiService.movie.scan({ key }) as used on Home to ensure the movie DB is populated
GitHub
. Use these to handle scanning. If search is needed, apiService.movie.search(query) (if exists) or similar function should be used for movie search. The movie data might include a structure with folders and maybe files or a way to identify playable items. Ensure to call the appropriate API when user wants to play a movie (for example, maybe apiService.movie.getVideoDetails(path) to get a streaming URL). If such function is not obvious, the video might just be played by constructing a URL like http://<server>/api/movie/stream?path=<...> – check backend if needed.
Music APIs: apiService.music.getFolders(params) for listing music (folders or songs), apiService.music.getFavorites(), apiService.music.toggleFavorite(). Possibly apiService.music.getPlaylists() and related endpoints for playlist management (if not in apiService, then endpoints might be /api/music/playlists etc.). Use these to implement the playlists page (fetch all playlists, create new via a POST, add song to playlist via POST or PUT, remove via DELETE, etc.). Also, if needed, apiService.music.scan({ key }) if music sources require initial scanning like movies (not certain, but keep in mind). For playing a song, possibly apiService.music.stream(path) or just use an <audio src="/path/to/file.mp3">. The backend might serve files under a static route (maybe the media files are under a public directory). If not sure, look at how the old music player obtains the file URL (in frontend/src/pages/music/player.js).
Security and Authentication: The app uses a token for secure sources. The login modal presumably, upon user entering a password, calls an API (maybe /api/login?sourceKey=X) to get a token. The LoginModal component likely handles this (check its code to use the correct endpoint and logic). Ensure that token is stored via useAuthStore.setToken() and subsequent requests include it (the backend might expect an Authorization header or the token might be managed via cookies/localStorage). The new apiService might automatically include the token if present in useAuthStore. If not, you may need to configure axios to attach the token for protected routes. Also note: secureKeys (list of keys that require auth) is loaded on Home
GitHub
; these are saved in useAuthStore.secureKeys. The function isSecureKey(key) in store helps determine if a key is secure
GitHub
. Use that to prompt login when needed.
Performance considerations: Where possible, use caching to minimize API calls:
The app caches folder data in memory/localStorage (see getMangaCache/setMangaCache in utils/mangaCache.js and similar for others). This prevents re-fetching data when navigating back and forth. Ensure that after fetching data, you store it via these utilities, and check cache before fetching (the store already does this for manga
GitHub
GitHub
, likely similar for movie/music).
Avoid duplicate concurrent requests: The store code uses maps like musicFetchInFlight to deduplicate in-flight requests
GitHub
. If you introduce new asynchronous calls (like a new search component or playlist fetch outside the store), consider implementing similar deduping or at least check if data is already loading.
The new React Query (TanStack) is available, but it seems the app is mainly using custom Zustand actions for fetching. You can continue using the store methods to keep things consistent. React Query could be used for some components if desired, but given the setup, sticking to the store’s API might be simpler.
Implementation Guidelines
When rewriting each part of the frontend into React, preserve the functionality and logic of the old code while refactoring into React paradigms:
Do a thorough comparison between the old JS files and the new React components to ensure nothing is left out. For example, if old frontend/src/core/ui.js contains various helper functions (toggleSidebar, showToast, etc.), make sure the new equivalent exists (in store or as component logic). Many of these have been moved to Zustand (e.g. useUIStore.toggleSidebar, useUIStore.showToast correspond to the old ones). Verify each function:
toggleDarkMode – now useUIStore.toggleDarkMode.
toggleSearchBar – likely replaced by a state controlling search input focus or a route; if not, consider adding a method to toggle a search modal.
setupSidebar – in React, layout handles sidebar rendering, but ensure initial state (closed by default) and toggling works.
goHome – in React, use navigate('/').
etc.
Also port any small utilities (the old storage.js, folder.js, events.js, etc.); their logic might already be integrated or may need to be reimplemented as needed (e.g. setupGlobalClickToCloseUI – possibly not needed if using React events and state).
Test each feature after implementing: Once you write the React component for a page, simulate the user flows:
Start at Home: load sources (simulate secure and non-secure scenarios).
Select a manga source (secure and non-secure), go to MangaSelect, choose root, go to MangaHome.
In MangaHome: try searching, opening a series, toggling dark mode, refreshing random, etc.
Navigate to reader, flip through pages, adjust settings.
Try movie flow: select movie source, ensure scan if needed, open movie list, search, play a movie.
Try music: open music, navigate into folders, play a song, try playlist creation if possible.
Mark items as favorite in each section, verify they appear in favorites page and that unfavoriting updates correctly.
Use the Settings page toggles and ensure they affect the app (try toggling player UI, dark mode, etc., and see results).
Check that the app handles edge cases gracefully (no source selected, network error, empty lists, etc., all should show appropriate messages not crashes or blank pages).
Throughout development, do not assume missing details – if a part of the old functionality is not fully understood or if you suspect an API, constant, or helper function that you don’t have on hand, request the relevant file or clarification instead of making it up. For instance, if you need to know how playlists are structured, ask for the backend playlist API or the old playlistMenu.js for reference. This ensures accuracy and completeness in the migrated app
GitHub
. Finally, maintain a high code quality. The end result should look like a natural continuation of the existing React codebase, with consistent style, proper component abstractions, and no leftover unused code (remove any console.log used for debugging unless it's purposeful like logging cache usage or errors with clear messages). Important: When providing the final code implementation, output all code in Vietnamese comments and strings where applicable (UI text should remain Vietnamese as in original, e.g. error messages like "Lỗi tải danh sách source"), and include very clear Vietnamese comments for each line or section of code explaining what it does. The explanation should be so thorough that another developer can follow along line-by-line. The answer (code and comments) should be in Vietnamese language for the comments and any explanatory notes, while keeping identifiers and keywords in English as per coding conventions. This ensures the code is well-documented and accessible to the team. Note: The AI’s response (the migrated code and any explanation) must be in Vietnamese, with clear comments on every significant line as instructed.