/**
 * Browser Support Utilities
 * Kiểm tra tính năng có sẵn trong browser hiện tại
 */

/**
 * Kiểm tra Caches API có được hỗ trợ không
 * @returns {boolean} true nếu Caches API có sẵn
 */
export function isCachesAPISupported() {
  return 'caches' in window && typeof caches !== 'undefined';
}

/**
 * Kiểm tra Service Worker có được hỗ trợ không
 * @returns {boolean} true nếu Service Worker có sẵn
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Kiểm tra IndexedDB có được hỗ trợ không
 * @returns {boolean} true nếu IndexedDB có sẵn
 */
export function isIndexedDBSupported() {
  return 'indexedDB' in window && typeof indexedDB !== 'undefined';
}

/**
 * Kiểm tra Storage API có được hỗ trợ không (để check quota)
 * @returns {boolean} true nếu Storage API có sẵn
 */
export function isStorageAPISupported() {
  return 'storage' in navigator && 'estimate' in navigator.storage;
}

/**
 * Kiểm tra môi trường có an toàn cho PWA features không
 * PWA features yêu cầu HTTPS hoặc localhost
 * @returns {boolean} true nếu môi trường an toàn
 */
export function isSecureContext() {
  return window.isSecureContext || window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}

/**
 * Kiểm tra tất cả các tính năng offline có sẵn không
 * @returns {object} Object chứa thông tin support
 */
export function getOfflineSupport() {
  const secureContext = isSecureContext();
  
  return {
    isSupported: secureContext && isCachesAPISupported() && isIndexedDBSupported(),
    details: {
      secureContext,
      cachesAPI: isCachesAPISupported(),
      serviceWorker: isServiceWorkerSupported(),
      indexedDB: isIndexedDBSupported(),
      storageAPI: isStorageAPISupported()
    }
  };
}

/**
 * Tạo thông báo lỗi thân thiện cho user khi tính năng không được hỗ trợ
 * @param {string} feature - Tên tính năng
 * @returns {string} Thông báo lỗi
 */
export function getUnsupportedMessage(feature = 'offline features') {
  const support = getOfflineSupport();
  
  if (!support.details.secureContext) {
    return `${feature} yêu cầu HTTPS hoặc localhost. Hiện tại bạn đang truy cập qua HTTP không an toàn.`;
  }
  
  if (!support.details.cachesAPI) {
    return `${feature} không được hỗ trợ trong browser này. Vui lòng cập nhật browser hoặc sử dụng Chrome/Firefox.`;
  }
  
  if (!support.details.indexedDB) {
    return `${feature} yêu cầu IndexedDB nhưng không có sẵn. Kiểm tra cài đặt browser.`;
  }
  
  return `${feature} không được hỗ trợ trong môi trường này.`;
}

/**
 * Console log thông tin browser support để debug
 */
export function logBrowserSupport() {
  const support = getOfflineSupport();
  
  console.group('🔍 Browser Support Analysis');
  console.log('Overall offline support:', support.isSupported ? '✅ Supported' : '❌ Not supported');
  console.log('Secure context (HTTPS/localhost):', support.details.secureContext ? '✅' : '❌');
  console.log('Caches API:', support.details.cachesAPI ? '✅' : '❌');
  console.log('Service Worker:', support.details.serviceWorker ? '✅' : '❌');
  console.log('IndexedDB:', support.details.indexedDB ? '✅' : '❌');
  console.log('Storage API (quota):', support.details.storageAPI ? '✅' : '❌');
  console.log('Current URL:', window.location.href);
  console.log('User Agent:', navigator.userAgent);
  console.groupEnd();
  
  if (!support.isSupported) {
    console.warn('⚠️ Offline features not fully supported:', getUnsupportedMessage());
  }
  
  return support;
}

/**
 * Tạo fallback cho functions khi Caches API không có
 * @param {Function} cachesFunction - Function sử dụng Caches API
 * @param {Function} fallbackFunction - Function thay thế
 * @returns {Function} Function an toàn
 */
export function createCachesFallback(cachesFunction, fallbackFunction) {
  return async (...args) => {
    if (isCachesAPISupported()) {
      return await cachesFunction(...args);
    } else {
      console.warn('⚠️ Caches API not available, using fallback');
      return await fallbackFunction(...args);
    }
  };
}
