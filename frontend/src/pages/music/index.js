import {
  setupRandomSectionsIfMissing,
  loadRandomSliders,
  renderFolderSlider,
} from "/src/components/folderSlider.js";
import { renderMusicCardWithFavorite } from "/src/components/music/musicCard.js"; // bạn sẽ clone từ movieCard.js
import {
  getSourceKey,
  getMusicCache,
  setMusicCache,recentViewedMusicKey
} from "/src/core/storage.js";
import {
  showToast,
  toggleSearchBar,
  setupMusicSidebar,
  showConfirm,
  renderRecentViewedMusic,
  withLoading,
  goHome
} from "/src/core/ui.js";
import { PAGINATION } from "/src/constants.js";
import { filterMusic } from "/src/core/ui.js";
import { buildThumbnailUrl } from "/src/core/ui.js";
import { isSecureKey, getToken, showLoginModal } from "/src/core/security.js";


window.goHome = goHome;

window.addEventListener("DOMContentLoaded", async () => {
  const key = getSourceKey();
  if (isSecureKey(key) && !getToken()) {
    const ok = await showLoginModal(key);
    if (!ok) return goHome();
  }
  const initialPath = getInitialPathFromURL();
  loadMusicFolder(initialPath);
  setupMusicSidebar(); // ✅ music
  setupRandomSectionsIfMissing();
  loadRandomSliders("music");
  loadPlaylistSlider();
  loadTopAudioSlider();
  renderRecentMusicOnLoad();
  setupExtractThumbnailButton();

  document
    .getElementById("floatingSearchInput")
    ?.addEventListener("input", filterMusic);

  document
    .getElementById("searchToggle")
    ?.addEventListener("click", toggleSearchBar);
  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar-menu")?.classList.toggle("active");
  });
    window.renderRecentViewedMusic = renderRecentViewedMusic; // THÊM DÒNG NÀY

});

// Lấy path ban đầu từ URL nếu có
function getInitialPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("path") || "";
}

// function setupDeleteMusicButton() {
//   const deleteBtn = document.getElementById("delete-music-db");
//   if (!deleteBtn) return;

//   deleteBtn.onclick = async () => {
//     const ok = await showConfirm("Bạn có chắc muốn xoá sạch DB Music?", {
//       loading: true,
//     });
//     if (!ok) return;

//     const sourceKey = getSourceKey();
//     try {
//       await fetch(`/api/music/scan-music?key=${sourceKey}&mode=delete`, {
//         method: "DELETE",
//       });
//       showToast("✅ Đã xoá xong DB Music!");
//     } catch (err) {
//       showToast("❌ Lỗi khi xoá DB music!");
//       console.error(err);
//     }
//   };
// }

let musicPage = 0;
const perPage = PAGINATION.MUSIC_PER_PAGE; // 20 - from constants
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
  const raw = localStorage.getItem(recentViewedMusicKey());
  if (raw) {
    const list = JSON.parse(raw);
    renderRecentViewedMusic(list);
  }
}



// Gắn sự kiện extract lại thumbnail cho toàn bộ folder hiện tại
function setupExtractThumbnailButton() {
  const extractBtn = document.getElementById("extract-thumbnail-btn");
  if (!extractBtn) return;

  extractBtn.onclick = withLoading(async () => {
    // Xác nhận
    let shouldOverwrite = false;
    const ok = await showConfirm(
      "Extract lại thumbnail nhạc cho toàn bộ folder hiện tại?",
      {
        checkbox: {
          label: "Ghi đè thumbnail hiện có",
          description:
            "Bật tuỳ chọn này để tạo lại toàn bộ thumbnail dù đã tồn tại. Nếu tắt, hệ thống sẽ bỏ qua các thumbnail đã có.",
          defaultChecked: false,
          onChange: (checked) => {
            shouldOverwrite = checked;
          },
        },
      }
    );
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast("❌ Không xác định được nguồn nhạc!");
      return;
    }

    try {
      showToast("⏳ Đang extract thumbnail...");
      // Kiểm tra nhanh xem folder hiện tại có audio hoặc subfolder nào không
      const params = new URLSearchParams();
      if (sourceKey) params.set("key", sourceKey);
      if (currentPath) params.set("path", currentPath);

      const res = await fetch("/api/music/music-folder?" + params.toString());
      const data = await res.json();
      const list = data.folders || [];
      const hasAnyEntry = list.some(
        (item) => item.type === "audio" || item.type === "folder"
      );

      if (!hasAnyEntry) {
        showToast("😅 Không có bài hát nào để extract thumbnail.");
        return;
      }

      const resp = await fetch("/api/music/extract-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: sourceKey,
          path: currentPath,
          overwrite: shouldOverwrite,
        }),
      });
      const result = await resp.json();

      if (result.success) {
        const countInfo =
          typeof result.count === "number"
            ? result.count > 0
              ? `Đã xử lý ${result.count} mục.`
              : "Không có mục nào cần cập nhật."
            : "";
        showToast(
          `✅ Đã extract thumbnail xong!${countInfo ? " " + countInfo : ""}`
        );
        loadMusicFolder(currentPath, musicPage);
      } else {
        const errorDetail = result.message ? ` (${result.message})` : "";
        showToast(`❌ Lỗi extract thumbnail!${errorDetail}`);
      }

    } catch (err) {
      showToast("❌ Lỗi extract thumbnail!");
      console.error(err);
    }
    // KHÔNG cần finally hide overlay nữa, withLoading đã lo.
  });
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