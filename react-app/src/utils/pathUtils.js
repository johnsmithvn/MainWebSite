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
  
  const folderName = getFolderName(mangaPath);
  const cleanPath = mangaPath.replace(/\/__self__$/, '');
  const pathParts = cleanPath.split('/').filter(Boolean);
  
  const mangaTitle = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : folderName;
  const chapterTitle = folderName;
  
  return { mangaTitle, chapterTitle };
};
