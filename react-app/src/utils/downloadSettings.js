/**
 * Download settings utilities
 *
 * Provides helpers to sanitize and normalize download chunk configuration
 * that can be shared between the download queue store and worker without
 * introducing circular dependencies.
 */

export const DOWNLOAD_CHUNK_LIMITS = {
  size: { min: 1, max: 10 },
  delay: { min: 50, max: 500 }
};

export const DEFAULT_DOWNLOAD_SETTINGS = {
  chunkSize: 2,
  chunkDelay: 100
};

const toFiniteNumber = (value, fallback) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const sanitizeChunkSize = (value) => {
  const { min, max } = DOWNLOAD_CHUNK_LIMITS.size;
  const fallback = DEFAULT_DOWNLOAD_SETTINGS.chunkSize;
  const numericValue = toFiniteNumber(value, fallback);
  return Math.max(min, Math.min(max, Math.round(numericValue)));
};

export const sanitizeChunkDelay = (value) => {
  const { min, max } = DOWNLOAD_CHUNK_LIMITS.delay;
  const fallback = DEFAULT_DOWNLOAD_SETTINGS.chunkDelay;
  const numericValue = toFiniteNumber(value, fallback);
  return Math.max(min, Math.min(max, Math.round(numericValue)));
};

export const normalizeDownloadSettings = (settings = {}) => ({
  chunkSize: sanitizeChunkSize(settings.chunkSize),
  chunkDelay: sanitizeChunkDelay(settings.chunkDelay)
});

