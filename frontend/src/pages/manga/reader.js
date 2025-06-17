import {
  getRootFolder,
  getSourceKey,
  requireRootFolder,
  setRootThumbCache,
} from "/src/core/storage.js";
import { renderReader, getCurrentImage } from "/src/core/reader/index.js";
import {
  setupSidebar,
  toggleSidebar,
  filterManga,
  toggleSearchBar,
  showToast,
  showOverlay,
  hideOverlay,
  goHome,
} from "/src/core/ui.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";
// Update local caches when toggling favorite so other pages reflect the change
import { updateFavoriteEverywhere } from "/src/components/folderCard.js";
import { isSecureKey, getToken, showLoginModal } from "/src/core/security.js";

window.goHome = goHome;

window.addEventListener("DOMContentLoaded", initializeReader);
let isFavorite = false;
let currentFolderPath = "";
/**
 * Fetch and render reader data based on the URL path.
 */
async function initializeReader() {
  showOverlay();

  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  requireRootFolder();

  if (isSecureKey(sourceKey) && !getToken()) {
    const ok = await showLoginModal(sourceKey);
    if (!ok) return goHome();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const rawPath = urlParams.get("path");
  if (!rawPath) {
    showToast("❌ Thiếu path đọc truyện!");
    return;
  }

  const path = rawPath; // 🔥 Giữ nguyên path, backend tự lo /__self__
  currentFolderPath = path.replace(/\/__self__$/, "");

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
      hideOverlay(); // ✅ Ẩn overlay sau khi render

      renderReader(data.images);
      setupReaderUIEvents();
      checkFavoriteState();
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
  document.getElementById("favToggleBtn")?.addEventListener("click", toggleFavorite);
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
      body: JSON.stringify({
        key: sourceKey,
        root: rootFolder,
        thumbnail: img.replace(`/manga/${encodeURIComponent(rootFolder)}/`, ""),
      }),
    });
    setRootThumbCache(
      sourceKey,
      rootFolder,
      img.replace(`/manga/${encodeURIComponent(rootFolder)}/`, "")
    );
    showToast("✅ Đã lưu thumbnail");
  } catch (err) {
    console.error("set root thumbnail", err);
    showToast("❌ Lỗi set thumbnail");
  }
}

function updateFavBtn() {
  const btn = document.getElementById("favToggleBtn");
  if (!btn) return;
  btn.textContent = isFavorite ? "❤️" : "🤍";
  btn.title = isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích";
}

async function checkFavoriteState() {
  const key = getSourceKey();
  const root = getRootFolder();
  if (!key || !root) return;
  try {
    const res = await fetch(
      `/api/manga/favorite?key=${encodeURIComponent(key)}&root=${encodeURIComponent(
        root
      )}`
    );
    const list = await res.json();
    isFavorite = list.some((f) => f.path === currentFolderPath);
    updateFavBtn();
  } catch (err) {
    console.warn("❌ Failed to check favorite:", err);
  }
}

async function toggleFavorite() {
  const key = getSourceKey();
  const root = getRootFolder();
  if (!key || !root) return;
  isFavorite = !isFavorite;
  updateFavBtn();
  try {
    await fetch("/api/manga/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbkey: key, path: currentFolderPath, value: isFavorite }),
    });
    // Sync caches (folder lists, random sliders, etc.) with new favorite state
    updateFavoriteEverywhere(key, root, currentFolderPath, isFavorite);
  } catch (err) {
    console.error("❌ Lỗi khi toggle favorite:", err);
    showToast("❌ Lỗi khi toggle yêu thích");
  }
}
