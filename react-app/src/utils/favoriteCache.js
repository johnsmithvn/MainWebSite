// 📁 src/utils/favoriteCache.js
// 🔄 Utility để cập nhật favorite state trong cache

/**
 * Cập nhật isFavorite cho tất cả cache entries có path tương ứng
 * @param {string} sourceKey - Key của database (ROOT_FANTASY, V_MOVIE, etc.)
 * @param {string} itemPath - Path của item cần update
 * @param {boolean} isFavorite - Trạng thái favorite mới
 */
export const updateFavoriteInAllCaches = (sourceKey, itemPath, isFavorite) => {
  if (!sourceKey || !itemPath) return;

  console.log('🔄 Updating favorite in all caches:', { sourceKey, itemPath, isFavorite });

  // Các prefix cache cần update
  const cachePrefixes = [
    'randomItems',
    'recentViewed', 
    'topViews',
    'mangaFolders'
  ];

  cachePrefixes.forEach(prefix => {
    const cacheKey = `${prefix}-${sourceKey}`;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;

      const cachedData = JSON.parse(cached);
      let updated = false;

      // Kiểm tra structure của cache data
      if (Array.isArray(cachedData)) {
        // Direct array
        for (const item of cachedData) {
          if (item.path === itemPath) {
            item.isFavorite = isFavorite;
            updated = true;
          }
        }
      } else if (cachedData.data && Array.isArray(cachedData.data)) {
        // Object with data array
        for (const item of cachedData.data) {
          if (item.path === itemPath) {
            item.isFavorite = isFavorite;
            updated = true;
          }
        }
      }

      // Save back to localStorage if updated
      if (updated) {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
        console.log(`✅ Updated ${prefix} cache for ${sourceKey}`);
      }
    } catch (error) {
      console.warn(`❌ Error updating ${prefix} cache:`, error);
    }
  });

  // Cập nhật thêm mangaCache pattern từ old frontend
  const mangaCachePrefix = `mangaCache::${sourceKey}::`;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(mangaCachePrefix)) {
      try {
        const cached = localStorage.getItem(key);
        const cachedData = JSON.parse(cached);
        let updated = false;

        if (cachedData.data && Array.isArray(cachedData.data)) {
          for (const item of cachedData.data) {
            if (item.path === itemPath) {
              item.isFavorite = isFavorite;
              updated = true;
            }
          }
        }

        if (updated) {
          localStorage.setItem(key, JSON.stringify(cachedData));
          console.log(`✅ Updated mangaCache for ${key}`);
        }
      } catch (error) {
        console.warn(`❌ Error updating mangaCache ${key}:`, error);
      }
    }
  });
};
