import {
  getRootFolder,
  getSourceKey,
  requireRootFolder,
} from "/src/core/storage.js";
import { renderReader } from "/src/core/reader/index.js";
import {
  setupSidebar,
  toggleSidebar,
  filterManga,
  toggleSearchBar,showToast
} from "/src/core/ui.js";

/**
 * Fetch and render reader data based on the URL path.
 */
async function initializeReader() {
  document.getElementById("loading-overlay")?.classList.remove("hidden");
  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  requireRootFolder(); // 🔐 Kiểm tra root

  const urlParams = new URLSearchParams(window.location.search);
  const rawPath = urlParams.get("path");
  if (!rawPath) {
    showToast("❌ Thiếu path đọc truyện!");
    return;
  }

  const path = rawPath; // 🔥 Giữ nguyên path, backend tự lo /__self__

  try {
    const response = await fetch(
      `/api/folder-cache?mode=path&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}&path=${encodeURIComponent(
        path
      )}`
    );
    const data = await response.json();

    if (data.type === "reader" && Array.isArray(data.images)) {
      document.getElementById("loading-overlay")?.classList.add("hidden"); // ✅ Ẩn overlay sau khi render

      renderReader(data.images);

      setupSidebar();
      // ✅ Gắn sự kiện toggle
      document
        .getElementById("sidebarToggle")
        ?.addEventListener("click", toggleSidebar);
      document
        .getElementById("searchToggle")
        ?.addEventListener("click", toggleSearchBar);
      document
        .getElementById("floatingSearchInput")
        ?.addEventListener("input", filterManga);
    } else {
      showToast("❌ Folder này không chứa ảnh hoặc không hợp lệ!");
    }
  } catch (error) {
    console.error("❌ Lỗi load reader:", error);
    showToast("🚫 Không thể tải dữ liệu!");
  }
}

// 👉 Initialize reader on DOMContentLoaded
window.addEventListener("DOMContentLoaded", initializeReader);
