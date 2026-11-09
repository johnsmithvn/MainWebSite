// 📁 src/utils/cacheInvalidation.js
// 🧹 Xoá cache dữ liệu của một nguồn sau khi dữ liệu trên server đổi (PERFORMANCE-CACHE-REPORT PF7, PF14)
//
// Cùng một danh sách có thể nằm ở nhiều tầng: localStorage (folder cache 15', random 5'),
// React Query (5'), cache 1,5 s trong api.js. Trước đây scan xong không tầng nào bị xoá nên thư
// mục mới không hiện tới 15 phút. Hàm này được gọi tự động trong api.js sau mỗi lần
// scan / reset / xoá thành công, nên mọi nơi gọi API (Settings, DatabaseActions, Home…) đều được áp dụng.
//
// KHÔNG xoá dữ liệu của người dùng: lịch sử xem (recentViewed*), yêu thích, cài đặt.

import { queryClient } from '@/queryClient';
import { CACHE_PREFIXES } from '@/constants/cacheKeys';

const RANDOM_QUERY_NAMES = new Set(['randomItems', 'randomMovies', 'randomMusic']);
// Query đọc từ localStorage của người dùng (lịch sử) — không cần tải lại
const USER_DATA_QUERY_NAMES = new Set(['recentItems', 'recentMovies', 'recentMusic']);

const listeners = new Set();

/**
 * Đăng ký hàm được gọi mỗi khi cache của một nguồn bị xoá (VD api.js xoá cache 1,5 s của nó)
 * @returns {() => void} huỷ đăng ký
 */
export function onSourceCachesInvalidated(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Các key localStorage chứa dữ liệu dẫn xuất (dựng lại được từ server) của `sourceKey` */
function isDerivedCacheKey(key, sourceKey, includeRandom) {
  const exact = [
    `${CACHE_PREFIXES.MOVIE_FOLDER_CACHE}-${sourceKey}`,
    `${CACHE_PREFIXES.MUSIC_FOLDER_CACHE}-${sourceKey}`,
  ];
  if (exact.includes(key)) return true;
  const prefixes = [
    `${CACHE_PREFIXES.REACT_FOLDER_CACHE}::${sourceKey}::`,
    `${CACHE_PREFIXES.LEGACY_FOLDER_CACHE}::${sourceKey}::`,
    `${CACHE_PREFIXES.MANGA_CACHE}::${sourceKey}::`,
    `${CACHE_PREFIXES.MOVIE_CACHE}::${sourceKey}::`,
    `${CACHE_PREFIXES.MUSIC_CACHE}::${sourceKey}::`,
    `${CACHE_PREFIXES.TOP_VIEW_CACHE}::${sourceKey}::`,
  ];
  if (includeRandom) prefixes.push(`${CACHE_PREFIXES.RANDOM_VIEW}::${sourceKey}::`);
  return prefixes.some((p) => key.startsWith(p));
}

/**
 * Xoá cache dẫn xuất của một nguồn ở mọi tầng.
 * @param {string} sourceKey - VD ROOT_A, V_MOVIE, M_MUSIC, MEDIA_PHOTOS
 * @param {{includeRandom?: boolean}} [options] - includeRandom=false khi chỉ xoá một item, để danh
 *   sách "Ngẫu nhiên" đang hiện không bị xáo lại
 * @returns {number} số key localStorage đã xoá
 */
export function invalidateSourceCaches(sourceKey, { includeRandom = true } = {}) {
  if (!sourceKey || typeof sourceKey !== 'string') return 0;

  let removed = 0;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isDerivedCacheKey(key, sourceKey, includeRandom)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    removed = keys.length;
  } catch (error) {
    console.warn('invalidateSourceCaches: localStorage error', error);
  }

  try {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [name, ...rest] = query.queryKey || [];
        if (!rest.includes(sourceKey)) return false;
        if (USER_DATA_QUERY_NAMES.has(name)) return false;
        if (!includeRandom && RANDOM_QUERY_NAMES.has(name)) return false;
        return true;
      },
    });
  } catch (error) {
    console.warn('invalidateSourceCaches: react-query error', error);
  }

  listeners.forEach((listener) => {
    try {
      listener(sourceKey);
    } catch (error) {
      console.warn('invalidateSourceCaches listener error', error);
    }
  });
  return removed;
}
