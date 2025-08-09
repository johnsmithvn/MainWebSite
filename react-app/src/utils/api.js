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
    getFolders: (params) => api.get(`${API.ENDPOINTS.MANGA}/folder-cache`, { params }),
    getFavorites: (params) => api.get(`${API.ENDPOINTS.MANGA}/favorite`, { params }),
    toggleFavorite: (dbkey, path, value) => api.post(`${API.ENDPOINTS.MANGA}/favorite`, { dbkey, path, value }),
    resetCache: (params) => api.delete(`${API.ENDPOINTS.MANGA}/reset-cache`, { params }),
    scan: (root, key) => api.post(`${API.ENDPOINTS.MANGA}/scan`, { root, key }),
    getRootThumbnail: (params) => api.get(`${API.ENDPOINTS.MANGA}/root-thumbnail`, { params }),
    setRootThumbnail: (data) => api.post(`${API.ENDPOINTS.MANGA}/root-thumbnail`, data),
  },

  // Movie APIs
  movie: {
    getFolders: (params) => api.get(`${API.ENDPOINTS.MOVIE}/movie-folder`, { params }),
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
    getFolders: (params) => api.get(`${API.ENDPOINTS.MUSIC}/music-folder`, { params }),
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
    listRoots: (params) => api.get(`${API.ENDPOINTS.SYSTEM}/list-roots`, { params }),
    login: (data) => api.post(`${API.ENDPOINTS.SYSTEM}/login`, data),
    increaseView: (params) => api.post(`/api/increase-view/movie`, params),
  },
};

export default api;
