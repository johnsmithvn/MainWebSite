import {
  setupRandomSectionsIfMissing,
  loadRandomSliders,
  renderFolderSlider,
} from "/src/components/folderSlider.js";
import { renderMusicCardWithFavorite } from "/src/components/music/musicCard.js";
import {
  getSourceKey,
  getMusicCache,
  setMusicCache,
  getRecentViewedMusic,
} from "/src/core/storage.js";
import {
  showToast,
  toggleSearchBar,
  setupMusicSidebar,
  showConfirm,
  renderRecentViewedMusic,
  withLoading,
  goHome,
  filterMusic,
  buildThumbnailUrl,
} from "/src/core/ui.js";
import { isSecureKey, getToken, showLoginModal } from "/src/core/security.js";
import { setupExtractThumbnailButton, setupButton } from "/src/utils/uiHelpers.js";

window.goHome = goHome;

window.addEventListener("DOMContentLoaded", async () => {
  const key = getSourceKey();
  if (isSecureKey(key) && !getToken()) {
    const ok = await showLoginModal(key);
    if (!ok) return goHome();
  }
  
  const initialPath = getInitialPathFromURL();
  loadMusicFolder(initialPath);
  setupMusicSidebar();
  setupRandomSectionsIfMissing();
  loadRandomSliders("music");
  loadPlaylistSlider();
  loadTopAudioSlider();
  renderRecentMusicOnLoad();
  
  // Setup buttons using uiHelpers
  setupExtractThumbnailButton("extract-thumbnail-btn", () => currentPath, () => loadMusicFolder(currentPath, musicPage), "music");

  document.getElementById("floatingSearchInput")?.addEventListener("input", filterMusic);
  document.getElementById("searchToggle")?.addEventListener("click", toggleSearchBar);
  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar-menu")?.classList.toggle("active");
  });
  
  window.renderRecentViewedMusic = renderRecentViewedMusic;
});

// Lấy path ban đầu từ URL nếu có
function getInitialPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("path") || "";
}

let musicPage = 0;
const perPage = 20;
let fullList = [];
let currentPath = "";

// Phân trang danh sách theo số lượng mặc định
function paginateList(list) {
  return list.slice(musicPage * perPage, (musicPage + 1) * perPage);
}

// Tải thư mục nhạc hiện tại và hiển thị grid bài hát
function loadMusicFolder(path = "", page = 0) {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn nhạc!");
    goHome();
    return;
  }

  if (path === "") {
    loadPlaylistSlider();
  } else {
    const sec = document.getElementById("section-playlists");
    if (sec) sec.innerHTML = "";
  }

  currentPath = path;
  musicPage = page;

  const cached = getMusicCache(sourceKey, path);
  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    fullList = cached.data || [];
    renderMusicGrid(paginateList(fullList), path);
    updateMusicPaginationUI(musicPage, fullList.length, perPage);
    return;
  }

  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/music/music-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => {
      fullList = data.folders || [];
      setMusicCache(sourceKey, path, fullList);
      renderMusicGrid(paginateList(fullList), path);
      updateMusicPaginationUI(musicPage, fullList.length, perPage);
    })
    .catch((err) => {
      console.error("❌ Failed to load music folder:", err);
      showToast("🚫 Lỗi tải thư mục nhạc!");
    });
}

// Render danh sách bài hát vào lưới hiển thị
function renderMusicGrid(list) {
  const app = document.getElementById("music-app");
  app.innerHTML = "";

  const parts = currentPath ? currentPath.split("/").filter(Boolean) : [];
  const title = document.createElement("h2");
  title.className = "folder-section-title";

  if (parts.length === 0) {
    title.textContent = "📂 Danh sách nhạc";
  } else {
    const folderName = parts.at(-1);
    title.textContent = "📁 " + folderName;
    title.title = folderName;
    title.style.cursor = "pointer";
    title.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMusicFolder(parent);
    };
  }

  app.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "music-grid";

  list.forEach((item) => {
    let thumb = buildThumbnailUrl(item, "music");

    const card = renderMusicCardWithFavorite({
      ...item,
      thumbnail: thumb,
    });

    grid.appendChild(card);
  });

  app.appendChild(grid);
}

// Khi trang load, hiển thị danh sách nhạc vừa nghe từ localStorage
function renderRecentMusicOnLoad() {
  const recentList = getRecentViewedMusic();
  if (recentList && recentList.length > 0) {
    renderRecentViewedMusic(recentList);
  }
}

// Thêm giao diện phân trang cho danh sách nhạc
function updateMusicPaginationUI(currentPage, totalItems, perPage) {
  const totalPages = Math.ceil(totalItems / perPage);
  const app = document.getElementById("music-app");

  // Xoá control cũ nếu có
  const oldControls = app.querySelector(".reader-controls");
  if (oldControls) oldControls.remove();
  const oldInfo = app.querySelector(".music-pagination-info");
  if (oldInfo) oldInfo.remove();

  // Tạo control chuyển trang
  const nav = document.createElement("div");
  nav.className = "reader-controls";

  const prev = document.createElement("button");
  prev.textContent = "⬅ Trang trước";
  prev.disabled = currentPage <= 0;
  prev.onclick = () => loadMusicFolder(currentPath, currentPage - 1);
  nav.appendChild(prev);

  const jumpForm = document.createElement("form");
  jumpForm.style.display = "inline-block";
  jumpForm.style.margin = "0 10px";
  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const page = parseInt(jumpInput.value) - 1;
    if (!isNaN(page) && page >= 0) loadMusicFolder(currentPath, page);
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
  next.onclick = () => loadMusicFolder(currentPath, currentPage + 1);
  nav.appendChild(next);

  app.appendChild(nav);

  // Thêm info số trang
  const info = document.createElement("div");
  info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
  info.className = "music-pagination-info";
  info.style.textAlign = "center";
  info.style.marginTop = "10px";
  app.appendChild(info);
}

// 👉 Tải slider danh sách Playlist
async function loadPlaylistSlider() {
  const key = getSourceKey();
  if (!key) return;

  const container = document.getElementById("section-playlists");
  if (!container) return;

  container.innerHTML = "<p>⏳ Đang tải playlist...</p>";

  try {
    const res = await fetch(`/api/music/playlists?key=${key}`);
    const playlists = await res.json();

    if (!Array.isArray(playlists) || playlists.length === 0) {
      container.innerHTML = "<p>😅 Chưa có playlist nào</p>";
      return;
    }

    const withThumbs = await Promise.all(
      playlists.map(async (p) => {
        if (p.thumbnail) {
          return { ...p, path: p.id.toString(), thumbnail: buildThumbnailUrl({ thumbnail: p.thumbnail, path: "" }, "music"), isPlaylist: true, type: "folder" };
        }
        try {
          const r = await fetch(`/api/music/playlist/${p.id}?key=${key}`);
          const detail = await r.json();
          const first = detail.tracks?.[0];
          const thumb = first ? buildThumbnailUrl(first, "music") : "/default/folder-thumb.png";
          return { ...p, path: p.id.toString(), thumbnail: thumb, isPlaylist: true, type: "folder" };
        } catch {
          return { ...p, path: p.id.toString(), thumbnail: "/default/folder-thumb.png", isPlaylist: true, type: "folder" };
        }
      })
    );

    renderFolderSlider({
      title: "🎶 Playlist",
      folders: withThumbs,
      targetId: "section-playlists",
    });
  } catch (err) {
    console.error("loadPlaylistSlider error", err);
    container.innerHTML = "<p>❌ Lỗi tải playlist</p>";
  }
}

// 👉 Tải slider top bài hát có nhiều lượt nghe nhất
function loadTopAudioSlider() {
  const key = getSourceKey();
  if (!key) return;

  fetch(`/api/music/audio-cache?key=${key}&mode=top`)
    .then((res) => res.json())
    .then((data) => {
      renderFolderSlider({
        title: "🔥 Xem nhiều",
        folders: data.folders,
        showViews: true,
        targetId: "section-topview",
      });
    })
    .catch((err) => console.error("loadTopAudioSlider error", err));
}
