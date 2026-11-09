// 📁 src/utils/mangaCache.js
// 📦 Manga cache utilities
//
// ⚡ Giới hạn & dọn dẹp (PERFORMANCE-CACHE-REPORT PF8). Trước đây mỗi thư mục đã mở được lưu
// nguyên danh sách vào localStorage, mục hết hạn chỉ bị xoá khi đọc lại đúng key đó, còn khi đầy
// thì setItem lỗi im lặng. localStorage chỉ có ~5 MB và dùng chung với favorites, cài đặt, token
// (zustand persist), nên đầy là những dữ liệu đó cũng không lưu được nữa.
// Giờ đây:
// - tối đa MAX_ENTRIES thư mục (bỏ các mục cũ nhất khi vượt)
// - mục quá lớn (thư mục hàng nghìn ảnh) không lưu vào localStorage
// - mục hết hạn được dọn một lần khi app khởi động
// - localStorage đầy → xoá folder cache cũ để lấy chỗ rồi thử lại một lần
// Dữ liệu lưu và cách đọc giữ nguyên như trước.

import { CACHE_CONFIG } from '@/constants/cacheKeys';
import { getFolderCacheKey } from '@/constants/cacheKeys';

const KEY_PREFIX = `react-${CACHE_CONFIG.MANGA.FOLDER_CACHE_PREFIX}`; // 'react-folderCache::'
const MAX_ENTRIES = 60;
const PRUNE_TO = 45; // dọn xuống mức này để không phải dọn ở mỗi lần ghi
const MAX_ENTRY_CHARS = 250_000; // ~0,5 MB (localStorage tính theo ký tự UTF-16)

/**
 * Tạo cache key cho manga folder
 * @param {string} sourceKey
 * @param {string} rootFolder
 * @param {string} path
 * @returns {string|null}
 */
const getCacheKey = (sourceKey, rootFolder, path) => {
  if (!sourceKey || !rootFolder) return null;
  try {
    return getFolderCacheKey('manga', sourceKey, rootFolder, path);
  } catch (error) {
    console.warn('Error generating manga cache key:', error);
    // Fallback to old pattern for compatibility
    return `${KEY_PREFIX}${sourceKey}::${rootFolder}::${path || ''}`;
  }
};

/** Mọi key folder cache manga đang có, kèm timestamp (0 nếu đọc lỗi → bị dọn trước) */
const listEntries = () => {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    let timestamp = 0;
    try {
      timestamp = JSON.parse(localStorage.getItem(key))?.timestamp || 0;
    } catch {
      timestamp = 0;
    }
    entries.push({ key, timestamp });
  }
  return entries;
};

const isExpired = (timestamp) => Date.now() - timestamp > CACHE_CONFIG.MANGA.CACHE_EXPIRATION;

/**
 * Bỏ mục hết hạn, rồi bỏ mục cũ nhất cho tới khi còn `keep` mục.
 * @returns {number} số mục đã xoá
 */
const pruneEntries = (keep) => {
  let removed = 0;
  try {
    const entries = listEntries();
    const alive = [];
    for (const entry of entries) {
      if (isExpired(entry.timestamp)) {
        localStorage.removeItem(entry.key);
        removed++;
      } else {
        alive.push(entry);
      }
    }
    if (alive.length > keep) {
      alive.sort((a, b) => a.timestamp - b.timestamp); // cũ → mới
      for (const entry of alive.slice(0, alive.length - keep)) {
        localStorage.removeItem(entry.key);
        removed++;
      }
    }
  } catch (error) {
    console.warn('Error pruning manga cache:', error);
  }
  return removed;
};

const countEntries = () => {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith(KEY_PREFIX)) n++;
  }
  return n;
};

const isQuotaError = (error) =>
  error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22);

// Dọn mục hết hạn một lần khi app khởi động (để sau lần render đầu)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  setTimeout(() => pruneEntries(MAX_ENTRIES), 3000);
}

/**
 * Lấy manga folder data từ cache (localStorage)
 * @param {string} sourceKey
 * @param {string} rootFolder
 * @param {string} path
 * @returns {any|null}
 */
export const getMangaCache = (sourceKey, rootFolder, path) => {
  const key = getCacheKey(sourceKey, rootFolder, path);
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { timestamp, data } = JSON.parse(raw);

    // Cache hết hạn sau một khoảng thời gian
    if (isExpired(timestamp)) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting manga cache:", error);
    return null;
  }
};

/**
 * Lưu manga folder data vào cache (localStorage)
 * @param {string} sourceKey
 * @param {string} rootFolder
 * @param {string} path
 * @param {any} data
 */
export const setMangaCache = (sourceKey, rootFolder, path, data) => {
  const key = getCacheKey(sourceKey, rootFolder, path);
  if (!key) return;

  let serialized;
  try {
    serialized = JSON.stringify({ data, timestamp: Date.now() });
  } catch (error) {
    console.error("Error serializing manga cache:", error);
    return;
  }

  if (serialized.length > MAX_ENTRY_CHARS) {
    // Quá lớn: không lưu (vẫn tải lại từ server được), và bỏ bản cũ để không đọc nhầm dữ liệu cũ
    try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
    return;
  }

  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (!isQuotaError(error)) {
      console.error("Error setting manga cache:", error);
      return;
    }
    // localStorage đầy: nhường chỗ bằng cách bỏ phần lớn folder cache cũ rồi thử lại một lần
    pruneEntries(Math.floor(PRUNE_TO / 3));
    try {
      localStorage.setItem(key, serialized);
    } catch (retryError) {
      console.warn("Manga cache skipped: localStorage is full", retryError);
      return;
    }
  }

  if (countEntries() > MAX_ENTRIES) pruneEntries(PRUNE_TO);
};

/**
 * Xóa toàn bộ manga cache
 */
export const clearAllMangaCache = () => {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log("🧹 All React manga cache cleared.");
    } catch (error) {
        console.error("Error clearing all manga cache:", error);
    }
}

// Cho test
export const __mangaCacheLimits = { MAX_ENTRIES, PRUNE_TO, MAX_ENTRY_CHARS, KEY_PREFIX };
