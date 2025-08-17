// 📁 src/utils/databaseOperations.js
// 🔄 Centralized database operations with loading states and confirmations

import { useUIStore } from '@/store';
import { apiService } from './api';

/**
 * Get content type from source key
 * @param {string} sourceKey 
 * @returns {string|null} Content type ('manga', 'movie', 'music')
 */
export const getContentTypeFromSourceKey = (sourceKey) => {
  if (!sourceKey) return null;
  
  // Manga sources typically start with ROOT_
  if (sourceKey.startsWith('ROOT_')) {
    return 'manga';
  }
  
  // Movie sources typically start with V_
  if (sourceKey.startsWith('V_')) {
    return 'movie';
  }
  
  // Music sources typically start with M_
  if (sourceKey.startsWith('M_')) {
    return 'music';
  }
  
  // Default to null if can't determine
  return null;
};

/**
 * Check if content type is valid for operation
 * @param {string} type 
 * @param {string} sourceKey 
 * @param {string} rootFolder 
 * @returns {boolean}
 */
export const isValidContentType = (type, sourceKey, rootFolder = null) => {
  if (!type || !sourceKey) return false;
  
  // Manga requires rootFolder
  if (type === 'manga' && !rootFolder) return false;
  
  return ['manga', 'movie', 'music'].includes(type);
};

/**
 * Database scan operation with loading state
 * @param {string} type - Content type ('manga', 'movie', 'music')
 * @param {string} sourceKey - Database key
 * @param {string} rootFolder - Root folder (for manga only)
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const performDatabaseScan = async (type, sourceKey, rootFolder = null, onSuccess, onError) => {
  if (!isValidContentType(type, sourceKey, rootFolder)) {
    onError?.('Invalid content type or missing required parameters');
    return;
  }

  const { setLoading } = useUIStore.getState();
  
  try {
    setLoading(true);
    
    let response;
    let requestBody;
    
    switch (type) {
      case 'manga':
        requestBody = { root: rootFolder, key: sourceKey };
        response = await apiService.manga.scan(requestBody);
        break;
        
      case 'movie':
        requestBody = { key: sourceKey };
        response = await apiService.movie.scan(requestBody);
        break;
        
      case 'music':
        requestBody = { key: sourceKey };
        response = await apiService.music.scan(requestBody);
        break;
        
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
    
    if (response.data?.success) {
      onSuccess?.(response.data, `${type} scan completed successfully`);
    } else {
      onError?.(response.data?.error || 'Scan operation failed');
    }
    
  } catch (error) {
    console.error(`Database scan error for ${type}:`, error);
    onError?.(error.message || 'Network error occurred');
  } finally {
    setLoading(false);
  }
};

/**
 * Database delete operation with loading state
 * @param {string} type - Content type ('manga', 'movie', 'music')
 * @param {string} sourceKey - Database key
 * @param {string} rootFolder - Root folder (for manga only)
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const performDatabaseDelete = async (type, sourceKey, rootFolder = null, onSuccess, onError) => {
  if (!isValidContentType(type, sourceKey, rootFolder)) {
    onError?.('Invalid content type or missing required parameters');
    return;
  }

  const { setLoading } = useUIStore.getState();
  
  try {
    setLoading(true);
    
    let response;
    let params;
    
    switch (type) {
      case 'manga':
        params = { key: sourceKey, root: rootFolder, mode: 'delete' };
        response = await apiService.manga.resetCache(params);
        break;
        
      case 'movie':
        params = { key: sourceKey, mode: 'delete' };
        response = await apiService.movie.resetDb(params);
        break;
        
      case 'music':
        params = { key: sourceKey, mode: 'delete' };
        response = await apiService.music.resetDb(params);
        break;
        
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
    
    if (response.data?.success) {
      onSuccess?.(response.data, `${type} database entries deleted successfully`);
    } else {
      onError?.(response.data?.error || 'Delete operation failed');
    }
    
  } catch (error) {
    console.error(`Database delete error for ${type}:`, error);
    onError?.(error.message || 'Network error occurred');
  } finally {
    setLoading(false);
  }
};

/**
 * Database reset and scan operation with loading state
 * @param {string} type - Content type ('manga', 'movie', 'music')
 * @param {string} sourceKey - Database key
 * @param {string} rootFolder - Root folder (for manga only)
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const performDatabaseReset = async (type, sourceKey, rootFolder = null, onSuccess, onError) => {
  if (!isValidContentType(type, sourceKey, rootFolder)) {
    onError?.('Invalid content type or missing required parameters');
    return;
  }

  const { setLoading } = useUIStore.getState();
  
  try {
    setLoading(true);
    
    let response;
    let params;
    
    switch (type) {
      case 'manga':
        params = { key: sourceKey, root: rootFolder, mode: 'reset' };
        response = await apiService.manga.resetCache(params);
        break;
        
      case 'movie':
        params = { key: sourceKey, mode: 'reset' };
        response = await apiService.movie.resetDb(params);
        break;
        
      case 'music':
        params = { key: sourceKey, mode: 'reset' };
        response = await apiService.music.resetDb(params);
        break;
        
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
    
    if (response.data?.success) {
      onSuccess?.(response.data, `${type} database reset and scan completed successfully`);
    } else {
      onError?.(response.data?.error || 'Reset operation failed');
    }
    
  } catch (error) {
    console.error(`Database reset error for ${type}:`, error);
    onError?.(error.message || 'Network error occurred');
  } finally {
    setLoading(false);
  }
};

/**
 * Get database operation labels based on content type
 * @param {string} type 
 * @returns {Object}
 */
export const getDatabaseOperationLabels = (type) => {
  const labels = {
    manga: {
      scan: 'Quét Manga',
      delete: 'Xóa DB Manga',
      reset: 'Reset DB Manga',
      scanDescription: 'Quét và cập nhật database manga',
      deleteDescription: 'Xóa tất cả dữ liệu manga từ database',
      resetDescription: 'Xóa dữ liệu cũ và quét lại từ đầu'
    },
    movie: {
      scan: 'Quét Movie',
      delete: 'Xóa DB Movie',
      reset: 'Reset DB Movie',
      scanDescription: 'Quét và cập nhật database movie',
      deleteDescription: 'Xóa tất cả dữ liệu movie từ database',
      resetDescription: 'Xóa dữ liệu cũ và quét lại từ đầu'
    },
    music: {
      scan: 'Quét Music',
      delete: 'Xóa DB Music',
      reset: 'Reset DB Music',
      scanDescription: 'Quét và cập nhật database music',
      deleteDescription: 'Xóa tất cả dữ liệu music từ database',
      resetDescription: 'Xóa dữ liệu cũ và quét lại từ đầu'
    }
  };
  
  return labels[type] || labels.manga;
};

export default {
  getContentTypeFromSourceKey,
  isValidContentType,
  performDatabaseScan,
  performDatabaseDelete,
  performDatabaseReset,
  getDatabaseOperationLabels
};
