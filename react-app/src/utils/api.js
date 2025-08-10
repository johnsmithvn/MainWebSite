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

// Build a stable key for GET requests
const buildGetKey = (url, params = {}) => {
  try {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) usp.append(k, String(v));
    });
    return `${url}?${usp.toString()}`;
  } catch {
    return `${url}|${JSON.stringify(params || {})}`;
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
    getFolders: (params) => {
      const url = `${API.ENDPOINTS.MANGA}/folder-cache`;
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
    getVideoCache: (params) => api.get(`${API.ENDPOINTS.MOVIE}/video-cache`, { params }),
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
    getAudioCache: (params) => api.get(`${API.ENDPOINTS.MUSIC}/audio-cache`, { params }),
    getFavorites: (params) => api.get(`${API.ENDPOINTS.MUSIC}/favorite`, { params }),
    toggleFavorite: (dbkey, path, value) => api.post(`${API.ENDPOINTS.MUSIC}/favorite`, { dbkey, path, value }),
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
