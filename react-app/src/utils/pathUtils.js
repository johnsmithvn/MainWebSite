/**
 * Shared utility functions for path manipulation
 * Prevents code duplication across components
 */

/**
 * Extract folder name from path for breadcrumb display
 * @param {string} currentPath - The current path
 * @returns {string} - Clean folder name or default text
 */
export const getFolderName = (currentPath) => {
  if (!currentPath) return 'Manga Reader';

  // Remove /__self__ suffix if exists
  const cleanPath = currentPath.replace(/\/__self__$/, '');
  const pathParts = cleanPath.split('/').filter(Boolean);
  return pathParts[pathParts.length - 1] || 'Manga Reader';
};

/**
 * Extract parent path from current path
 * @param {string} currentPath - The current path
 * @returns {string} - Parent path or root
 */
export const getParentPath = (currentPath) => {
  if (!currentPath) return '';
  
  const cleanPath = currentPath.replace(/\/__self__$/, '');
  const pathParts = cleanPath.split('/').filter(Boolean);
  
  if (pathParts.length <= 1) return '';
  return '/' + pathParts.slice(0, -1).join('/');
};

/**
 * Check if path is at root level
 * @param {string} currentPath - The current path
 * @returns {boolean} - True if at root level
 */
export const isRootLevel = (currentPath) => {
  if (!currentPath) return true;
  
  const cleanPath = currentPath.replace(/\/__self__$/, '');
  const pathParts = cleanPath.split('/').filter(Boolean);
  return pathParts.length <= 1;
};

/**
 * Extract manga and chapter titles from path
 * @param {string} mangaPath - The manga path
 * @returns {Object} - Object containing mangaTitle and chapterTitle
 */
export const extractTitlesFromPath = (mangaPath) => {
  if (!mangaPath) return { mangaTitle: '', chapterTitle: '' };
  
  // Remove __self__ suffix
  const cleanPath = mangaPath.replace(/\/__self__$/, '');
  
  // Split path and filter empty parts
  const pathParts = cleanPath.split('/').filter(Boolean);
  
  // Get folder name (last part of path) - this is the manga title
  const folderName = pathParts[pathParts.length - 1] || '';
  
  // For this app structure: path is just "ROOT/MangaName"
  // So folderName IS the manga title, not chapter title
  const mangaTitle = folderName;
  const chapterTitle = folderName; // Same as manga title since no separate chapter folders
  if (process.env.NODE_ENV !== 'production') {
  console.log('📖 Extract titles from path:', {
    originalPath: mangaPath,
    cleanPath,
    pathParts,
    mangaTitle,
    chapterTitle,
    note: 'Using folder name as manga title directly'
  });
    }
  return { mangaTitle, chapterTitle };
};
