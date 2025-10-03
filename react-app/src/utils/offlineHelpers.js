// 📁 src/utils/offlineHelpers.js
// 🧰 Shared helpers for offline components

/**
 * Convert a source key into a human readable label.
 * Example: "ROOT_KOMIK" -> "Komik"
 * @param {string} sourceKey
 * @returns {string}
 */
export const formatSourceLabel = (sourceKey = '') => {
  if (!sourceKey) return 'Nguồn không xác định';

  const withoutPrefix = sourceKey.replace(/^(ROOT_|V_|M_)/, '');

  return withoutPrefix
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Extract the manga path from a chapter identifier.
 * Example: "source/manga/chapter" -> "source/manga"
 * @param {string} chapterId
 * @returns {string}
 */
export const getMangaPathFromChapterId = (chapterId = '') => {
  if (!chapterId) return '';

  const cleanPath = chapterId.replace(/\/__self__$/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length <= 1) return cleanPath;

  return segments.slice(0, -1).join('/');
};
