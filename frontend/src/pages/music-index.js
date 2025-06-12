import {
  setupRandomSectionsIfMissing,
  loadRandomSliders,
} from "/src/components/folderSlider.js";
import { renderMusicCardWithFavorite } from "/src/components/musicCard.js"; // bạn sẽ clone từ movieCard.js
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
  showConfirm,renderRecentViewedMusic,withLoading
} from "/src/core/ui.js";
import { filterMusic } from "/src/core/ui.js";
import { buildThumbnailUrl } from "/src/core/ui.js";
import { createMediaLoader } from "/src/core/mediaLoader.js";


window.addEventListener("DOMContentLoaded", () => {
  const initialPath = getInitialPathFromURL();
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

const musicLoader = createMediaLoader({
  appId: "music-app",
  gridClass: "music-grid",
  rootTitle: "📂 Danh sách nhạc",
  perPage: 20,
  cacheMaxAge: 6 * 60 * 60 * 1000,
  getSourceKey,
  getCache: getMusicCache,
  setCache: setMusicCache,
  fetchUrl: (key, path) => {
    const params = new URLSearchParams();
    params.set("key", key);
    if (path) params.set("path", path);
    return "/api/music/music-folder?" + params.toString();
  },
  prepareItem: (item) => {
    const thumb = buildThumbnailUrl(item, "music");
    return { ...item, thumbnail: thumb };
  },
  renderCard: renderMusicCardWithFavorite,
});
const loadMusicFolder = musicLoader.loadFolder;



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
    if (musicLoader.currentPath) params.set("path", musicLoader.currentPath);

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
      loadMusicFolder(musicLoader.currentPath, musicLoader.page);

    } catch (err) {
      showToast("❌ Lỗi extract thumbnail!");
      console.error(err);
    }
    // KHÔNG cần finally hide overlay nữa, withLoading đã lo.
  });
}
