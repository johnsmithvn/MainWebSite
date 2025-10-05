/**
 * Database Operation Handlers
 * 
 * Generic handlers cho Scan/Delete/Reset operations
 * Thay thế duplicate code trong Settings.jsx
 */

/**
 * Configuration cho các media types
 */
const MEDIA_CONFIGS = {
  manga: {
    label: 'Manga',
    icon: '📚',
    apiEndpoints: {
      scan: '/api/manga/scan',
      delete: '/api/manga/delete-db',
      reset: '/api/manga/reset-cache'
    },
    requestBody: (sourceKey, rootFolder) => ({ key: sourceKey, root: rootFolder }),
    displayLocation: (sourceKey, rootFolder) => rootFolder || 'current root',
    itemLabel: 'folders'
  },
  movie: {
    label: 'Movie',
    icon: '🎬',
    apiEndpoints: {
      scan: '/api/movie/scan-movie',
      delete: '/api/movie/delete-db',
      reset: '/api/movie/reset-db'
    },
    requestBody: (sourceKey) => ({ key: sourceKey }),
    displayLocation: (sourceKey) => sourceKey || 'current source',
    itemLabel: 'video files'
  },
  music: {
    label: 'Music',
    icon: '🎵',
    apiEndpoints: {
      scan: '/api/music/scan-music',
      delete: '/api/music/delete-db',
      reset: '/api/music/reset-db'
    },
    requestBody: (sourceKey) => ({ key: sourceKey }),
    displayLocation: (sourceKey) => sourceKey || 'current source',
    itemLabel: 'audio files'
  }
};

/**
 * Create generic scan handler
 * 
 * @param {string} mediaType - 'manga', 'movie', or 'music'
 * @param {Object} authState - { sourceKey, rootFolder }
 * @param {Function} confirmModal - Confirmation modal function
 * @param {Function} successModal - Success modal function
 * @param {Function} errorModal - Error modal function
 * @returns {Function} Handler function
 */
export const createScanHandler = (mediaType, authState, confirmModal, successModal, errorModal) => {
  const config = MEDIA_CONFIGS[mediaType];
  const { sourceKey, rootFolder } = authState;

  return () => {
    confirmModal({
      title: `${config.icon} Scan ${config.label} Database`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Scan {config.itemLabel} and update database?</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 What will happen:</p>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Scan all {config.itemLabel} in: <strong>{config.displayLocation(sourceKey, rootFolder)}</strong></li>
              <li>• Update database with new {config.itemLabel}</li>
              <li>• This will NOT delete existing data</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: '🔍 Start Scan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(config.apiEndpoints.scan, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.requestBody(sourceKey, rootFolder))
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Scan Completed!',
              message: `${config.label} scan completed successfully. ${result.message || result.stats?.total ? `Found ${result.stats.total} items.` : ''}`
            });
          } else {
            errorModal({
              title: '❌ Scan Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };
};

/**
 * Create generic delete handler
 * 
 * @param {string} mediaType - 'manga', 'movie', or 'music'
 * @param {Object} authState - { sourceKey, rootFolder }
 * @param {Function} confirmModal - Confirmation modal function
 * @param {Function} successModal - Success modal function
 * @param {Function} errorModal - Error modal function
 * @returns {Function} Handler function
 */
export const createDeleteHandler = (mediaType, authState, confirmModal, successModal, errorModal) => {
  const config = MEDIA_CONFIGS[mediaType];
  const { sourceKey, rootFolder } = authState;

  return () => {
    confirmModal({
      title: `🗑️ Delete ${config.label} Database`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete ALL {config.label.toLowerCase()} database entries?</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 What will be deleted:</p>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• ALL {config.itemLabel} in database for: <strong>{config.displayLocation(sourceKey, rootFolder)}</strong></li>
              <li>• ALL view counts and statistics</li>
              <li>• ALL favorite markers</li>
            </ul>
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold">
            ⚠️ Files will NOT be deleted, only database entries!
          </p>
        </div>
      ),
      confirmText: '🗑️ Delete Database',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(config.apiEndpoints.delete, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.requestBody(sourceKey, rootFolder))
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Database Deleted!',
              message: `${config.label} database has been cleared successfully.`
            });
          } else {
            errorModal({
              title: '❌ Delete Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };
};

/**
 * Create generic reset handler
 * 
 * @param {string} mediaType - 'manga', 'movie', or 'music'
 * @param {Object} authState - { sourceKey, rootFolder }
 * @param {Function} confirmModal - Confirmation modal function
 * @param {Function} successModal - Success modal function
 * @param {Function} errorModal - Error modal function
 * @returns {Function} Handler function
 */
export const createResetHandler = (mediaType, authState, confirmModal, successModal, errorModal) => {
  const config = MEDIA_CONFIGS[mediaType];
  const { sourceKey, rootFolder } = authState;

  return () => {
    confirmModal({
      title: `♻️ Reset ${config.label} Database`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Delete and rescan {config.label.toLowerCase()} database?</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔄 What will happen:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Delete ALL database entries for: <strong>{config.displayLocation(sourceKey, rootFolder)}</strong></li>
              <li>• Scan and rebuild database from scratch</li>
              <li>• View counts and favorites will be lost</li>
            </ul>
          </div>
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
            ⚠️ This is a complete reset! Use "Scan" if you just want to add new items.
          </p>
        </div>
      ),
      confirmText: '♻️ Reset Database',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(config.apiEndpoints.reset, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.requestBody(sourceKey, rootFolder))
          });
          const result = await response.json();
          
          if (result.success) {
            successModal({
              title: '✅ Reset Completed!',
              message: `${config.label} database has been reset successfully. ${result.message || ''}`
            });
          } else {
            errorModal({
              title: '❌ Reset Failed',
              message: result.error || 'Unknown error occurred'
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Network Error',
            message: 'Failed to connect to server: ' + error.message
          });
        }
      }
    });
  };
};

/**
 * Create combined scan & delete handler
 * 
 * @param {string} mediaType - 'manga', 'movie', or 'music'
 * @param {Object} authState - { sourceKey, rootFolder }
 * @param {Function} confirmModal - Confirmation modal function
 * @param {Function} successModal - Success modal function
 * @param {Function} errorModal - Error modal function
 * @returns {Function} Handler function
 */
export const createScanAndDeleteHandler = (mediaType, authState, confirmModal, successModal, errorModal) => {
  const config = MEDIA_CONFIGS[mediaType];
  const { sourceKey, rootFolder } = authState;

  return () => {
    confirmModal({
      title: `🔄 Scan & Clean ${config.label} Database`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">Scan {config.itemLabel} and remove non-existent entries?</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🧹 What will happen:</p>
            <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
              <li>• Scan all {config.itemLabel} in: <strong>{config.displayLocation(sourceKey, rootFolder)}</strong></li>
              <li>• Remove database entries for deleted/moved {config.itemLabel}</li>
              <li>• Keep entries for existing {config.itemLabel}</li>
            </ul>
          </div>
          <p className="text-purple-600 dark:text-purple-400 font-semibold">
            💡 This is useful for cleaning up after deleting/moving files.
          </p>
        </div>
      ),
      confirmText: '🔄 Scan & Clean',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // First delete
          const deleteResponse = await fetch(config.apiEndpoints.delete, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.requestBody(sourceKey, rootFolder))
          });
          const deleteResult = await deleteResponse.json();
          
          if (!deleteResult.success) {
            throw new Error(deleteResult.error || 'Delete failed');
          }

          // Then scan
          const scanResponse = await fetch(config.apiEndpoints.scan, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.requestBody(sourceKey, rootFolder))
          });
          const scanResult = await scanResponse.json();
          
          if (scanResult.success) {
            successModal({
              title: '✅ Scan & Clean Completed!',
              message: `${config.label} database has been cleaned and rescanned successfully. ${scanResult.message || ''}`
            });
          } else {
            errorModal({
              title: '⚠️ Partial Success',
              message: `Database was deleted but scan failed: ${scanResult.error || 'Unknown error'}`
            });
          }
        } catch (error) {
          errorModal({
            title: '❌ Operation Failed',
            message: 'Failed to complete operation: ' + error.message
          });
        }
      }
    });
  };
};

/**
 * Helper to create all handlers for a media type at once
 * 
 * @param {string} mediaType - 'manga', 'movie', or 'music'
 * @param {Object} authState - { sourceKey, rootFolder }
 * @param {Object} modals - { confirmModal, successModal, errorModal }
 * @returns {Object} Object containing all handlers
 */
export const createMediaHandlers = (mediaType, authState, modals) => {
  const { confirmModal, successModal, errorModal } = modals;

  return {
    handleScan: createScanHandler(mediaType, authState, confirmModal, successModal, errorModal),
    handleDelete: createDeleteHandler(mediaType, authState, confirmModal, successModal, errorModal),
    handleReset: createResetHandler(mediaType, authState, confirmModal, successModal, errorModal),
    handleScanAndDelete: createScanAndDeleteHandler(mediaType, authState, confirmModal, successModal, errorModal)
  };
};
