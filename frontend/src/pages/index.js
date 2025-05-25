import { loadFolder } from "/src/core/folder.js";
import {
  filterManga,
  toggleDarkMode,
  toggleSearchBar,
  renderRandomBanner,
  renderTopView,
  renderRecentViewed,
  showRandomUpdatedTime,
  showToast,
  setupSidebar,
  toggleSidebar,
} from "/src/core/ui.js";
import {
  getRootFolder,
  requireRootFolder,
  getSourceKey,
  changeRootFolder,
  recentViewedKey,
} from "/src/core/storage.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";

window.loadFolder = loadFolder;
window.toggleDarkMode = toggleDarkMode;
window.toggleSearchBar = toggleSearchBar;
window.changeRootFolder = changeRootFolder;
window.getRootFolder = getRootFolder;

window.addEventListener("DOMContentLoaded", initializeMangaHome);

async function initializeMangaHome() {
  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  requireRootFolder();
  setupSidebar();
  setupGlobalClickToCloseUI();

  const urlParams = new URLSearchParams(window.location.search);
  const initialPath = urlParams.get("path") || "";
  loadFolder(initialPath);

  await loadRandomBanner(sourceKey, rootFolder);
  await loadTopView(sourceKey, rootFolder);
  renderRecentViewFromLocal();

  document.getElementById("floatingSearchInput")?.addEventListener("input", filterManga);
  document.getElementById("searchToggle")?.addEventListener("click", toggleSearchBar);
  document.getElementById("sidebarToggle")?.addEventListener("click", toggleSidebar);

  const header = document.getElementById("site-header");
  const wrapper = document.getElementById("wrapper");
  if (header && wrapper) {
    wrapper.style.paddingTop = `${header.offsetHeight}px`;
  }

  document.getElementById("reset-cache-btn")?.addEventListener("click", resetCache);
}

async function loadRandomBanner(sourceKey, rootFolder) {
  const randomKey = `randomView::${sourceKey}::${rootFolder}`;
  let listRandom = null;

  try {
    const cache = localStorage.getItem(randomKey);
    if (cache) {
      const { data, time } = JSON.parse(cache);
      if (Date.now() - time < 30 * 60 * 1000) {
        listRandom = data;
        console.log("⚡ Dùng cache random từ localStorage");
      }
    }
  } catch (err) {
    console.warn("❌ Lỗi đọc cache random:", err);
  }

  if (!listRandom) {
    const res = await fetch(`/api/folder-cache?mode=random&key=${encodeURIComponent(sourceKey)}&root=${encodeURIComponent(rootFolder)}`);
    listRandom = await res.json();
    localStorage.setItem(randomKey, JSON.stringify({ data: listRandom, time: Date.now() }));
  }

  if (Array.isArray(listRandom)) {
    renderRandomBanner(listRandom);
    const { time } = JSON.parse(localStorage.getItem(randomKey));
    showRandomUpdatedTime(time);
    document.getElementById("refresh-random-btn")?.addEventListener("click", () => {
      localStorage.removeItem(randomKey);
      location.reload();
    });
  }
}

async function loadTopView(sourceKey, rootFolder) {
  try {
    const res = await fetch(`/api/folder-cache?mode=top&key=${encodeURIComponent(sourceKey)}&root=${encodeURIComponent(rootFolder)}`);
    const listTop = await res.json();
    if (Array.isArray(listTop)) {
      renderTopView(listTop);
    }
  } catch (err) {
    console.error("❌ Lỗi fetch top view:", err);
  }
}

function renderRecentViewFromLocal() {
  const recentRaw = localStorage.getItem(recentViewedKey());
  if (recentRaw) {
    const list = JSON.parse(recentRaw);
    renderRecentViewed(list);
  }
}

async function resetCache() {
  const root = getRootFolder();
  if (!root) return showToast("❌ Chưa chọn root!");

  if (!confirm(`Reset cache cho '${root}'?`)) return;

  try {
    const res = await fetch(`/api/reset-cache?root=${encodeURIComponent(root)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      showToast("✅ Reset xong!");
      location.reload();
    } else {
      showToast("❌ Reset thất bại!");
    }
  } catch (err) {
    showToast("🚫 Lỗi kết nối API reset");
    console.error(err);
  }
}
