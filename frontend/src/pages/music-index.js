import {
  setupRandomSectionsIfMissing,
  loadRandomSliders,
} from "/src/components/folderSlider.js";
import { renderMusicCardWithFavorite } from "/src/components/musicCard.js"; // bạn sẽ clone từ movieCard.js
import {
  getSourceKey,
  getMusicCache,
  setMusicCache,
} from "/src/core/storage.js";
import {
  showToast,
  toggleSearchBar,
  setupMusicSidebar,
  showConfirm,
} from "/src/core/ui.js";
import { filterMusic } from "/src/core/ui.js";

window.addEventListener("DOMContentLoaded", () => {
  const initialPath = getInitialPathFromURL();
  loadMusicFolder(initialPath);
  setupDeleteMusicButton();
  setupMusicSidebar(); // ✅ music
  setupRandomSectionsIfMissing();
  loadRandomSliders("music");

  document
    .getElementById("floatingSearchInput")
    ?.addEventListener("input", filterMusic);

  document
    .getElementById("searchToggle")
    ?.addEventListener("click", toggleSearchBar);
  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar-menu")?.classList.toggle("active");
  });
});

function getInitialPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("path") || "";
}

function setupDeleteMusicButton() {
  const deleteBtn = document.getElementById("delete-music-db");
  if (!deleteBtn) return;

  deleteBtn.onclick = async () => {
    const ok = await showConfirm("Bạn có chắc muốn xoá sạch DB Music?", {
      loading: true,
    });
    if (!ok) return;

    const sourceKey = getSourceKey();
    try {
      await fetch(`/api/music/scan-music?key=${sourceKey}&mode=delete`, {
        method: "DELETE",
      });
      showToast("✅ Đã xoá xong DB Music!");
    } catch (err) {
      showToast("❌ Lỗi khi xoá DB music!");
      console.error(err);
    }
  };
}

let musicPage = 0;
const perPage = 20;
let fullList = [];
let currentPath = "";

function paginateList(list) {
  return list.slice(musicPage * perPage, (musicPage + 1) * perPage);
}

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
    renderMusicGrid(paginateList(fullList), path);
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
  grid.className = "grid";

  list.forEach((item) => {
    console.log("item.path =", item.path, "| thumbnail =", item.thumbnail);
    let folderPrefixParts = item.path?.split("/").filter(Boolean);
    if (item.type === "file" || item.type === "audio") folderPrefixParts.pop();
    let folderPrefix = folderPrefixParts.join("/");

    let thumb = item.thumbnail
      ? `/audio/${
          folderPrefix ? folderPrefix + "/" : ""
        }${item.thumbnail.replace(/\\/g, "/")}`
      : item.type === "folder"
      ? "/default/folder-thumb.png"
      : "/default/music-thumb.png";

    console.log("Thumbnail URL:", thumb);

    const card = renderMusicCardWithFavorite({
      ...item,
      thumbnail: thumb,
    });

    grid.appendChild(card);
  });

  app.appendChild(grid);
}
