import {
  getRootFolder,
  getSourceKey,
  requireRootFolder,
} from "/src/core/storage.js";
import { renderReader, getCurrentImage } from "/src/core/reader/index.js";
import {
  setupSidebar,
  toggleSidebar,
  filterManga,
  toggleSearchBar,
  showToast,
} from "/src/core/ui.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";

window.addEventListener("DOMContentLoaded", initializeReader);
/**
 * Fetch and render reader data based on the URL path.
 */
async function initializeReader() {
  document.getElementById("loading-overlay")?.classList.remove("hidden");

  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  requireRootFolder();

  const urlParams = new URLSearchParams(window.location.search);
  const rawPath = urlParams.get("path");
  if (!rawPath) {
    showToast("❌ Thiếu path đọc truyện!");
    return;
  }

  const path = rawPath;  // 🔥 Giữ nguyên path, backend tự lo /__self__

  try {
    const response = await fetch(
      `/api/manga/folder-cache?mode=path&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}&path=${encodeURIComponent(
        path
      )}`
    );
    const data = await response.json();

    if (data.type === "reader" && Array.isArray(data.images)) {
      document.getElementById("loading-overlay")?.classList.add("hidden");  // ✅ Ẩn overlay sau khi render

      renderReader(data.images);
      setupReaderUIEvents();
    } else {
      showToast("❌ Folder này không chứa ảnh hoặc không hợp lệ!");
    }
  } catch (error) {
    console.error("❌ Lỗi load reader:", error);
    showToast("🚫 Không thể tải dữ liệu!");
  }
}

function setupReaderUIEvents() {
  setupSidebar();
  setupGlobalClickToCloseUI();

  document.getElementById("sidebarToggle")?.addEventListener("click", toggleSidebar);
  document.getElementById("searchToggle")?.addEventListener("click", toggleSearchBar);
  document.getElementById("floatingSearchInput")?.addEventListener("input", filterManga);
  document.getElementById("setThumbnailBtn")?.addEventListener("click", setRootThumbnail);
}

async function setRootThumbnail() {
  const img = getCurrentImage();
  if (!img) return;
  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  try {
    await fetch("/api/manga/root-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: sourceKey, root: rootFolder, thumbnail: img.replace(`/manga/${encodeURIComponent(rootFolder)}/`, "") }),
    });
    showToast("✅ Đã lưu thumbnail");
  } catch (err) {
    console.error("set root thumbnail", err);
    showToast("❌ Lỗi set thumbnail");
  }
}
