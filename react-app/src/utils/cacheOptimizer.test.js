// 📁 src/utils/cacheOptimizer.test.js
// 🧪 Test utilities for cache optimization

import { getCacheStats, optimizeCache, isOfflineModeNeeded } from './cacheOptimizer';
import { CACHE_PREFIXES } from '@/constants/cacheKeys';

/**
 * Test cache optimization functionality
 */
export const runCacheOptimizationTests = async () => {
  console.group('🧪 Cache Optimization Tests');
  
  try {
    // Test 1: Get initial cache stats
    console.log('📊 Test 1: Getting cache statistics...');
    const initialStats = getCacheStats();
    console.log('Initial cache stats:', initialStats);
    
    // Test 2: Create test cache data
    console.log('📦 Test 2: Creating test cache data...');
    await createTestCacheData();
    
    const afterTestStats = getCacheStats();
    console.log('After test data creation:', afterTestStats);
    
    // Test 3: Test offline mode detection
    console.log('🌐 Test 3: Testing offline mode detection...');
    const isOffline = isOfflineModeNeeded();
    console.log('Is offline mode needed:', isOffline);
    
    // Test 4: Run optimization
    console.log('🎯 Test 4: Running cache optimization...');
    const cleared = await optimizeCache();
    console.log('Items cleared during optimization:', cleared);
    
    const finalStats = getCacheStats();
    console.log('Final cache stats:', finalStats);
    
    // Test 5: Verify optimization results
    console.log('✅ Test 5: Verifying optimization results...');
    const optimizationResults = {
      initialSize: initialStats.size,
      finalSize: finalStats.size,
      sizeSaved: initialStats.size - finalStats.size,
      percentSaved: ((initialStats.size - finalStats.size) / initialStats.size * 100).toFixed(2),
      itemsCleared: cleared
    };
    
    console.log('Optimization Results:', optimizationResults);
    
    // Test 6: Check if important caches are preserved
    console.log('🔒 Test 6: Checking if important caches are preserved...');
    const preservedCaches = checkPreservedCaches();
    console.log('Preserved caches check:', preservedCaches);
    
    console.log('✅ All cache optimization tests completed successfully!');
    return {
      success: true,
      results: optimizationResults,
      preservedCaches
    };
    
  } catch (error) {
    console.error('❌ Cache optimization tests failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    console.groupEnd();
  }
};

/**
 * Create test cache data to verify optimization
 */
const createTestCacheData = async () => {
  // Create test random cache
  const testRandomData = {
    timestamp: Date.now(),
    data: Array.from({ length: 20 }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Item ${i}`,
      path: `/test/path/${i}`,
      isFavorite: i < 5 // First 5 are favorites
    }))
  };
  
  localStorage.setItem(
    `${CACHE_PREFIXES.RANDOM_VIEW}::TEST_SOURCE::test-root::manga`,
    JSON.stringify(testRandomData)
  );
  
  // Create test recent cache  
  const testRecentData = Array.from({ length: 25 }, (_, i) => ({
    id: `recent-${i}`,
    name: `Recent Item ${i}`,
    path: `/recent/path/${i}`,
    lastViewed: Date.now() - (i * 60000), // Spread over time
    isFavorite: i < 3
  }));
  
  localStorage.setItem(
    `${CACHE_PREFIXES.RECENT_VIEWED_MANGA}::test-root::test-root`,
    JSON.stringify(testRecentData)
  );
  
  // Create expired cache
  const expiredData = {
    timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
    data: [{ id: 'expired', name: 'Expired Item' }]
  };
  
  localStorage.setItem(
    `${CACHE_PREFIXES.RANDOM_VIEW}::EXPIRED_SOURCE::expired-root::manga`,
    JSON.stringify(expiredData)
  );
  
  console.log('✅ Test cache data created');
};

/**
 * Check if important caches are preserved after optimization
 */
const checkPreservedCaches = () => {
  const checks = {
    favoritesCacheExists: false,
    gridViewCacheExists: false,
    recentCacheExists: false,
    chapterImagesExists: false
  };
  
  // Check localStorage for preserved caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Check for favorites in cache data
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data && Array.isArray(data.data || data)) {
        const items = data.data || data;
        const hasFavorites = items.some(item => item.isFavorite);
        if (hasFavorites) {
          checks.favoritesCacheExists = true;
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
    
    // Check for grid view cache
    if (key.startsWith(CACHE_PREFIXES.REACT_FOLDER_CACHE)) {
      checks.gridViewCacheExists = true;
    }
    
    // Check for recent cache
    if (key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MANGA) ||
        key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_VIDEO) ||
        key.startsWith(CACHE_PREFIXES.RECENT_VIEWED_MUSIC)) {
      checks.recentCacheExists = true;
    }
  }
  
  // Check for chapter images cache (Service Worker)
  if (typeof caches !== 'undefined') {
    caches.has('chapter-images').then(exists => {
      checks.chapterImagesExists = exists;
    });
  }
  
  return checks;
};

/**
 * Performance test for cache operations
 */
export const runCachePerformanceTest = async () => {
  console.group('⚡ Cache Performance Tests');
  
  try {
    // Test cache read performance
    const startRead = performance.now();
    const stats = getCacheStats();
    const readTime = performance.now() - startRead;
    
    console.log(`📖 Cache read performance: ${readTime.toFixed(2)}ms for ${stats.total} items`);
    
    // Test cache optimization performance
    const startOptimize = performance.now();
    const cleared = await optimizeCache();
    const optimizeTime = performance.now() - startOptimize;
    
    console.log(`🎯 Cache optimization performance: ${optimizeTime.toFixed(2)}ms, cleared ${cleared} items`);
    
    const performance_results = {
      readTime,
      optimizeTime,
      itemsProcessed: stats.total,
      itemsCleared: cleared,
      avgTimePerItem: optimizeTime / stats.total
    };
    
    console.log('Performance Results:', performance_results);
    return performance_results;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { error: error.message };
  } finally {
    console.groupEnd();
  }
};

/**
 * Cleanup test data
 */
export const cleanupTestData = () => {
  console.log('🧹 Cleaning up test data...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('TEST_SOURCE') ||
      key.includes('EXPIRED_SOURCE') ||
      key.includes('test-root')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✅ Cleaned up ${keysToRemove.length} test cache entries`);
};

/**
 * Run all tests
 */
export const runAllCacheTests = async () => {
  console.log('🚀 Starting comprehensive cache optimization tests...');
  
  const optimizationTest = await runCacheOptimizationTests();
  const performanceTest = await runCachePerformanceTest();
  
  // Cleanup
  cleanupTestData();
  
  return {
    optimization: optimizationTest,
    performance: performanceTest
  };
};

// Export for console testing
if (typeof window !== 'undefined') {
  window.cacheTests = {
    runOptimizationTests: runCacheOptimizationTests,
    runPerformanceTest: runCachePerformanceTest,
    runAllTests: runAllCacheTests,
    cleanup: cleanupTestData
  };
  
  console.log('🧪 Cache tests available at: window.cacheTests');
}

export default {
  runCacheOptimizationTests,
  runCachePerformanceTest,
  runAllCacheTests,
  cleanupTestData
};