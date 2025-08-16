// 📁 src/utils/api.js
// 🌐 API utilities

import axios from 'axios';
import { API } from '@/constants';

// Create axios instance
const api = axios.create({
  baseURL: '', // Use relative URLs to leverage Vite proxy
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-flight GET requests dedup map (keyed by full URL + params)
const inflightGet = new Map();
// Short-lived response cache to avoid immediate duplicate server hits
const recentGetCache = new Map(); // key -> { ts, data }
const RECENT_CACHE_TTL_MS = 1500;

// Build a stable key for GET requests
const buildGetKey = (url, params = {}) => {
  try {
    const usp = new URLSearchParams();
    // Normalize order by sorting keys for stable cache keys
    const entries = Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    for (const [k, v] of entries) {
      usp.append(k, String(v));
    }
    return `${url}?${usp.toString()}`;
  } catch {
    // Fallback: sort keys in JSON as well
    const sorted = Object.keys(params || {})
      .sort()
      .reduce((acc, k) => { acc[k] = params[k]; return acc; }, {});
    return `${url}|${JSON.stringify(sorted)}`;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // Manga APIs
  manga: {
    // Accept optional axios config (e.g., { signal })
    getFolders: (params, config = {}) => {
      const url = `${API.ENDPOINTS.MANGA}/folder-cache`;
      const key = buildGetKey(url, params);

      // Serve from recent cache if within TTL
      const cached = recentGetCache.get(key);
      if (cached && Date.now() - cached.ts < RECENT_CACHE_TTL_MS) {
        return Promise.resolve({ data: cached.data });
      }

      // If a signal is provided, do NOT share in-flight requests.
      // React StrictMode mounts can abort the first request; sharing would cancel the second one too.
      if (!config?.signal) {
        // In-flight dedupe only when there is no AbortSignal
        if (inflightGet.has(key)) {
          return inflightGet.get(key);
        }

        const req = api
          .get(url, { params, ...config })
          .then((resp) => {
            try {
              recentGetCache.set(key, { ts: Date.now(), data: resp.data });
            } catch {}
            return resp;
          })
          .finally(() => {
            inflightGet.delete(key);
          });

        inflightGet.set(key, req);
        return req;
      }

      // With AbortSignal: always create a fresh request bound to that signal
      return api
        .get(url, { params, ...config })
        .then((resp) => {
          try {
            recentGetCache.set(key, { ts: Date.now(), data: resp.data });
          } catch {}
          return resp;
        });
    },
    getFavorites: (params) => {
      const url = `${API.ENDPOINTS.MANGA}/favorite`;
      const key = buildGetKey(url, params);
      if (inflightGet.has(key)) {
        return inflightGet.get(key);
      }
      const req = api.get(url, { params }).finally(() => {
        inflightGet.delete(key);
      });
      inflightGet.set(key, req);
      return req;
    },
    toggleFavorite: (dbkey, path, value) => api.post(`${API.ENDPOINTS.MANGA}/favorite`, { dbkey, path, value }),
    resetCache: (params) => api.delete(`${API.ENDPOINTS.MANGA}/reset-cache`, { params }),
    scan: (root, key) => api.post(`${API.ENDPOINTS.MANGA}/scan`, { root, key }),
    getRootThumbnail: (params) => api.get(`${API.ENDPOINTS.MANGA}/root-thumbnail`, { params }),
    setRootThumbnail: (data) => api.post(`${API.ENDPOINTS.MANGA}/root-thumbnail`, data),
  },

  // Movie APIs
  movie: {
    getFolders: (params) => {
      const url = `${API.ENDPOINTS.MOVIE}/movie-folder`;
      const key = buildGetKey(url, params);
      if (inflightGet.has(key)) {
        return inflightGet.get(key);
      }
      const req = api.get(url, { params }).finally(() => {
        inflightGet.delete(key);
      });
      inflightGet.set(key, req);
      return req;
    },
  getVideos: (params) => api.get(`${API.ENDPOINTS.MOVIE}/video`, { params }),
  // Accept optional axios config (e.g., { signal }) for abortable requests
  getVideoCache: (params, config = {}) => api.get(`${API.ENDPOINTS.MOVIE}/video-cache`, { params, ...config }),
    getFavorites: (params) => api.get(`${API.ENDPOINTS.MOVIE}/favorite-movie`, { params }),
    toggleFavorite: (dbkey, path, value) => api.post(`${API.ENDPOINTS.MOVIE}/favorite-movie`, { dbkey, path, value }),
    extractThumbnail: (params) => api.post(`${API.ENDPOINTS.MOVIE}/extract-movie-thumbnail`, params),
    setThumbnail: (params) => api.post(`${API.ENDPOINTS.MOVIE}/set-thumbnail`, params),
    resetDb: (params) => api.delete(`${API.ENDPOINTS.MOVIE}/reset-movie-db`, { params }),
    scan: (params) => api.post(`${API.ENDPOINTS.MOVIE}/scan-movie`, params),
    checkEmpty: (params) => api.get(`${API.ENDPOINTS.MOVIE}/movie-folder-empty`, { params }),
  },

  // Music APIs
  music: {
    // Deduplicate in-flight folder requests
    getFolders: (params) => {
      const url = `${API.ENDPOINTS.MUSIC}/music-folder`;
      const key = buildGetKey(url, params);
      if (inflightGet.has(key)) {
        return inflightGet.get(key);
      }
      const req = api.get(url, { params }).finally(() => {
        inflightGet.delete(key);
      });
      inflightGet.set(key, req);
      return req;
    },
  getAudio: (params) => api.get(`${API.ENDPOINTS.MUSIC}/audio`, { params }),
  // Accept optional axios config (e.g., { signal }) for abortable requests
  getAudioCache: (params, config = {}) => api.get(`${API.ENDPOINTS.MUSIC}/audio-cache`, { params, ...config }),
    getPlaylists: (params) => api.get(`${API.ENDPOINTS.MUSIC}/playlists`, { params }),
    getPlaylist: (id, params) => api.get(`${API.ENDPOINTS.MUSIC}/playlist/${id}`, { params }),
    createPlaylist: (data) => api.post(`${API.ENDPOINTS.MUSIC}/playlists`, data),
    updatePlaylist: (id, data) => api.put(`${API.ENDPOINTS.MUSIC}/playlist/${id}`, data),
    deletePlaylist: (id) => api.delete(`${API.ENDPOINTS.MUSIC}/playlist/${id}`),
    getMusicMeta: (params) => api.get(`${API.ENDPOINTS.MUSIC}/music-meta`, { params }),
    extractThumbnail: (params) => api.post(`${API.ENDPOINTS.MUSIC}/extract-thumbnail`, params),
    setThumbnail: (params) => api.post(`${API.ENDPOINTS.MUSIC}/set-thumbnail`, params),
    resetDb: (params) => api.delete(`${API.ENDPOINTS.MUSIC}/reset-music-db`, { params }),
    scan: (params) => api.post(`${API.ENDPOINTS.MUSIC}/scan-music`, params),
  },

  // System APIs
  system: {
    getSourceKeys: () => api.get(`${API.ENDPOINTS.SYSTEM}/source-keys.js`),
    getSecurityKeys: () => api.get(`${API.ENDPOINTS.SYSTEM}/security-keys.js`),
    listRoots: (params) => {
      const url = `${API.ENDPOINTS.SYSTEM}/list-roots`;
      const key = buildGetKey(url, params);
      if (inflightGet.has(key)) {
        return inflightGet.get(key);
      }
      const req = api.get(url, { params }).finally(() => {
        inflightGet.delete(key);
      });
      inflightGet.set(key, req);
      return req;
    },
    login: (data) => api.post(`${API.ENDPOINTS.SYSTEM}/login`, data),
    // Back-compat: default increaseView targets movie
    increaseView: (params) => api.post(`/api/increase-view/movie`, params),
    // Explicit methods
    increaseViewMovie: (params) => api.post(`/api/increase-view/movie`, params),
    increaseViewManga: (params) => api.post(`/api/increase-view`, params),
  },
};

export default api;
