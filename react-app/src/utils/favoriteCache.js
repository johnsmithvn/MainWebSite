// 📁 src/utils/favoriteCache.js
// 🔄 Utility để cập nhật favorite state trong cache

/**
 * Cập nhật isFavorite cho tất cả cache entries có path tương ứng
 * @param {string} sourceKey - Key của database (ROOT_FANTASY, V_MOVIE, etc.)
 * @param {string} itemPath - Path của item cần update
 * @param {boolean} isFavorite - Trạng thái favorite mới
 * @param {string} rootFolder - Root folder (optional, for manga)
 */
export const updateFavoriteInAllCaches = (sourceKey, itemPath, isFavorite, rootFolder = null) => {
  if (!sourceKey || !itemPath) return;

  console.log('🔄 updateFavoriteInAllCaches START:', { sourceKey, itemPath, isFavorite, rootFolder });

  // ✅ 1. Update React app random cache pattern (randomView::)
  if (rootFolder) {
    ['manga', 'movie', 'music'].forEach(type => {
      const randomKey = `randomView::${sourceKey}::${rootFolder}::${type}`;
      try {
        const cached = localStorage.getItem(randomKey);
        if (!cached) return;

        const cachedData = JSON.parse(cached);
        let updated = false;

        // Check if data is in { timestamp, data } format (useRandomItems pattern)
        if (cachedData.data && Array.isArray(cachedData.data)) {
          for (const item of cachedData.data) {
            if (item.path === itemPath) {
              item.isFavorite = Boolean(isFavorite);
              updated = true;
              console.log(`🎯 Updated item in randomView ${type}: ${itemPath} -> ${isFavorite}`);
            }
          }
        }
        // Check if data is direct array (legacy)
        else if (Array.isArray(cachedData)) {
          for (const item of cachedData) {
            if (item.path === itemPath) {
              item.isFavorite = Boolean(isFavorite);
              updated = true;
              console.log(`🎯 Updated item in randomView ${type} (legacy): ${itemPath} -> ${isFavorite}`);
            }
          }
        }

        if (updated) {
          localStorage.setItem(randomKey, JSON.stringify(cachedData));
          console.log(`✅ Updated randomView cache for ${type}: ${randomKey}`);
        }
      } catch (error) {
        console.warn(`❌ Error updating randomView cache for ${type}:`, error);
      }
    });
  }

  // ✅ 2. Update recentViewed cache patterns
  const recentPatterns = [
    `recentViewed::${rootFolder}::${rootFolder}`, // manga pattern
    `recentViewedVideo::${sourceKey}`, // movie pattern  
    `recentViewedMusic::${sourceKey}` // music pattern
  ];

  recentPatterns.forEach(cacheKey => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;

      const cachedData = JSON.parse(cached);
      let updated = false;

      if (Array.isArray(cachedData)) {
        for (const item of cachedData) {
          if (item.path === itemPath) {
            item.isFavorite = Boolean(isFavorite);
            updated = true;
          }
        }
      }

      if (updated) {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
        console.log(`✅ Updated ${cacheKey} cache`);
      }
    } catch (error) {
      console.warn(`❌ Error updating ${cacheKey} cache:`, error);
    }
  });

  // ✅ 3. Update các cache patterns cũ (legacy compatibility)
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
            // Normalize isFavorite to boolean
            item.isFavorite = Boolean(isFavorite);
            updated = true;
          }
        }
      } else if (cachedData.data && Array.isArray(cachedData.data)) {
        // Object with data array
        for (const item of cachedData.data) {
          if (item.path === itemPath) {
            // Normalize isFavorite to boolean
            item.isFavorite = Boolean(isFavorite);
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

  // ✅ 4. Cập nhật mangaCache pattern từ old frontend
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
              // Normalize isFavorite to boolean
              item.isFavorite = Boolean(isFavorite);
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

  // ✅ 5. Cập nhật Movie cache pattern (movieCache::)
  const movieCachePrefix = `movieCache::${sourceKey}::`;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(movieCachePrefix)) {
      try {
        const cached = localStorage.getItem(key);
        const cachedData = JSON.parse(cached);
        let updated = false;

        if (cachedData.data && Array.isArray(cachedData.data)) {
          for (const item of cachedData.data) {
            if (item.path === itemPath) {
              item.isFavorite = Boolean(isFavorite);
              updated = true;
            }
          }
        }

        if (updated) {
          localStorage.setItem(key, JSON.stringify(cachedData));
          console.log(`✅ Updated movieCache for ${key}`);
        }
      } catch (error) {
        console.warn(`❌ Error updating movieCache ${key}:`, error);
      }
    }
  });

  // ✅ 6. Cập nhật Random cache patterns từ old frontend
  const randomPatterns = ['randomFolders', 'randomVideos', 'randomMusic'];
  randomPatterns.forEach(pattern => {
    const cacheKey = `${pattern}-${sourceKey}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;

      const cachedData = JSON.parse(cached);
      let updated = false;

      if (cachedData.data && Array.isArray(cachedData.data)) {
        for (const item of cachedData.data) {
          if (item.path === itemPath) {
            item.isFavorite = Boolean(isFavorite);
            updated = true;
          }
        }
      }

      if (updated) {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
        console.log(`✅ Updated ${pattern} cache`);
      }
    } catch (error) {
      console.warn(`❌ Error updating ${pattern} cache:`, error);
    }
  });

  // ✅ 7. Cập nhật React manga cache pattern (react-folderCache::) - GridView cache
  const reactMangaCachePrefix = `react-folderCache::${sourceKey}::`;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(reactMangaCachePrefix)) {
      try {
        const cached = localStorage.getItem(key);
        const cachedData = JSON.parse(cached);
        let updated = false;

        if (cachedData.data) {
          // Update trong mangaList array (GridView data)
          if (Array.isArray(cachedData.data.mangaList)) {
            for (const item of cachedData.data.mangaList) {
              if (item.path === itemPath) {
                item.isFavorite = Boolean(isFavorite);
                updated = true;
                console.log(`🎯 Updated item in GridView cache: ${itemPath} -> ${isFavorite}`);
              }
            }
          }
          
          // Update trong folders array (legacy support)
          if (Array.isArray(cachedData.data.folders)) {
            for (const item of cachedData.data.folders) {
              if (item.path === itemPath) {
                item.isFavorite = Boolean(isFavorite);
                updated = true;
                console.log(`🎯 Updated item in GridView folders cache: ${itemPath} -> ${isFavorite}`);
              }
            }
          }
          
          // Update cho __self__ case
          if (itemPath.endsWith("/__self__") && cachedData.data.isFavorite !== undefined) {
            cachedData.data.isFavorite = Boolean(isFavorite);
            updated = true;
            console.log(`🎯 Updated __self__ item in GridView cache: ${itemPath} -> ${isFavorite}`);
          }
        }

        if (updated) {
          localStorage.setItem(key, JSON.stringify(cachedData));
          console.log(`✅ Updated react manga GridView cache for ${key}`);
        }
      } catch (error) {
        console.warn(`❌ Error updating react manga GridView cache ${key}:`, error);
      }
    }
  });

  console.log('🎯 updateFavoriteInAllCaches COMPLETED for:', { sourceKey, itemPath, isFavorite });
};
