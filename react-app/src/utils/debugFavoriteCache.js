// 📁 src/utils/debugFavoriteCache.js
// 🔍 Debug utility để kiểm tra cache favorite

/**
 * Debug function để kiểm tra tất cả cache patterns
 */
export const debugAllCaches = (sourceKey = 'ROOT_FANTASY', rootFolder = 'fantasy') => {
  console.log('\n🔍 === DEBUG ALL CACHES ===');
  console.log('Parameters:', { sourceKey, rootFolder });
  
  // 1. RandomView cache
  const randomKey = `randomView::${sourceKey}::${rootFolder}::manga`;
  const randomCache = localStorage.getItem(randomKey);
  console.log('\n📦 RandomView Cache:', randomKey);
  if (randomCache) {
    const data = JSON.parse(randomCache);
    console.log('- Has data:', !!data);
    console.log('- Structure:', data.data ? 'Object with data array' : 'Direct array');
    console.log('- Items count:', data.data ? data.data.length : (Array.isArray(data) ? data.length : 'Unknown'));
    if (data.data && data.data.length > 0) {
      console.log('- Sample item:', data.data[0]);
    } else if (Array.isArray(data) && data.length > 0) {
      console.log('- Sample item:', data[0]);
    }
  } else {
    console.log('- No cache found');
  }

  // 2. Recent cache - check both patterns
  const recentKey1 = `recentViewed::${rootFolder}::${rootFolder}`;
  const recentKey2 = `recentViewed::${rootFolder}`;
  
  console.log('\n🕒 Recent Cache Pattern 1:', recentKey1);
  const recentCache1 = localStorage.getItem(recentKey1);
  if (recentCache1) {
    const data = JSON.parse(recentCache1);
    console.log('- Has data:', !!data);
    console.log('- Items count:', Array.isArray(data) ? data.length : 'Not array');
    if (Array.isArray(data) && data.length > 0) {
      console.log('- Sample item:', data[0]);
    }
  } else {
    console.log('- No cache found');
  }
  
  console.log('\n🕒 Recent Cache Pattern 2:', recentKey2);
  const recentCache2 = localStorage.getItem(recentKey2);
  if (recentCache2) {
    const data = JSON.parse(recentCache2);
    console.log('- Has data:', !!data);
    console.log('- Items count:', Array.isArray(data) ? data.length : 'Not array');
    if (Array.isArray(data) && data.length > 0) {
      console.log('- Sample item:', data[0]);
    }
  } else {
    console.log('- No cache found');
  }

  // 3. GridView cache  
  const gridKey = `react-folderCache::${sourceKey}::${rootFolder}::`;
  const gridCache = localStorage.getItem(gridKey);
  console.log('\n📁 GridView Cache:', gridKey);
  if (gridCache) {
    const data = JSON.parse(gridCache);
    console.log('- Has data:', !!data);
    console.log('- Has mangaList:', !!(data.data && data.data.mangaList));
    if (data.data && data.data.mangaList) {
      console.log('- MangaList count:', data.data.mangaList.length);
      if (data.data.mangaList.length > 0) {
        console.log('- Sample item:', data.data.mangaList[0]);
      }
    }
  } else {
    console.log('- No cache found');
  }

  // 4. Check all localStorage keys that might be related
  console.log('\n🗃️ All Related Cache Keys:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes(sourceKey) || key.includes(rootFolder) || key.includes('recent') || key.includes('random')) {
      console.log(`- ${key}`);
    }
  });

  console.log('\n=== END DEBUG ===\n');
};

/**
 * Debug specific item trong tất cả caches
 */
export const debugItemInCaches = (itemPath, sourceKey = 'ROOT_FANTASY', rootFolder = 'fantasy') => {
  console.log('\n🎯 === DEBUG ITEM IN CACHES ===');
  console.log('Item path:', itemPath);
  console.log('Parameters:', { sourceKey, rootFolder });

  const results = [];

  // 1. Check RandomView cache
  const randomKey = `randomView::${sourceKey}::${rootFolder}::manga`;
  const randomCache = localStorage.getItem(randomKey);
  if (randomCache) {
    const data = JSON.parse(randomCache);
    const items = data.data || data;
    if (Array.isArray(items)) {
      const foundItem = items.find(item => item.path === itemPath);
      results.push({
        cache: 'RandomView',
        key: randomKey,
        found: !!foundItem,
        isFavorite: foundItem?.isFavorite
      });
    }
  }

  // 2. Check Recent cache - both patterns
  const recentKey1 = `recentViewed::${rootFolder}::${rootFolder}`;
  const recentCache1 = localStorage.getItem(recentKey1);
  if (recentCache1) {
    const data = JSON.parse(recentCache1);
    if (Array.isArray(data)) {
      const foundItem = data.find(item => item.path === itemPath);
      results.push({
        cache: 'Recent (Pattern 1)',
        key: recentKey1,
        found: !!foundItem,
        isFavorite: foundItem?.isFavorite
      });
    }
  }
  
  const recentKey2 = `recentViewed::${rootFolder}`;
  const recentCache2 = localStorage.getItem(recentKey2);
  if (recentCache2) {
    const data = JSON.parse(recentCache2);
    if (Array.isArray(data)) {
      const foundItem = data.find(item => item.path === itemPath);
      results.push({
        cache: 'Recent (Pattern 2)',
        key: recentKey2,
        found: !!foundItem,
        isFavorite: foundItem?.isFavorite
      });
    }
  }

  // 3. Check GridView cache
  const gridKey = `react-folderCache::${sourceKey}::${rootFolder}::`;
  const gridCache = localStorage.getItem(gridKey);
  if (gridCache) {
    const data = JSON.parse(gridCache);
    if (data.data && data.data.mangaList && Array.isArray(data.data.mangaList)) {
      const foundItem = data.data.mangaList.find(item => item.path === itemPath);
      results.push({
        cache: 'GridView',
        key: gridKey,
        found: !!foundItem,
        isFavorite: foundItem?.isFavorite
      });
    }
  }

  console.table(results);
  console.log('\n=== END DEBUG ITEM ===\n');
  
  return results;
};

// Export to window for easy access in console
if (typeof window !== 'undefined') {
  window.debugFavoriteCache = {
    debugAllCaches,
    debugItemInCaches
  };
}

export default {
  debugAllCaches,
  debugItemInCaches
};
