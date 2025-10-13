/**
 * Download Worker
 * 
 * Singleton worker class that handles background download processing
 * Integrates with downloadQueueStore for task management
 * 
 * Features:
 * - Concurrent download management (respects max limit from store)
 * - Image downloading with CORS support detection
 * - Cache API integration for storage
 * - Progress tracking with real-time callbacks
 * - Error handling with retry support
 * - Cancellation via AbortController
 * - IndexedDB metadata persistence
 */

import { getChapter, saveChapter } from '../utils/offlineLibrary';
import { isCachesAPISupported } from '../utils/browserSupport';
import { CACHE } from '../constants/index';
import {
  DEFAULT_DOWNLOAD_SETTINGS,
  sanitizeChunkDelay,
  sanitizeChunkSize
} from '../utils/downloadSettings';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROGRESS_UPDATE_INTERVAL = 500; // Update progress every 500ms
const CORS_CHECK_TIMEOUT = 2000; // 2s timeout for CORS check

// Domain-level CORS capability cache (shared with offlineLibrary)
const corsCapabilityCache = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if domain supports CORS (cached to avoid repeated requests)
 * @param {string} url - Image URL to check
 * @returns {Promise<boolean>}
 */
async function checkCorsSupport(url) {
  try {
    const domain = new URL(url).origin;
    
    // Return cached result if available
    if (corsCapabilityCache.has(domain)) {
      return corsCapabilityCache.get(domain);
    }
    
    // Test CORS with a lightweight HEAD request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CORS_CHECK_TIMEOUT);
      
      await fetch(url, { 
        method: 'HEAD', 
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      corsCapabilityCache.set(domain, true);
      return true;
    } catch {
      corsCapabilityCache.set(domain, false);
      return false;
    }
  } catch {
    return false; // Invalid URL
  }
}

/**
 * Download a single image and cache it
 * @param {string} url - Image URL
 * @param {Cache} cache - Cache Storage instance
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<number>} Downloaded bytes (or estimate)
 */
async function downloadImage(url, cache, signal) {
  // Check CORS support for this domain (cached)
  const supportsCors = await checkCorsSupport(url);
  const fetchOptions = { 
    mode: supportsCors ? 'cors' : 'no-cors',
    signal // Add abort signal
  };
  
  const resp = await fetch(url, fetchOptions);
  const isNoCorsMode = !supportsCors;
  
  // Check response status only for CORS mode
  if (!isNoCorsMode && !resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }
  
  // Cache the response
  await cache.put(url, resp.clone());
  
  // Calculate size
  if (isNoCorsMode || resp.type === 'opaque') {
    // No-cors mode - can't read body, use estimate
    return CACHE.FALLBACK_IMAGE_SIZE_BYTES;
  }
  
  try {
    const blob = await resp.blob();
    return blob.size;
  } catch (err) {
    console.warn(`Failed to calculate blob size for ${url}:`, err);
    return CACHE.FALLBACK_IMAGE_SIZE_BYTES;
  }
}

/**
 * Extract manga title from path
 * @param {string} path - Chapter path (format: ROOT/MangaName)
 * @returns {string}
 */
function extractMangaTitle(path) {
  if (!path) return 'Unknown Manga';
  
  const cleanPath = path.replace(/\/__self__$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  
  return parts[parts.length - 1] || 'Unknown Manga';
}

/**
 * Extract chapter title from path
 * @param {string} path - Chapter path
 * @returns {string}
 */
function extractChapterTitle(path) {
  if (!path) return 'Unknown Chapter';
  
  const cleanPath = path.replace(/\/__self__$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  
  return parts[parts.length - 1] || 'Unknown Chapter';
}

// ============================================================================
// DOWNLOAD WORKER CLASS (Singleton)
// ============================================================================

class DownloadWorker {
  constructor() {
    if (DownloadWorker.instance) {
      return DownloadWorker.instance;
    }
    
    /** @type {Map<string, AbortController>} Track active downloads */
    this.activeDownloads = new Map();
    
    /** @type {Map<string, number>} Track last progress update timestamp */
    this.lastProgressUpdate = new Map();
    
    DownloadWorker.instance = this;
  }

  /**
   * Process a download task
   * @param {Object} task - Download task from queue store
   * @param {Function} onProgress - Progress callback (currentPage, totalPages, downloadedSize)
   * @param {Function} onComplete - Completion callback
   * @param {Function} onError - Error callback
   * @returns {Promise<void>}
   */
  async processTask(task, onProgress, onComplete, onError, options = {}) {
    const { id, source, rootFolder, mangaId, chapterId } = task;
    
    console.log('[DownloadWorker] Processing task:', id);

    // Validate Caches API support
    if (!isCachesAPISupported()) {
      const error = new Error('Caches API not supported in this browser');
      onError(error);
      return;
    }

    // Check if already processing
    if (this.activeDownloads.has(id)) {
      console.warn('[DownloadWorker] Task already processing:', id);
      return;
    }

    // Create abort controller for this task
    const abortController = new AbortController();
    this.activeDownloads.set(id, abortController);
    this.lastProgressUpdate.set(id, 0);

    try {
      // ✅ Check if task already has pageUrls (from previous pause/resume)
      let pageUrls = task.pageUrls;
      
      if (!pageUrls || pageUrls.length === 0) {
        // Fetch chapter data from API (first time only)
        console.log('[DownloadWorker] Fetching chapter pages from API...');
        pageUrls = await this.fetchChapterPages(source, rootFolder, mangaId, chapterId);
        
        // ✅ SAVE pageUrls to task via callback for future resume
        if (onProgress) {
          onProgress({
            current: 0,
            total: pageUrls.length,
            status: 'fetching',
            pageUrls: pageUrls // ← Pass pageUrls to store
          });
        }
      } else {
        console.log('[DownloadWorker] ✅ Using cached pageUrls from task (', pageUrls.length, 'pages)');
      }
      
      if (!pageUrls || pageUrls.length === 0) {
        throw new Error('No pages found for this chapter');
      }

      const totalPages = pageUrls.length;
      let currentPage = 0;
      let downloadedSize = 0;

      // Open cache storage
      const cache = await caches.open('chapter-images');

      // Report starting
      this.updateProgress(id, onProgress, currentPage, totalPages, downloadedSize);

      // ✅ Get configurable chunk size and delay from provided options (with safe fallbacks)
      const {
        chunkSize = DEFAULT_DOWNLOAD_SETTINGS.chunkSize,
        chunkDelay = DEFAULT_DOWNLOAD_SETTINGS.chunkDelay
      } = options;

      const CHUNK_SIZE = sanitizeChunkSize(chunkSize);
      const CHUNK_DELAY = sanitizeChunkDelay(chunkDelay);
      
      console.log(`[DownloadWorker] Using chunk settings: size=${CHUNK_SIZE}, delay=${CHUNK_DELAY}ms`);

      // Download images in chunks for better performance
      for (let i = 0; i < pageUrls.length; i += CHUNK_SIZE) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          throw new Error('Download cancelled');
        }

        const chunk = pageUrls.slice(i, Math.min(i + CHUNK_SIZE, pageUrls.length));
        
        // Download chunk in parallel
        const results = await Promise.allSettled(
          chunk.map(url => downloadImage(url, cache, abortController.signal))
        );

        // Process results
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          currentPage++;

          if (result.status === 'fulfilled') {
            downloadedSize += result.value;
            
            // Update progress (throttled)
            this.updateProgress(id, onProgress, currentPage, totalPages, downloadedSize);
          } else {
            console.error(`[DownloadWorker] Failed to download page ${i + j + 1}:`, result.reason);
            // Continue with other pages instead of failing entire download
          }
        }
        
        // ✅ ADD DELAY between chunks to avoid overwhelming backend
        if (i + CHUNK_SIZE < pageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY));
        }
      }

      // Get cover image (first page)
      const coverImage = pageUrls.length > 0 ? pageUrls[0] : null;

      // Save metadata to IndexedDB
      const metadata = {
        id: `${source}/${mangaId}/${chapterId}`,
        source,
        sourceKey: source, // Add sourceKey for filtering
        mangaId,
        chapterId,
        mangaTitle: extractMangaTitle(`${source}/${mangaId}`),
        chapterTitle: extractChapterTitle(`${source}/${mangaId}/${chapterId}`),
        pageUrls,
        totalPages,
        bytes: downloadedSize,
        coverImage,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Check if chapter already exists (for updates)
      const existingChapter = await getChapter(metadata.id);
      if (existingChapter) {
        // Merge with existing data
        metadata.createdAt = existingChapter.createdAt;
      }

      await saveChapter(metadata);

      // Final progress update (100%)
      this.updateProgress(id, onProgress, totalPages, totalPages, downloadedSize, true);

      // Call completion callback
      onComplete({
        totalPages,
        downloadedSize,
        metadata
      });

      console.log('[DownloadWorker] Task completed:', id, {
        totalPages,
        downloadedSize: `${(downloadedSize / 1024 / 1024).toFixed(2)} MB`
      });

    } catch (error) {
      console.error('[DownloadWorker] Task failed:', id, error);
      onError(error);
    } finally {
      // Cleanup
      this.activeDownloads.delete(id);
      this.lastProgressUpdate.delete(id);
    }
  }

  /**
   * Fetch chapter page URLs from API
   * @param {string} source - Source database (e.g., 'ROOT_MANGAH')
   * @param {string} mangaId - Manga folder ID
   * @param {string} chapterId - Chapter folder ID
   * @returns {Promise<string[]>}
   */
  async fetchChapterPages(source, rootFolder, mangaId, chapterId) {
    try {
      // Construct API URL - Use /folder-cache endpoint (same as MangaReader)
      const path = `${mangaId}/${chapterId}`;
      
      // Build query params (match apiService.manga.getFolders)
      const params = new URLSearchParams({
        mode: 'path',
        path: path,
        key: source,
        root: rootFolder, // ✅ REQUIRED by backend
        useDb: '1' // Default to using DB cache
      });
      
      const apiUrl = `/api/manga/folder-cache?${params.toString()}`;
      console.log('[DownloadWorker] Fetching chapter pages:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[DownloadWorker] API response:', { 
        type: data.type, 
        hasImages: !!data.images, 
        imagesCount: data.images?.length,
        hasItems: !!data.items,
        itemsCount: data.items?.length,
        hasFolders: !!data.folders,
        foldersCount: data.folders?.length
      });
      
      // ❌ ERROR: User trying to download a folder (not a chapter)
      if (data.type === 'folder') {
        throw new Error('Cannot download folder - Please open a chapter first, then download');
      }
      
      // Extract image URLs from reader response
      // Response format: { type: 'reader', images: [...] }
      if (data.type === 'reader' && Array.isArray(data.images) && data.images.length > 0) {
        console.log('[DownloadWorker] ✅ Fetched', data.images.length, 'pages for', chapterId);
        return data.images;
      }
      
      // Fallback: Extract from items (folder format)
      if (Array.isArray(data.items) && data.items.length > 0) {
        const pageUrls = data.items
          .filter(item => item.type === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
          .map(item => item.url);
        
        if (pageUrls.length > 0) {
          console.log('[DownloadWorker] ✅ Fetched', pageUrls.length, 'pages (items format) for', chapterId);
          return pageUrls;
        }
      }
      
      // Log full response for debugging
      console.error('[DownloadWorker] ❌ Invalid response:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format: missing images or items');

    } catch (error) {
      console.error('[DownloadWorker] Failed to fetch chapter pages:', error);
      throw error;
    }
  }

  /**
   * Update progress with throttling
   * @param {string} taskId - Task ID
   * @param {Function} callback - Progress callback
   * @param {number} currentPage - Current page number
   * @param {number} totalPages - Total pages
   * @param {number} downloadedSize - Downloaded bytes
   * @param {boolean} force - Force update (skip throttling)
   */
  updateProgress(taskId, callback, currentPage, totalPages, downloadedSize, force = false) {
    if (!callback) return;

    const now = Date.now();
    const lastUpdate = this.lastProgressUpdate.get(taskId) || 0;

    // Throttle updates (except for completion)
    if (!force && (now - lastUpdate) < PROGRESS_UPDATE_INTERVAL) {
      return;
    }

    this.lastProgressUpdate.set(taskId, now);
    callback(currentPage, totalPages, downloadedSize);
  }

  /**
   * Cancel a task
   * @param {string} taskId - Task ID to cancel
   */
  cancelTask(taskId) {
    const abortController = this.activeDownloads.get(taskId);
    
    if (abortController) {
      console.log('[DownloadWorker] Cancelling task:', taskId);
      abortController.abort();
      this.activeDownloads.delete(taskId);
      this.lastProgressUpdate.delete(taskId);
    } else {
      console.warn('[DownloadWorker] Task not found or not active:', taskId);
    }
  }

  /**
   * Check if task is currently being processed
   * @param {string} taskId
   * @returns {boolean}
   */
  isProcessing(taskId) {
    return this.activeDownloads.has(taskId);
  }

  /**
   * Get count of active downloads
   * @returns {number}
   */
  getActiveCount() {
    return this.activeDownloads.size;
  }

  /**
   * Get all active task IDs
   * @returns {string[]}
   */
  getActiveTasks() {
    return Array.from(this.activeDownloads.keys());
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

const downloadWorkerInstance = new DownloadWorker();

export default downloadWorkerInstance;

// Export class for testing
export { DownloadWorker };
