import {} from "/src/components/folderCard.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";
import { getSourceKey } from "/src/core/storage.js";
import { isSecureKey, getToken } from "/src/core/security.js";
import { renderMovieCardWithFavorite } from "/src/components/movie/movieCard.js";
import { recentViewedVideoKey } from "/src/core/storage.js";

import {
  filterMovie,
  toggleSearchBar,
  setupMovieSidebar,
  showConfirm,
  showToast,
  toggleSidebar,
  withLoading,
  goHome
} from "/src/core/ui.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";
import { getMovieCache, setMovieCache } from "/src/core/storage.js";
import {
  loadRandomSliders,
  setupRandomSectionsIfMissing,
} from "/src/components/folderSlider.js";

window.goHome = goHome;

// 👉 Gắn sự kiện UI
window.addEventListener("DOMContentLoaded", async () => {
  const key = getSourceKey();
  if (isSecureKey(key) && !getToken()) {
    showToast("⚠️ Cần đăng nhập trước");
    return goHome();
  }
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
          path: currentPath,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        showToast("✅ Đã extract thumbnail xong!");
        loadMovieFolder(currentPath, moviePage);
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



let moviePage = 0;
const moviesPerPage = 20;
let fullList = []; // danh sách đầy đủ sau khi fetch/cache
let currentPath = "";
function paginateList(list) {
  return list.slice(moviePage * moviesPerPage, (moviePage + 1) * moviesPerPage);
}
function loadMovieFolder(path = "", page = 0) {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn phim!");
    goHome();
    return;
  }

  currentPath = path;
  moviePage = page;

  // ✅ SỬA: dùng path làm cache key
  const cached = getMovieCache(sourceKey, path);
  if (cached && Date.now() - cached.timestamp < 7 * 60 * 60 * 1000) {
    console.log("⚡ Dùng cache movie folder:", path); // 🆕 THÊM: debug
    fullList = cached.data || [];
    renderMovieGrid(paginateList(fullList), path);
    updateMoviePaginationUI(moviePage, fullList.length, moviesPerPage);
    return;
  }

  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/movie/movie-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => {
      fullList = data.folders || [];

      setMovieCache(sourceKey, path, fullList); // 🆕 THÊM: cache lại dù là root

      renderMovieGrid(paginateList(fullList), path);
      updateMoviePaginationUI(moviePage, fullList.length, moviesPerPage);
    })
    .catch((err) => {
      console.error("❌ Failed to load movie folder:", err);
      showToast("🚫 Lỗi tải thư mục phim!");
    });
}

function renderMovieGrid(list) {
  const app = document.getElementById("movie-app");
  app.innerHTML = "";

  const parts = currentPath ? currentPath.split("/").filter(Boolean) : [];

  const title = document.createElement("h2");
  title.className = "folder-section-title";

  if (parts.length === 0) {
    title.textContent = "📂 Danh sách phim";
  } else {
    const folderName = parts[parts.length - 1];
    title.textContent = "📁 " + folderName;
    title.title = folderName; // ✅ Tooltip hiện tên đầy đủ
    title.style.cursor = "pointer";
    title.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMovieFolder(parent); // ⬅️ dùng đúng global currentPath
    };
  }

  app.appendChild(title);
  const grid = document.createElement("div");
  grid.className = "movie-grid";

  list.forEach((item) => {
    let folderPrefixParts = item.path?.split("/").filter(Boolean);
    if (item.type === "video" || item.type === "file") folderPrefixParts.pop();
    let folderPrefix = folderPrefixParts.join("/");

    let thumbnailUrl = item.thumbnail
      ? `/video/${
          folderPrefix ? folderPrefix + "/" : ""
        }${item.thumbnail.replace(/\\/g, "/")}`
      : item.type === "video" || item.type === "file"
      ? "/default/video-thumb.png"
      : "/default/folder-thumb.png";

    const card = renderMovieCardWithFavorite({
      name: item.name,
      path: item.path,
      thumbnail: thumbnailUrl,
      type: item.type,
      isFavorite: item.isFavorite ?? false,
    });
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

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

function updateMoviePaginationUI(currentPage, totalItems, perPage) {
  const totalPages = Math.ceil(totalItems / perPage);
  const app = document.getElementById("movie-app");

  const nav = document.createElement("div");
  nav.className = "reader-controls";

  const prev = document.createElement("button");
  prev.textContent = "⬅ Trang trước";
  prev.disabled = currentPage <= 0;
  prev.onclick = () => loadMovieFolder(currentPath, currentPage - 1);
  nav.appendChild(prev);

  const jumpForm = document.createElement("form");
  jumpForm.style.display = "inline-block";
  jumpForm.style.margin = "0 10px";
  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const page = parseInt(jumpInput.value) - 1;
    if (!isNaN(page) && page >= 0) loadMovieFolder(currentPath, page);
  };

  const jumpInput = document.createElement("input");
  jumpInput.type = "number";
  jumpInput.min = 1;
  jumpInput.max = totalPages;
  jumpInput.placeholder = "Trang...";
  jumpInput.style.width = "60px";

  const jumpBtn = document.createElement("button");
  jumpBtn.textContent = "⏩";
  jumpForm.appendChild(jumpInput);
  jumpForm.appendChild(jumpBtn);
  nav.appendChild(jumpForm);

  const next = document.createElement("button");
  next.textContent = "Trang sau ➡";
  next.disabled = currentPage + 1 >= totalPages;
  next.onclick = () => loadMovieFolder(currentPath, currentPage + 1);
  nav.appendChild(next);

  app.appendChild(nav);

  const info = document.createElement("div");
  info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
  info.style.textAlign = "center";
  info.style.marginTop = "10px";
  app.appendChild(info);
}

function renderRecentVideoSlider() {
  const raw = localStorage.getItem(recentViewedVideoKey());
  if (!raw) return;
  const list = JSON.parse(raw);
  const filtered = list.filter((f) => f.type === "video" || f.type === "file");

  renderFolderSlider({
    title: "🕓 Vừa xem",
    folders: filtered,
    targetId: "section-recent", // tạo thêm <div id="section-recent"> trong movie/index.html nếu thiếu
  });
}
