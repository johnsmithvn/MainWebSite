// 📁 frontend/src/core/mangaSettings.js
// ⚙️ Settings cho toàn bộ manga pages (index, reader, favorites)

import { getReaderSettings, saveReaderSettings, showReaderSettingsModal } from "/src/components/readerSettingsModal.js";

/**
 * ⚙️ Setup nút settings cho manga pages (index, reader, favorites)
 * Nút này sẽ xuất hiện trên tất cả manga pages
 */
export function setupMangaSettingsButton() {
  // Chỉ setup cho manga pages
  if (!window.location.pathname.includes("manga")) return;
  
  const header = document.getElementById("site-header");
  if (!header) return;

  // Kiểm tra nút đã tồn tại chưa
  if (document.getElementById("mangaSettingsBtn")) return;

  const headerRight = header.querySelector(".header-right");
  if (!headerRight) return;

  // Tạo nút settings
  const settingsBtn = document.createElement("button");
  settingsBtn.id = "mangaSettingsBtn";
  settingsBtn.className = "icon-button";
  settingsBtn.title = "Cài đặt manga";
  settingsBtn.textContent = "⚙️";

  // Thêm vào header (trước nút search)
  const searchBtn = headerRight.querySelector("#searchToggle");
  if (searchBtn) {
    headerRight.insertBefore(settingsBtn, searchBtn);
  } else {
    headerRight.appendChild(settingsBtn);
  }

  // Xử lý click
  settingsBtn.addEventListener("click", async () => {
    const newSettings = await showReaderSettingsModal();
    if (newSettings) {
      // Nếu đang ở reader page, reload reader
      if (window.location.pathname.includes("reader") && window.reloadReaderWithNewSettings) {
        window.reloadReaderWithNewSettings(newSettings);
      }
      
      // Show toast thông báo đã lưu
      if (window.showToast) {
        window.showToast("💾 Đã lưu cài đặt!");
      }
    }
  });
}

/**
 * 🔄 Apply settings từ localStorage cho current page
 */
export function applyMangaSettings() {
  const settings = getReaderSettings();
  
  // Nếu đang ở reader page và có readerMode khác với current
  if (window.location.pathname.includes("reader")) {
    // Settings sẽ được apply khi reader load
    return;
  }
  
  // Có thể thêm logic apply settings cho các page khác (index, favorites) nếu cần
  console.log("📖 Current manga settings:", settings);
}

/**
 * 💾 Get current manga settings
 */
export function getCurrentMangaSettings() {
  return getReaderSettings();
}

/**
 * 💾 Update manga settings
 */
export function updateMangaSettings(newSettings) {
  saveReaderSettings(newSettings);
  applyMangaSettings();
}
