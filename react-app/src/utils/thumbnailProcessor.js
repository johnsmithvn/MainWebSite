/**
 * Thumbnail Processing Utility
 * 
 * Xử lý thumbnail URLs cho Movie, Music và Manga với logic encoding path
 * Thay thế duplicate code trong store/index.js và thumbnailUtils.js
 */

import { DEFAULT_IMAGES } from '../constants';

/**
 * Process thumbnail URL for media items (movie/music/manga)
 * 
 * @param {Object} item - Media item object (folder or file)
 * @param {string} item.thumbnail - Original thumbnail path
 * @param {string} item.path - Item path
 * @param {string} item.type - Item type ('video', 'file', 'audio', 'folder')
 * @param {'movie'|'music'|'manga'|'comic'} mediaType - Type of media
 * @returns {string} Processed thumbnail URL
 */
export const processThumbnailUrl = (item, mediaType = 'movie') => {
  const config = {
    movie: {
      urlPrefix: '/video/',
      fileTypes: ['video', 'file'],
      defaultImage: DEFAULT_IMAGES.video
    },
    music: {
      urlPrefix: '/audio/',
      fileTypes: ['audio', 'file'],
      defaultImage: DEFAULT_IMAGES.music
    },
    manga: {
      urlPrefix: '/manga/',
      fileTypes: ['file'],
      defaultImage: DEFAULT_IMAGES.cover
    },
    comic: {
      urlPrefix: '/manga/',
      fileTypes: ['file'],
      defaultImage: DEFAULT_IMAGES.cover
    }
  };

  const { urlPrefix, fileTypes, defaultImage } = config[mediaType];
  let thumbnailUrl = item.thumbnail;

  // If no thumbnail or 'null' string, use default
  if (!thumbnailUrl || thumbnailUrl === 'null') {
    return fileTypes.includes(item.type) ? defaultImage : DEFAULT_IMAGES.folder;
  }

  // If already a complete URL, return as-is
  if (
    thumbnailUrl.startsWith(urlPrefix) ||
    thumbnailUrl.startsWith('http') ||
    thumbnailUrl.startsWith('/default/')
  ) {
    return thumbnailUrl;
  }

  // Calculate folder prefix
  let folderPrefix;
  if (mediaType === 'movie') {
    // Movie: filter empty parts and pop if file
    let folderPrefixParts = item.path?.split('/').filter(Boolean) || [];
    if (fileTypes.includes(item.type)) {
      folderPrefixParts.pop();
    }
    folderPrefix = folderPrefixParts.join('/');
  } else if (mediaType === 'music') {
    // Music: use full path for folder, parent path for file
    if (item.type === 'folder') {
      folderPrefix = item.path || '';
    } else {
      folderPrefix = item.path?.split('/').slice(0, -1).join('/') || '';
    }
  } else {
    // Manga/Comic: use full path for folder, parent path for file (like music)
    if (item.type === 'folder') {
      folderPrefix = item.path || '';
    } else {
      folderPrefix = item.path?.split('/').slice(0, -1).join('/') || '';
    }
  }

  // Remove folder prefix from thumbnail if included
  let cleanThumbnail = thumbnailUrl;
  if (folderPrefix && cleanThumbnail.startsWith(folderPrefix + '/')) {
    cleanThumbnail = cleanThumbnail.slice(folderPrefix.length + 1);
  }

  // Encode path components
  const safeFolderPrefix = folderPrefix
    ? folderPrefix.split('/').map(encodeURIComponent).join('/') + '/'
    : '';
  const safeThumbnail = cleanThumbnail.split('/').map(encodeURIComponent).join('/');

  // Build final URL
  return `${urlPrefix}${safeFolderPrefix}${safeThumbnail.replace(/\\/g, '/')}`;
};

/**
 * Batch process thumbnails for an array of items
 * 
 * @param {Array} items - Array of media items
 * @param {'movie'|'music'|'manga'|'comic'} mediaType - Type of media
 * @returns {Array} Items with processed thumbnail URLs
 */
export const processThumbnails = (items, mediaType = 'movie') => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    thumbnail: processThumbnailUrl(item, mediaType),
  }));
};
