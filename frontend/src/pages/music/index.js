import {
  setupRandomSectionsIfMissing,
  loadRandomSliders,
} from "/src/components/folderSlider.js";
import { renderMusicCardWithFavorite } from "/src/components/music/musicCard.js"; // bạn sẽ clone từ movieCard.js
import {
  getSourceKey,
  getMusicCache,
  setMusicCache,
  recentViewedMusicKey,
} from "/src/core/storage.js";
import {
  showToast,
  toggleSearchBar,
  setupMusicSidebar,
  showConfirm,
  renderRecentViewedMusic,
  withLoading,
  renderPaginationUI,
} from "/src/core/ui.js";
import { filterMusic } from "/src/core/ui.js";
import { buildThumbnailUrl } from "/src/core/ui.js";
import { getPathFromURL, paginate } from "/src/core/helpers.js";


window.addEventListener("DOMContentLoaded", () => {
  const initialPath = getPathFromURL();
  loadMusicFolder(initialPath);
  setupMusicSidebar(); // ✅ music
  setupRandomSectionsIfMissing();
  loadRandomSliders("music");
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
const perPage = 20;
let fullList = [];
let currentPath = "";

function loadMusicFolder(path = "", page = 0) {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn nhạc!");
    window.location.href = "/home.html";
    return;
  }

  currentPath = path;
  musicPage = page;

  const cached = getMusicCache(sourceKey, path);
  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    fullList = cached.data || [];
    renderMusicGrid(paginate(fullList, musicPage, perPage), path);
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
      renderMusicGrid(paginate(fullList, musicPage, perPage), path);
      updateMusicPaginationUI(musicPage, fullList.length, perPage);

    })
    .catch((err) => {
      console.error("❌ Failed to load music folder:", err);
      showToast("🚫 Lỗi tải thư mục nhạc!");
    });
}

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



function renderRecentMusicOnLoad() {
  const raw = localStorage.getItem(recentViewedMusicKey());
  if (raw) {
    const list = JSON.parse(raw);
    renderRecentViewedMusic(list);
  }
}



function setupExtractThumbnailButton() {
  const extractBtn = document.getElementById("extract-thumbnail-btn");
  if (!extractBtn) return;

  extractBtn.onclick = withLoading(async () => {
    // Xác nhận
    const ok = await showConfirm("Extract lại thumbnail nhạc cho toàn bộ folder hiện tại?");
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast("❌ Không xác định được nguồn nhạc!");
      return;
    }

    // Tải danh sách file nhạc trong folder hiện tại
    const params = new URLSearchParams();
    if (sourceKey) params.set("key", sourceKey);
    if (currentPath) params.set("path", currentPath);

    try {
      const res = await fetch("/api/music/music-folder?" + params.toString());
      const data = await res.json();
      const list = data.folders || [];

      // Lọc chỉ lấy các audio file
      const audioFiles = list.filter(item => item.type === "audio");

      if (audioFiles.length === 0) {
        showToast("😅 Không có bài hát nào để extract thumbnail.");
        return;
      }

      showToast("⏳ Đang extract thumbnail...");

      // Gọi tuần tự từng file
      for (const item of audioFiles) {
        const resp = await fetch("/api/music/extract-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: sourceKey, file: item.path }),
        });
        const result = await resp.json();
        // Nếu muốn có thể hiện progress ở đây
      }

      showToast("✅ Đã extract thumbnail xong!");
      loadMusicFolder(currentPath, musicPage);

    } catch (err) {
      showToast("❌ Lỗi extract thumbnail!");
      console.error(err);
    }
    // KHÔNG cần finally hide overlay nữa, withLoading đã lo.
  });
}



// Thêm UI phân trang cho Music
function updateMusicPaginationUI(currentPage, totalItems, perPage) {
  const app = document.getElementById("music-app");
  renderPaginationUI(
    app,
    currentPage,
    totalItems,
    perPage,
    (page) => loadMusicFolder(currentPath, page),
    "music-pagination-info"
  );
}
