// Import database constants
import { DATABASE, CACHE } from '../constants/index.js';

// Use centralized database configuration
const { NAME: DB_NAME, STORE, VERSION: DB_VERSION } = DATABASE.OFFLINE_MANGA;

// Import shared utilities
import { formatBytes } from './formatters';
import { isCachesAPISupported, getUnsupportedMessage, logBrowserSupport } from './browserSupport';

// Domain-level CORS capability cache to avoid double requests
const corsCapabilityCache = new Map();

/**
 * Check if domain supports CORS (cached to avoid repeated requests)
 */
const checkCorsSupport = async (url) => {
  try {
    const domain = new URL(url).origin;
    
    // Return cached result if available
    if (corsCapabilityCache.has(domain)) {
      return corsCapabilityCache.get(domain);
    }
    
    // Test CORS with a lightweight HEAD request (shorter timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
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
};

// Export for testing and maintenance
export { DB_VERSION };

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(type, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, type);
    const store = tx.objectStore(STORE);
    let request;
    try {
      request = callback(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export function getChapters() {
  return withStore('readonly', (store) => store.getAll());
}

export function getChapter(id) {
  return withStore('readonly', (store) => store.get(id));
}

export function saveChapter(chapter) {
  return withStore('readwrite', (store) => store.put(chapter));
}

export function deleteChapter(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

// 🗑️ CACHE CLEANUP: Xóa chapter hoàn toàn (metadata + images)
export async function deleteChapterCompletely(id) {
  try {
    console.log('🗑️ Starting complete deletion for chapter:', id);
    
    // 1. Lấy metadata để biết có những images nào cần xóa
    const chapter = await getChapter(id);
    if (!chapter) {
      console.warn('⚠️ Chapter not found in IndexedDB:', id);
      return { success: false, message: 'Chapter not found' };
    }
    
    // 2. Kiểm tra Caches API có sẵn không trước khi sử dụng
    if (!isCachesAPISupported()) {
      console.warn('⚠️ Caches API not available, skipping cache cleanup');
      // Chỉ xóa metadata từ IndexedDB
      await deleteChapter(id);
      return { 
        success: true, 
        message: 'Chapter metadata deleted (cache API not available)',
        stats: {
          totalImages: chapter.pageUrls ? chapter.pageUrls.length : 0,
          deletedImages: 0,
          failedImages: 0,
          bytesFreed: chapter.bytes || 0
        }
      };
    }
    
    // 3. Xóa tất cả images từ Cache Storage
    const cache = await caches.open('chapter-images');
    let deletedImages = 0;
    let failedImages = 0;
    
    if (chapter.pageUrls && chapter.pageUrls.length > 0) {
      for (const url of chapter.pageUrls) {
        try {
          const deleted = await cache.delete(url);
          if (deleted) {
            deletedImages++;
            console.log('✅ Deleted image from cache:', url.split('/').pop());
          } else {
            console.warn('⚠️ Image not found in cache:', url.split('/').pop());
          }
        } catch (err) {
          failedImages++;
          console.error('❌ Failed to delete image from cache:', url.split('/').pop(), err);
        }
      }
    }
    
    // 4. Xóa metadata từ IndexedDB
    await deleteChapter(id);
    
    const totalImages = chapter.pageUrls ? chapter.pageUrls.length : 0;
    const message = `Deleted ${deletedImages}/${totalImages} images and metadata`;
    
    console.log('✅ Chapter deleted completely:', {
      id,
      totalImages,
      deletedImages,
      failedImages,
      bytes: chapter.bytes || 0
    });
    
    return { 
      success: true, 
      message,
      stats: {
        totalImages,
        deletedImages,
        failedImages,
        bytesFreed: chapter.bytes || 0
      }
    };
    
  } catch (error) {
    console.error('❌ Error deleting chapter completely:', error);
    return { 
      success: false, 
      message: error.message,
      error: error.name 
    };
  }
}

// 🧹 BULK CLEANUP: Xóa tất cả chapters và cache
export async function clearAllOfflineData() {
  try {
    console.log('🧹 Starting complete cache cleanup...');
    
    // 1. Lấy danh sách tất cả chapters
    const chapters = await getChapters();
    console.log(`📊 Found ${chapters.length} chapters to delete`);
    
    let totalBytesFreed = 0;
    let totalImagesDeleted = 0;
    
    // 2. Xóa từng chapter một cách an toàn
    for (const chapter of chapters) {
      const result = await deleteChapterCompletely(chapter.id);
      if (result.success && result.stats) {
        totalBytesFreed += result.stats.bytesFreed;
        totalImagesDeleted += result.stats.deletedImages;
      }
    }
    
    // 3. Kiểm tra Caches API có sẵn không
    if (isCachesAPISupported()) {
      // 4. Xóa toàn bộ Cache Storage (đảm bảo không còn orphan images)
      try {
        await caches.delete('chapter-images');
        console.log('✅ Deleted entire chapter-images cache');
      } catch (err) {
        console.warn('⚠️ Failed to delete cache storage:', err);
      }
      
      // 5. Recreate cache storage
      await caches.open('chapter-images');
      console.log('✅ Recreated fresh chapter-images cache');
    } else {
      console.warn('⚠️ Caches API not available, skipping cache operations');
    }
    
    const summary = {
      chaptersDeleted: chapters.length,
      imagesDeleted: totalImagesDeleted,
      bytesFreed: totalBytesFreed,
      message: `Cleared ${chapters.length} chapters, ${totalImagesDeleted} images`
    };
    
    console.log('🎉 Complete cleanup finished:', summary);
    return { success: true, ...summary };
    
  } catch (error) {
    console.error('❌ Error during complete cleanup:', error);
    return { 
      success: false, 
      message: error.message,
      error: error.name 
    };
  }
}

// 📊 STORAGE ANALYSIS: Phân tích storage usage
export async function getStorageAnalysis() {
  try {
    const chapters = await getChapters();
    const cache = await caches.open('chapter-images');
    
    let totalBytes = 0;
    let totalImages = 0;
    let totalChapters = chapters.length;
    
    // Tính tổng từ metadata
    for (const chapter of chapters) {
      totalBytes += chapter.bytes || 0;
      totalImages += chapter.totalPages || 0;
    }
    
    // Kiểm tra browser storage quota
    let quotaInfo = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaInfo = {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
        };
      } catch (err) {
        console.warn('⚠️ Failed to get storage estimate:', err);
      }
    }
    
    return {
      chapters: {
        count: totalChapters,
        totalBytes,
        totalImages,
        averageBytesPerChapter: totalChapters > 0 ? Math.round(totalBytes / totalChapters) : 0,
        averageImagesPerChapter: totalChapters > 0 ? Math.round(totalImages / totalChapters) : 0
      },
      quota: quotaInfo,
      formattedSize: formatBytes(totalBytes),
      cacheStoreName: 'chapter-images'
    };
    
  } catch (error) {
    console.error('❌ Error analyzing storage:', error);
    return null;
  }
}

// 📊 Get storage analysis by specific source
export async function getStorageAnalysisBySource(sourceKey) {
  try {
    const allChapters = await getChapters();
    
    // Filter chapters by source
    const chapters = allChapters.filter((chapter) => {
      const key = chapter?.sourceKey || 'UNKNOWN_SOURCE';
      return key === sourceKey;
    });
    
    const cache = await caches.open('chapter-images');
    
    let totalBytes = 0;
    let totalImages = 0;
    let totalChapters = chapters.length;
    
    // Tính tổng từ metadata của source cụ thể
    for (const chapter of chapters) {
      totalBytes += chapter.bytes || 0;
      totalImages += chapter.totalPages || 0;
    }
    
    // Kiểm tra browser storage quota (vẫn lấy tổng cho toàn bộ storage)
    let quotaInfo = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaInfo = {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
        };
      } catch (err) {
        console.warn('⚠️ Failed to get storage estimate:', err);
      }
    }
    
    return {
      chapters: {
        count: totalChapters,
        totalBytes,
        totalImages,
        averageBytesPerChapter: totalChapters > 0 ? Math.round(totalBytes / totalChapters) : 0,
        averageImagesPerChapter: totalChapters > 0 ? Math.round(totalImages / totalChapters) : 0
      },
      quota: quotaInfo,
      formattedSize: formatBytes(totalBytes),
      sourceKey: sourceKey,
      cacheStoreName: 'chapter-images'
    };
    
  } catch (error) {
    console.error('❌ Error analyzing storage by source:', error);
    return null;
  }
}

// Kiểm tra xem chapter đã được download hay chưa
export async function isChapterDownloaded(id) {
  try {
    const chapter = await getChapter(id);
    return !!chapter;
  } catch (err) {
    console.error('Error checking chapter download status:', err);
    return false;
  }
}

// Download chapter với progress callback
export async function downloadChapter(meta, onProgress = null) {
  const { id, pageUrls } = meta;
  
  // Kiểm tra Caches API có sẵn không
  if (!isCachesAPISupported()) {
    const errorMsg = getUnsupportedMessage('Offline chapter download');
    console.error('❌ Caches API not available:', errorMsg);
    throw new Error(errorMsg);
  }
  
  const cache = await caches.open('chapter-images');
  let bytes = 0;
  const totalPages = pageUrls.length;
  
  // Báo cáo tiến trình bắt đầu
  if (onProgress) {
    onProgress({ current: 0, total: totalPages, status: 'starting' });
  }
  
  // Get cover image (first page) for thumbnail
  const coverImage = pageUrls.length > 0 ? pageUrls[0] : null;
  
  for (let i = 0; i < pageUrls.length; i++) {
    const url = pageUrls[i];
    
    try {
      // Báo cáo tiến trình downloading từng trang
      if (onProgress) {
        onProgress({ 
          current: i, 
          total: totalPages, 
          status: 'downloading',
          currentUrl: url
        });
      }
      
      // Check CORS support for this domain (cached)
      const supportsCors = await checkCorsSupport(url);
      const fetchOptions = { mode: supportsCors ? 'cors' : 'no-cors' };
      const resp = await fetch(url, fetchOptions);
      const isNoCorsMode = !supportsCors;
      
      // Check response status only for CORS mode (no-cors responses are always opaque)
      if (!isNoCorsMode && !resp.ok) {
        throw new Error(`Failed to fetch ${url}: ${resp.status}`);
      }
      
      await cache.put(url, resp.clone());
      
      // Calculate size only if we can read the response body
      if (isNoCorsMode || resp.type === 'opaque') {
        // No-cors mode or opaque response - can't read body, use estimate
        console.warn(`Using size estimate for ${url} (no-cors/opaque response)`);
        bytes += CACHE.FALLBACK_IMAGE_SIZE_BYTES; // Use constant instead of hardcoded value
      } else {
        try {
          const blob = await resp.blob();
          bytes += blob.size;
        } catch (err) {
          console.warn(`Failed to calculate blob size for ${url}:`, err);
          bytes += CACHE.FALLBACK_IMAGE_SIZE_BYTES; // Use constant instead of hardcoded value
        }
      }
    } catch (err) {
      console.error(`Error downloading page ${i + 1}:`, err);
      // Tiếp tục với trang tiếp theo thay vì dừng hoàn toàn
      if (onProgress) {
        onProgress({ 
          current: i, 
          total: totalPages, 
          status: 'error',
          error: err.message
        });
      }
    }
  }
  
  // Enhanced metadata với cover image và title extraction
  const enhancedMeta = {
    ...meta,
    bytes,
    totalPages: pageUrls.length,
    coverImage,
    // Cải thiện title extraction
    mangaTitle: meta.mangaTitle || extractMangaTitle(meta.id),
    chapterTitle: meta.chapterTitle || extractChapterTitle(meta.id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Lưu metadata vào IndexedDB
  await saveChapter(enhancedMeta);
  
  // Báo cáo hoàn thành
  if (onProgress) {
    onProgress({ 
      current: totalPages, 
      total: totalPages, 
      status: 'completed',
      totalBytes: bytes
    });
  }
  
  return { success: true, bytes, totalPages };
}

// Helper functions để extract title từ path
function extractMangaTitle(path) {
  if (!path) return 'Unknown Manga';
  
  // Remove __self__ suffix if exists
  const cleanPath = path.replace(/\/__self__$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  
  // For this app: path structure is "ROOT/MangaName"
  // So the last part IS the manga title, not parent folder
  return parts[parts.length - 1] || 'Unknown Manga';
}

function extractChapterTitle(path) {
  if (!path) return 'Unknown Chapter';
  
  // Remove __self__ suffix if exists
  const cleanPath = path.replace(/\/__self__$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  
  // Return last folder as chapter title (same as manga title since no separate chapters)
  return parts[parts.length - 1] || 'Unknown Chapter';
}
