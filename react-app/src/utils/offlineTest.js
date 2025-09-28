// 📁 src/utils/offlineTest.js  
// 🧪 Test offline functionality after cache optimization

import { getCacheStats } from './cacheOptimizer';
import { CACHE_PREFIXES } from '@/constants/cacheKeys';

/**
 * Test if app can work offline after optimization
 */
export const testOfflineFunctionality = async () => {
  console.group('🌐 Offline Functionality Test');
  
  const results = {
    libraryCache: false,
    navigationCache: false,
    favoritesCache: false,
    gridViewCache: false,
    chapterImages: false,
    overallOfflineReady: false
  };
  
  try {
    // 1. Test library cache exists
    console.log('📚 Testing library cache...');
    results.libraryCache = testLibraryCache();
    
    // 2. Test navigation cache exists  
    console.log('🧭 Testing navigation cache...');
    results.navigationCache = testNavigationCache();
    
    // 3. Test favorites cache exists
    console.log('❤️ Testing favorites cache...');
    results.favoritesCache = testFavoritesCache();
    
    // 4. Test grid view cache exists
    console.log('📋 Testing grid view cache...');
    results.gridViewCache = testGridViewCache();
    
    // 5. Test chapter images cache exists (Service Worker)
    console.log('🖼️ Testing chapter images cache...');
    results.chapterImages = await testChapterImagesCache();
    
    // Overall assessment
    const essentialChecks = [
      results.libraryCache,
      results.navigationCache, 
      results.gridViewCache
    ];
    
    results.overallOfflineReady = essentialChecks.every(check => check);
    
    console.log('📊 Offline Test Results:', results);
    
    if (results.overallOfflineReady) {
      console.log('✅ App is ready for offline use!');
    } else {
      console.warn('⚠️ App may have limited offline functionality');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Offline test failed:', error);
    return { ...results, error: error.message };
  } finally {
    console.groupEnd();
  }
};

/**
 * Test if library cache exists (essential for offline)
 */
const testLibraryCache = () => {
  let hasLibraryCache = false;
  
  // Check for folder cache (library data)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE) ||
        key.startsWith(CACHE_PREFIXES.MANGA_CACHE) ||
        key.startsWith(CACHE_PREFIXES.MOVIE_FOLDER_CACHE) ||
        key.startsWith(CACHE_PREFIXES.MUSIC_FOLDER_CACHE)) {
      
      try {
        const cached = localStorage.getItem(key);
        const data = JSON.parse(cached);
        
        // Check if cache has actual data
        if (data && (data.data || data.mangaList || data.folders)) {
          hasLibraryCache = true;
          console.log('✅ Found library cache:', key);
          break;
        }
      } catch (error) {
        console.warn('⚠️ Corrupted library cache:', key);
      }
    }
  }
  
  if (!hasLibraryCache) {
    console.warn('❌ No library cache found - app may not work offline');
  }
  
  return hasLibraryCache;
};

/**
 * Test if navigation cache exists
 */
const testNavigationCache = () => {
  let hasNavCache = false;
  
  // Check for random/recent cache (for navigation)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (key.startsWith(CACHE_PREFIXES.RANDOM_VIEW) ||
        key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MANGA) ||
        key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_VIDEO) ||
        key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MUSIC)) {
      
      try {
        const cached = localStorage.getItem(key);
        const data = JSON.parse(cached);
        
        if (data && (Array.isArray(data) || data.data)) {
          hasNavCache = true;
          console.log('✅ Found navigation cache:', key);
          break;
        }
      } catch (error) {
        console.warn('⚠️ Corrupted navigation cache:', key);
      }
    }
  }
  
  return hasNavCache;
};

/**
 * Test if favorites cache exists
 */
const testFavoritesCache = () => {
  let hasFavoritesCache = false;
  
  // Check for any cache with favorite items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    try {
      const cached = localStorage.getItem(key);
      const data = JSON.parse(cached);
      
      // Check if cache contains favorite items
      if (data && data.data && Array.isArray(data.data)) {
        const hasFavorites = data.data.some(item => item.isFavorite === true);
        if (hasFavorites) {
          hasFavoritesCache = true;
          console.log('✅ Found favorites in cache:', key);
          break;
        }
      }
      
      // Check direct array format
      if (Array.isArray(data)) {
        const hasFavorites = data.some(item => item.isFavorite === true);
        if (hasFavorites) {
          hasFavoritesCache = true;
          console.log('✅ Found favorites in cache:', key);
          break;
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }
  
  return hasFavoritesCache;
};

/**
 * Test if grid view cache exists
 */
const testGridViewCache = () => {
  let hasGridCache = false;
  
  // Check for React folder cache (grid view)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE)) {
      try {
        const cached = localStorage.getItem(key);
        const data = JSON.parse(cached);
        
        if (data && data.data && (data.data.mangaList || data.data.folders)) {
          hasGridCache = true;
          console.log('✅ Found grid view cache:', key);
          break;
        }
      } catch (error) {
        console.warn('⚠️ Corrupted grid view cache:', key);
      }
    }
  }
  
  return hasGridCache;
};

/**
 * Test if chapter images cache exists (Service Worker)
 */
const testChapterImagesCache = async () => {
  try {
    if (typeof caches === 'undefined') {
      console.warn('⚠️ Cache API not available');
      return false;
    }
    
    const hasChapterCache = await caches.has('chapter-images');
    if (!hasChapterCache) {
      console.warn('⚠️ No chapter images cache found');
      return false;
    }
    
    const cache = await caches.open('chapter-images');
    const keys = await cache.keys();
    
    if (keys.length > 0) {
      console.log(`✅ Found chapter images cache with ${keys.length} images`);
      return true;
    } else {
      console.warn('⚠️ Chapter images cache exists but is empty');
      return false;
    }
    
  } catch (error) {
    console.warn('⚠️ Error checking chapter images cache:', error);
    return false;
  }
};

/**
 * Simulate offline mode and test functionality
 */
export const simulateOfflineTest = async () => {
  console.group('🌐 Offline Simulation Test');
  
  try {
    // Get current online status
    const wasOnline = navigator.onLine;
    console.log('📡 Current online status:', wasOnline);
    
    // Test current cache state
    const cacheStats = getCacheStats();
    console.log('📊 Current cache stats:', cacheStats);
    
    // Test offline functionality
    const offlineTest = await testOfflineFunctionality();
    console.log('🧪 Offline functionality test:', offlineTest);
    
    // Recommendations based on test results
    const recommendations = generateOfflineRecommendations(offlineTest);
    console.log('💡 Recommendations:', recommendations);
    
    return {
      onlineStatus: wasOnline,
      cacheStats,
      offlineTest,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Offline simulation failed:', error);
    return { error: error.message };
  } finally {
    console.groupEnd();
  }
};

/**
 * Generate recommendations based on offline test results
 */
const generateOfflineRecommendations = (testResults) => {
  const recommendations = [];
  
  if (!testResults.libraryCache) {
    recommendations.push('📚 Browse some manga/movie/music to build library cache');
  }
  
  if (!testResults.navigationCache) {
    recommendations.push('🧭 Use random/recent features to build navigation cache');
  }
  
  if (!testResults.favoritesCache) {
    recommendations.push('❤️ Add some items to favorites to build favorites cache');
  }
  
  if (!testResults.gridViewCache) {
    recommendations.push('📋 Visit manga grid view to build essential navigation cache');
  }
  
  if (!testResults.chapterImages) {
    recommendations.push('📖 Download some chapters for offline reading');
  }
  
  if (testResults.overallOfflineReady) {
    recommendations.push('✅ App is ready for offline use!');
  } else {
    recommendations.push('⚠️ Complete the above steps to improve offline functionality');
  }
  
  return recommendations;
};

// Export for console testing
if (typeof window !== 'undefined') {
  window.offlineTests = {
    testOfflineFunctionality,
    simulateOfflineTest
  };
  
  console.log('🌐 Offline tests available at: window.offlineTests');
}

export default {
  testOfflineFunctionality,
  simulateOfflineTest
};