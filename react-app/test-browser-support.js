/**
 * Test script để kiểm tra browser support và Caches API
 * Chạy trong DevTools Console để debug lỗi "caches is not defined"
 */

// Test 1: Kiểm tra cơ bản
console.group('🔍 Basic Browser Tests');
console.log('typeof caches:', typeof caches);
console.log('"caches" in window:', 'caches' in window);
console.log('window.isSecureContext:', window.isSecureContext);
console.log('location.protocol:', window.location.protocol);
console.log('location.hostname:', window.location.hostname);
console.groupEnd();

// Test 2: Import và test browserSupport utility
if (typeof window !== 'undefined') {
  window.testBrowserSupport = async () => {
    try {
      // Import module (chỉ hoạt động nếu có ES modules)
      const { 
        isCachesAPISupported, 
        getOfflineSupport, 
        logBrowserSupport,
        getUnsupportedMessage 
      } = await import('./src/utils/browserSupport.js');
      
      console.group('🧪 Browser Support Tests');
      
      // Test support functions
      console.log('isCachesAPISupported():', isCachesAPISupported());
      console.log('getOfflineSupport():', getOfflineSupport());
      console.log('getUnsupportedMessage():', getUnsupportedMessage());
      
      // Log full support info
      logBrowserSupport();
      
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Failed to test browser support:', error);
      console.log('ℹ️ This is normal if running in non-ES module context');
    }
  };
  
  console.log('✅ Run window.testBrowserSupport() to test utilities');
}

// Test 3: Manual Caches API test
console.group('🗄️ Manual Caches API Test');
try {
  if (typeof caches !== 'undefined') {
    console.log('✅ Caches API available');
    
    // Test caches.keys()
    caches.keys().then(cacheNames => {
      console.log('📦 Existing caches:', cacheNames);
    }).catch(err => {
      console.error('❌ Failed to get cache names:', err);
    });
    
    // Test caches.open()
    caches.open('test-cache').then(cache => {
      console.log('✅ Successfully opened test cache');
      // Clean up
      return caches.delete('test-cache');
    }).then(() => {
      console.log('🗑️ Cleaned up test cache');
    }).catch(err => {
      console.error('❌ Failed cache operations:', err);
    });
    
  } else {
    console.error('❌ Caches API not available');
    console.log('🔍 Possible reasons:');
    console.log('   - Not HTTPS/localhost');
    console.log('   - Old browser version');
    console.log('   - Incognito/private mode');
    console.log('   - Browser security settings');
  }
} catch (error) {
  console.error('❌ Error testing Caches API:', error);
}
console.groupEnd();

// Test 4: Service Worker test
console.group('⚙️ Service Worker Test');
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker API available');
  
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Service Worker registrations:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`   SW ${index + 1}:`, reg.scope);
    });
  }).catch(err => {
    console.error('❌ Failed to get SW registrations:', err);
  });
  
} else {
  console.error('❌ Service Worker not supported');
}
console.groupEnd();

// Test 5: IndexedDB test
console.group('💾 IndexedDB Test');
if ('indexedDB' in window) {
  console.log('✅ IndexedDB available');
  
  // Test open DB
  const testDBRequest = indexedDB.open('test-db', 1);
  testDBRequest.onsuccess = () => {
    console.log('✅ IndexedDB test successful');
    testDBRequest.result.close();
    indexedDB.deleteDatabase('test-db');
    console.log('🗑️ Cleaned up test database');
  };
  testDBRequest.onerror = (err) => {
    console.error('❌ IndexedDB test failed:', err);
  };
  
} else {
  console.error('❌ IndexedDB not available');
}
console.groupEnd();

// Test 6: Storage Quota API test
console.group('📊 Storage Quota Test');
if ('storage' in navigator && 'estimate' in navigator.storage) {
  console.log('✅ Storage Quota API available');
  
  navigator.storage.estimate().then(estimate => {
    console.log('💾 Storage estimate:', {
      quota: Math.round(estimate.quota / 1024 / 1024) + ' MB',
      usage: Math.round(estimate.usage / 1024 / 1024) + ' MB',
      percentage: Math.round((estimate.usage / estimate.quota) * 100) + '%'
    });
  }).catch(err => {
    console.error('❌ Failed to get storage estimate:', err);
  });
  
} else {
  console.error('❌ Storage Quota API not available');
}
console.groupEnd();

// Summary
console.group('📋 Test Summary');
console.log('🌐 URL:', window.location.href);
console.log('🔐 Secure Context:', window.isSecureContext);
console.log('🗄️ Caches API:', typeof caches !== 'undefined' ? '✅' : '❌');
console.log('⚙️ Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
console.log('💾 IndexedDB:', 'indexedDB' in window ? '✅' : '❌');
console.log('📊 Storage Quota:', ('storage' in navigator && 'estimate' in navigator.storage) ? '✅' : '❌');
console.log('🕸️ User Agent:', navigator.userAgent);
console.groupEnd();

console.log('🎉 Browser support test completed!');
console.log('ℹ️ If Caches API is not available, the app will gracefully fallback to IndexedDB-only mode.');
