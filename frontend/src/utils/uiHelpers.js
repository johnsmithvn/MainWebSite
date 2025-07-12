// 📁 frontend/src/utils/uiHelpers.js
import { TIMING, API_ENDPOINTS } from '/frontend/constants/index.js';
import { getSourceKey } from "/src/core/storage.js";
import { showConfirm, showToast, withLoading } from "/src/core/ui.js";

/**
 * 🎨 UI Helper functions - Tái sử dụng logic UI chung
 */

/**
 * 🖼️ Setup Extract Thumbnail Button - Generic version
 * @param {string} buttonId - ID của button
 * @param {Function} getCurrentPath - Function trả về current path
 * @param {Function} reloadCallback - Callback để reload sau khi extract
 * @param {string} type - 'movie' hoặc 'music'
 */
export function setupExtractThumbnailButton(buttonId, getCurrentPath, reloadCallback, type = 'movie') {
  const extractBtn = document.getElementById(buttonId);
  if (!extractBtn) return;

  extractBtn.onclick = withLoading(async () => {
    // Confirm dialog
    const confirmText = `Extract lại thumbnail ${type === 'movie' ? 'phim' : 'nhạc'} cho toàn bộ folder hiện tại?`;
    const ok = await showConfirm(confirmText);
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast(`❌ Không xác định được nguồn ${type === 'movie' ? 'phim' : 'nhạc'}!`);
      return;
    }

    const currentPath = getCurrentPath();

    try {
      if (type === 'movie') {
        await extractMovieThumbnails(sourceKey, currentPath);
      } else if (type === 'music') {
        await extractMusicThumbnails(sourceKey, currentPath);
      }
      
      showToast("✅ Đã extract thumbnail xong!");
      if (reloadCallback) reloadCallback();
    } catch (err) {
      showToast("❌ Lỗi extract thumbnail!");
      console.error(err);
    }
  });
}

/**
 * 🎬 Extract thumbnails cho movie
 */
async function extractMovieThumbnails(sourceKey, currentPath) {
  const resp = await fetch(API_ENDPOINTS.MOVIE.EXTRACT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: sourceKey,
      path: currentPath,
    }),
  });
  
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.message || "Extract failed");
  }
}

/**
 * 🎵 Extract thumbnails cho music
 */
async function extractMusicThumbnails(sourceKey, currentPath) {
  // Lấy danh sách file nhạc
  const params = new URLSearchParams();
  if (sourceKey) params.set("key", sourceKey);
  if (currentPath) params.set("path", currentPath);

  const res = await fetch(API_ENDPOINTS.MUSIC.FOLDER + "?" + params.toString());
  const data = await res.json();
  const list = data.folders || [];
  
  const audioFiles = list.filter(item => item.type === "audio");
  
  if (audioFiles.length === 0) {
    showToast("😅 Không có bài hát nào để extract thumbnail.");
    return;
  }

  showToast("⏳ Đang extract thumbnail...");

  // Extract từng file
  for (const item of audioFiles) {
    const resp = await fetch(API_ENDPOINTS.MUSIC.EXTRACT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: sourceKey, file: item.path }),
    });
    
    const result = await resp.json();
    // Có thể thêm progress tracking ở đây
  }
}

/**
 * 🔄 Setup Scan Button - Generic version
 * @param {string} type - 'movie' hoặc 'music'  
 * @param {Function} reloadCallback - Callback sau khi scan
 */
export function setupScanButton(type, reloadCallback) {
  const scanBtn = document.getElementById("scan-btn");
  if (!scanBtn) return;

  scanBtn.onclick = withLoading(async () => {
    const confirmText = `Scan lại toàn bộ ${type === 'movie' ? 'phim' : 'nhạc'}?`;
    const ok = await showConfirm(confirmText);
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast(`❌ Không xác định được nguồn ${type}!`);
      return;
    }

    try {
      const apiPath = type === 'movie' ? API_ENDPOINTS.MOVIE.SCAN : API_ENDPOINTS.MUSIC.SCAN;
      const resp = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: sourceKey }),
      });
      
      const data = await resp.json();
      if (data.success) {
        showToast("✅ Scan hoàn tất!");
        if (reloadCallback) reloadCallback();
      } else {
        throw new Error(data.message || "Scan failed");
      }
    } catch (err) {
      showToast("❌ Lỗi scan!");
      console.error(err);
    }
  });
}

/**
 * 🎯 Setup generic button với loading
 * @param {string} buttonId - ID của button
 * @param {Function} action - Action function
 * @param {string} confirmText - Text xác nhận
 * @param {string} successText - Text thành công
 * @param {string} errorText - Text lỗi
 */
export function setupButton(buttonId, action, confirmText = null, successText = "✅ Thành công!", errorText = "❌ Có lỗi xảy ra!") {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.onclick = withLoading(async () => {
    if (confirmText) {
      const ok = await showConfirm(confirmText);
      if (!ok) return;
    }
    
    try {
      const result = await action();
      if (result !== false) { // Allow action to return false to skip success message
        showToast(successText);
      }
    } catch (err) {
      showToast(errorText);
      console.error(err);
    }
  });
}

/**
 * 🎨 Setup multiple buttons at once
 * @param {Array} buttonConfigs - Array of button configurations
 */
export function setupButtons(buttonConfigs) {
  buttonConfigs.forEach(config => {
    const { id, action, confirmText, successText, errorText } = config;
    setupButton(id, action, confirmText, successText, errorText);
  });
}

/**
 * 🔄 Utility function to create loading wrapper
 * @param {Function} action - Action to wrap
 * @returns {Function} - Wrapped action
 */
export function createLoadingWrapper(action) {
  return withLoading(action);
}

/**
 * 📊 Show progress toast
 * @param {string} message - Progress message
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */
export function showProgressToast(message, current, total) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  showToast(`${message} (${current}/${total} - ${percentage}%)`);
}

/**
 * 🎛️ Setup control panel buttons
 * @param {Object} config - Configuration object
 */
export function setupControlPanel(config) {
  const {
    type,
    currentPath,
    reloadCallback,
    scanCallback,
    extractCallback,
    resetCallback
  } = config;

  // Setup extract button
  if (extractCallback || currentPath) {
    setupExtractThumbnailButton(type, currentPath, extractCallback || reloadCallback);
  }

  // Setup scan button
  if (scanCallback || reloadCallback) {
    setupScanButton(type, scanCallback || reloadCallback);
  }

  // Setup custom buttons
  if (resetCallback) {
    setupButton("reset-btn", resetCallback, 
      `Reset toàn bộ ${type}?`, 
      "✅ Reset thành công!", 
      "❌ Lỗi reset!"
    );
  }
}

/**
 * 🎨 Create status indicator
 * @param {string} containerId - Container element ID
 * @param {string} status - Status text
 * @param {string} type - Status type ('success', 'error', 'warning', 'info')
 */
export function createStatusIndicator(containerId, status, type = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const indicator = document.createElement('div');
  indicator.className = `status-indicator status-${type}`;
  indicator.textContent = status;
  
  container.appendChild(indicator);
  
  // Auto remove after UI_INDICATOR_TIMEOUT (5 giây)
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, TIMING.UI_INDICATOR_TIMEOUT);
}

export default {
  setupExtractThumbnailButton,
  setupScanButton,
  setupButton,
  setupButtons,
  setupControlPanel,
  createLoadingWrapper,
  showProgressToast,
  createStatusIndicator,
};
