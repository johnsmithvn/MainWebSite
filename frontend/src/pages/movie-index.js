import {} from "/src/components/folderCard.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";
import { getSourceKey } from "/src/core/storage.js";
import { renderMovieCardWithFavorite } from "/src/components/movieCard.js";
import { recentViewedVideoKey } from "/src/core/storage.js";
import { createMediaLoader } from "/src/core/mediaLoader.js";

import {
  filterMovie,
  toggleSearchBar,
  setupMovieSidebar,
  showConfirm,
  showToast,
  toggleSidebar,withLoading
} from "/src/core/ui.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";
import { getMovieCache, setMovieCache } from "/src/core/storage.js";
import {
  loadRandomSliders,
  setupRandomSectionsIfMissing,
} from "/src/components/folderSlider.js";

// 👉 Gắn sự kiện UI
window.addEventListener("DOMContentLoaded", () => {
  const initialPath = getInitialPathFromURL();
  loadMovieFolder(initialPath);
  setupExtractThumbnailButton();
  setupRandomSectionsIfMissing();
  loadRandomSliders();
  loadTopVideoSlider();
  setupMovieSidebar();
  renderRecentVideoSlider(); // 🆕 Thêm dòng này

  document
    .getElementById("floatingSearchInput")
    ?.addEventListener("input", filterMovie);
  document
    .getElementById("searchToggle")
    ?.addEventListener("click", toggleSearchBar);
  document
    .getElementById("sidebarToggle")
    ?.addEventListener("click", toggleSidebar);

  setupGlobalClickToCloseUI(); // ✅ xử lý click ra ngoài để đóng sidebar + search
});

function getInitialPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("path") || "";
}

function setupExtractThumbnailButton() {
  const extractBtn = document.getElementById("extract-thumbnail-btn");
  if (!extractBtn) return;

  extractBtn.onclick = withLoading(async () => {
    // KHÔNG truyền {loading: true} nữa
    const ok = await showConfirm("Extract lại thumbnail phim cho toàn bộ folder hiện tại?");
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast("❌ Không xác định được nguồn phim!");
      return;
    }


    try {
      const resp = await fetch("/api/movie/extract-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: sourceKey,
          path: movieLoader.currentPath,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        showToast("✅ Đã extract thumbnail xong!");
        loadMovieFolder(movieLoader.currentPath, movieLoader.page);
      } else {
        showToast("❌ Lỗi extract thumbnail!");
      }
    } catch (err) {
      showToast("❌ Lỗi khi extract thumbnail!");
      console.error(err);
    }
    // KHÔNG cần finally overlay nữa!
  });
}


const movieLoader = createMediaLoader({
  appId: "movie-app",
  gridClass: "movie-grid",
  rootTitle: "📂 Danh sách phim",
  perPage: 20,
  cacheMaxAge: 7 * 60 * 60 * 1000,
  getSourceKey,
  getCache: getMovieCache,
  setCache: setMovieCache,
  fetchUrl: (key, path) => {
    const params = new URLSearchParams();
    params.set("key", key);
    if (path) params.set("path", path);
    return "/api/movie/movie-folder?" + params.toString();
  },
  prepareItem: (item) => {
    let folderPrefixParts = item.path?.split("/").filter(Boolean);
    if (item.type === "video" || item.type === "file") folderPrefixParts.pop();
    let folderPrefix = folderPrefixParts.join("/");
    let thumbnailUrl = item.thumbnail
      ? `/video/${folderPrefix ? folderPrefix + "/" : ""}${item.thumbnail.replace(/\\/g, "/")}`
      : item.type === "video" || item.type === "file"
      ? "/default/video-thumb.png"
      : "/default/folder-thumb.png";
    return { ...item, thumbnail: thumbnailUrl };
  },
  renderCard: renderMovieCardWithFavorite,
});
const loadMovieFolder = movieLoader.loadFolder;

function loadTopVideoSlider() {
  const key = getSourceKey();
  if (!key) return;

  fetch(`/api/movie/video-cache?key=${key}&mode=top`)
    .then((res) => res.json())
    .then((data) => {
      renderFolderSlider({
        title: "🔥 Xem nhiều",
        folders: data.folders,
        showViews: true,
      });
    });
}


function renderRecentVideoSlider() {
  const raw = localStorage.getItem(recentViewedVideoKey());
  if (!raw) return;
  const list = JSON.parse(raw);
  const filtered = list.filter((f) => f.type === "video" || f.type === "file");

  renderFolderSlider({
    title: "🕓 Vừa xem",
    folders: filtered,
    targetId: "section-recent", // tạo thêm <div id="section-recent"> trong movie-index.html nếu thiếu
  });
}
