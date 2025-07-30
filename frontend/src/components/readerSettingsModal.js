// 📁 frontend/src/components/readerSettingsModal.js
// ⚙️ Modal cài đặt cho reader (mode + lazy load)

/**
 * 💾 Lấy cài đặt reader từ localStorage
 */
export function getReaderSettings() {
  const defaultSettings = {
    mode: "vertical", // "vertical" hoặc "horizontal"
    lazyLoad: false   // true: lazy load, false: load tất cả
  };

  try {
    const stored = localStorage.getItem("readerSettings");
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

/**
 * 💾 Lưu cài đặt reader vào localStorage
 */
export function saveReaderSettings(settings) {
  try {
    localStorage.setItem("readerSettings", JSON.stringify(settings));
  } catch (err) {
    console.warn("❌ Không thể lưu reader settings:", err);
  }
}

/**
 * ⚙️ Hiển thị modal cài đặt reader
 */
export function showReaderSettingsModal() {
  return new Promise((resolve) => {
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById("reader-settings-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const currentSettings = getReaderSettings();

    // Tạo modal HTML
    const modal = document.createElement("div");
    modal.id = "reader-settings-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box reader-settings-modal">
        <div class="modal-header">
          <h3>⚙️ Cài đặt đọc truyện</h3>
          <button class="modal-close" type="button">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="setting-group">
            <label class="setting-label">
              <input 
                type="checkbox" 
                id="scrollModeCheckbox" 
                ${currentSettings.mode === "vertical" ? "checked" : ""}
              />
              <span class="checkbox-text">📜 Chế độ cuộn dọc (Scroll Mode)</span>
            </label>
            <div class="setting-description">
              ✅ Bật: Cuộn dọc như webtoon<br>
              ❌ Tắt: Vuốt ngang từng trang
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <input 
                type="checkbox" 
                id="lazyLoadCheckbox"
                ${currentSettings.lazyLoad ? "checked" : ""}
              />
              <span class="checkbox-text">⚡ Lazy Load (Tải ảnh từ từ)</span>
            </label>
            <div class="setting-description">
              ✅ Bật: Tiết kiệm RAM, tải từng ảnh<br>
              ❌ Tắt: Tải tất cả ảnh (mượt hơn)
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="cancelBtn">Hủy</button>
          <button class="btn-primary" id="saveBtn">💾 Lưu cài đặt</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Lấy elements
    const scrollCheckbox = modal.querySelector("#scrollModeCheckbox");
    const lazyLoadCheckbox = modal.querySelector("#lazyLoadCheckbox");
    const saveBtn = modal.querySelector("#saveBtn");
    const cancelBtn = modal.querySelector("#cancelBtn");
    const closeBtn = modal.querySelector(".modal-close");

    // Xử lý sự kiện
    const cleanup = () => {
      modal.remove();
    };

    const handleSave = () => {
      const newSettings = {
        mode: scrollCheckbox.checked ? "vertical" : "horizontal",
        lazyLoad: lazyLoadCheckbox.checked
      };

      saveReaderSettings(newSettings);
      cleanup();
      resolve(newSettings);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    // Gắn sự kiện
    saveBtn.addEventListener("click", handleSave);
    cancelBtn.addEventListener("click", handleCancel);
    closeBtn.addEventListener("click", handleCancel);

    // Click outside để đóng
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    });

    // ESC để đóng
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
  });
}

/**
 * 🔧 Setup nút settings trong reader
 */
export function setupReaderSettingsButton() {
  // Tìm header hoặc tạo nút settings
  const header = document.getElementById("site-header");
  if (!header) return;

  // Kiểm tra nút đã tồn tại chưa
  if (document.getElementById("readerSettingsBtn")) return;

  const headerRight = header.querySelector(".header-right");
  if (!headerRight) return;

  // Tạo nút settings
  const settingsBtn = document.createElement("button");
  settingsBtn.id = "readerSettingsBtn";
  settingsBtn.className = "icon-button";
  settingsBtn.title = "Cài đặt đọc truyện";
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
      // Reload reader với settings mới
      if (window.reloadReaderWithNewSettings) {
        window.reloadReaderWithNewSettings(newSettings);
      }
    }
  });
}
