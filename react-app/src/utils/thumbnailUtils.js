// 📁 src/utils/thumbnailUtils.js
// 🖼️ Utility functions for building thumbnail URLs

import { DEFAULT_IMAGES } from '../constants/index.js';

/**
 * Build thumbnail URL cho movie/music với xử lý ký tự đặc biệt
 * Tương tự như buildThumbnailUrl trong frontend cũ
 * @param {Object} item - Object chứa thumbnail, path, type
 * @param {string} mediaType - 'movie', 'music', 'manga'
 * @returns {string} URL thumbnail đã encode
 */
export function buildThumbnailUrl(item, mediaType = 'movie') {
  let prefix = '/video/';
  let defaultFile = DEFAULT_IMAGES.video;
  let defaultFolder = DEFAULT_IMAGES.folder;
  
  if (mediaType === 'music') {
    prefix = '/audio/';
    defaultFile = DEFAULT_IMAGES.music;
    defaultFolder = DEFAULT_IMAGES.folder;
  } else if (mediaType === 'manga' || mediaType === 'comic') {
    prefix = '/manga/';
    defaultFile = DEFAULT_IMAGES.cover;
    defaultFolder = DEFAULT_IMAGES.folder;
  }

  // Phân biệt folder/file để lấy prefix đúng
  let folderPrefix;
  if (item.type === 'folder') {
    folderPrefix = item.path || '';
  } else {
    folderPrefix = item.path?.split('/').slice(0, -1).join('/') || '';
  }

  // Nếu không có thumbnail thì trả về default
  if (!item.thumbnail || item.thumbnail === 'null') {
    if (mediaType === 'music') {
      return item.type === 'audio' || item.type === 'file' ? defaultFile : defaultFolder;
    } else if (mediaType === 'manga' || mediaType === 'comic') {
      return item.type === 'folder' ? defaultFolder : defaultFile;
    } else {
      return item.type === 'video' || item.type === 'file' ? defaultFile : defaultFolder;
    }
  }

  // Nếu thumbnail đã là URL tuyệt đối thì trả luôn
  if (
    item.thumbnail.startsWith(prefix) ||
    item.thumbnail.startsWith('http') ||
    item.thumbnail.startsWith('/default/')
  ) {
    return item.thumbnail;
  }

  // Nếu thumbnail đã bị dính prefix folder (do bug hay import DB cũ) thì cắt đi
  let cleanThumbnail = item.thumbnail;
  if (folderPrefix && cleanThumbnail.startsWith(folderPrefix + '/')) {
    cleanThumbnail = cleanThumbnail.slice(folderPrefix.length + 1);
  }
  
  // 🔥 Encode đường dẫn để xử lý ký tự đặc biệt như # (giống manga)
  const safeFolderPrefix = folderPrefix ? 
    folderPrefix.split('/').map(encodeURIComponent).join('/') + '/' : '';
  const safeThumbnail = cleanThumbnail.split('/').map(encodeURIComponent).join('/');
  
  // Build lại URL chuẩn với encoding
  return `${prefix}${safeFolderPrefix}${safeThumbnail.replace(/\\/g, '/')}`;
}

/**
 * Process thumbnail cho item dựa trên type
 * @param {Object} item - Item object
 * @param {string} type - 'movie', 'music', 'manga'
 * @returns {Object} Item với thumbnail đã được process
 */
export function processThumbnail(item, type) {
  return {
    ...item,
    thumbnail: buildThumbnailUrl(item, type)
  };
}

/**
 * Process thumbnail cho array of items
 * @param {Array} items - Array of items
 * @param {string} type - Content type
 * @returns {Array} Items với thumbnail đã được process
 */
export function processThumbnails(items, type) {
  return items.map(item => processThumbnail(item, type));
}

export default {
  buildThumbnailUrl,
  processThumbnail,
  processThumbnails
};
