// 📄 frontend/src/pages/index.js

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
} from "/src/core/ui.js";
import {
  getRootFolder,
  requireRootFolder,
  getSourceKey,
  changeRootFolder,
  recentViewedKey,
} from "/src/core/storage.js";
import { setupSidebar, toggleSidebar } from "/src/core/ui.js";

// Gắn global nếu HTML cần gọi
window.loadFolder = loadFolder;
// window.goBack = goBack;
window.toggleDarkMode = toggleDarkMode;
window.toggleSearchBar = toggleSearchBar;
window.changeRootFolder = changeRootFolder;
window.getRootFolder = getRootFolder;

window.addEventListener("DOMContentLoaded", async () => {
  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();
  requireRootFolder(); // 🔐 Kiểm tra root
  setupSidebar();

  const urlParams = new URLSearchParams(window.location.search);
  const initialPath = urlParams.get("path") || "";

  loadFolder(initialPath); // 🧠 Load folder theo URL nếu có
  // 👉 Random banner
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
    const res1 = await fetch(
      `/api/folder-cache?mode=random&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}`
    );

    listRandom = await res1.json();
    localStorage.setItem(
      randomKey,
      JSON.stringify({ data: listRandom, time: Date.now() })
    );
  }

  if (Array.isArray(listRandom)) {
    renderRandomBanner(listRandom);
    const cache = localStorage.getItem(randomKey);
    if (cache) {
      const { time } = JSON.parse(cache);
      showRandomUpdatedTime(time);
    }

    document
      .getElementById("refresh-random-btn")
      ?.addEventListener("click", () => {
        localStorage.removeItem(randomKey);
        location.reload();
      });
  }

  // 👉 Top View
  try {
    const res2 = await fetch(
      `/api/folder-cache?mode=top&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}`
    );
    const listTop = await res2.json();
    if (Array.isArray(listTop)) {
      renderTopView(listTop);
    }
  } catch (err) {
    console.error("❌ Lỗi fetch top view:", err);
  }

  // 👉 Recent Viewed
  const recentRaw = localStorage.getItem(recentViewedKey());
  if (recentRaw) {
    const list = JSON.parse(recentRaw);
    renderRecentViewed(list);
  }

  // 👉 Tìm kiếm
  document
    .getElementById("floatingSearchInput")
    ?.addEventListener("input", filterManga);

  // 👉 Header padding fix
  const header = document.getElementById("site-header");
  const wrapper = document.getElementById("wrapper");
  if (header && wrapper) {
    wrapper.style.paddingTop = `${header.offsetHeight}px`;
  }
});

// 👉 Nút reset cache
document
  .getElementById("reset-cache-btn")
  ?.addEventListener("click", async () => {
    const root = getRootFolder();
    if (!root) return showToast("❌ Chưa chọn root!");

    if (!confirm(`Reset cache cho '${root}'?`)) return;

    try {
      const res = await fetch(
        `/api/reset-cache?root=${encodeURIComponent(root)}`,
        {
          method: "DELETE",
        }
      );
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
  });

//  👉 Nút toggle sidebar
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  if (typeof toggleSidebar === "function") {
    toggleSidebar();
  } else {
    console.warn("toggleSidebar() not defined");
  }
});

document.getElementById("searchToggle")?.addEventListener("click", () => {
  if (typeof toggleSearchBar === "function") {
    toggleSearchBar();
  } else {
    console.warn("toggleSearchBar() not defined");
  }
});
