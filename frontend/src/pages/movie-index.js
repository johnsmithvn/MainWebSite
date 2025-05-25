import {} from "/src/components/folderCard.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";
import { getSourceKey } from "/src/core/storage.js";
import {
  showRandomUpdatedTime,
  filterMovie,
  toggleSearchBar,
  setupMovieSidebar,
  showConfirm,
  showToast,
  toggleSidebar,
} from "/src/core/ui.js";
import { setupGlobalClickToCloseUI } from "/src/core/events.js";
import { getMovieCache, setMovieCache } from "/src/core/storage.js";

// 👉 Gắn sự kiện UI
window.addEventListener("DOMContentLoaded", () => {
  const initialPath = getInitialPathFromURL();
  loadMovieFolder(initialPath);
  setupDeleteMovieButton();
  setupRandomSectionsIfMissing();
  loadRandomSliders();
  loadTopVideoSlider();
  setupMovieSidebar();

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

function setupDeleteMovieButton() {
  const deleteBtn = document.getElementById("delete-movie-db");
  if (!deleteBtn) return;

  deleteBtn.onclick = async () => {
    const ok = await showConfirm("Bạn có chắc muốn xoá sạch DB Movie?", {
      loading: true,
    });
    if (!ok) return;

    const sourceKey = getSourceKey();
    try {
      await fetch(`/api/reset-movie-db?key=${sourceKey}`, { method: "DELETE" });
      showToast("✅ Đã xoá xong DB Movie!");
      window.location.reload();
    } catch (err) {
      showToast("❌ Lỗi khi xoá DB movie!");
      console.error(err);
    }
  };
}

function setupRandomSectionsIfMissing() {
  ["randomFolderSection", "randomVideoSection"].forEach((id) => {
    const exist = document.getElementById(id);
    if (!exist) {
      const sec = document.createElement("section");
      sec.id = id;
      document.body.prepend(sec);
    }
  });
}

let currentPath = "";

function loadMovieFolder(path = "") {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn phim!");
    window.location.href = "/home.html";
    return;
  }
  currentPath = path;

  // ✅ Check cache
  const cached = getMovieCache(sourceKey, path);
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    console.log("⚡ Dùng cache movie folder");
    renderMovieGrid(cached.data, path);
    return;
  }

  // ✅ Nếu không có cache → fetch
  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/movie-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => {
      setMovieCache(sourceKey, path, data.folders); // ✅ Lưu cache
      renderMovieGrid(data.folders, path);
    });
}

window.loadMovieFolder = loadMovieFolder;

function renderMovieGrid(list, basePath) {
  const app = document.getElementById("movie-app");
  app.innerHTML = "";

  const parts = basePath ? basePath.split("/").filter(Boolean) : [];

  const title = document.createElement("h2");
  title.className = "folder-section-title";

  if (parts.length === 0) {
    title.textContent = "📂 Danh sách phim";
  } else {
    title.textContent = "📁 " + parts[parts.length - 1];
    title.style.cursor = "pointer";
    title.title = "Quay lại thư mục cha";
    title.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMovieFolder(parent);
    };
  }

  app.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "grid";

  list.forEach((item) => {
    let thumbnailUrl = item.thumbnail
      ? `/video/${item.thumbnail.replace(/\\/g, "/")}`
      : item.type === "video" || item.type === "file"
      ? "/default/video-thumb.png"
      : "/default/folder-thumb.png";

    const card = renderMovieCard({
      name: item.name,
      path: item.path,
      thumbnail: thumbnailUrl,
      type: item.type,
    });

    grid.appendChild(card);
  });
  if (!list || list.length === 0) {
    app.innerHTML += "<p>❌ Không tìm thấy nội dung trong thư mục này.</p>";
    return;
  }

  app.appendChild(grid);
}

function renderMovieCard(item) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const img = document.createElement("img");
  img.className = "movie-thumb";
  img.src = item.thumbnail || "/default/video-thumb.png";

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("div");
  title.className = "movie-title";
  title.textContent = item.name;
  card.title = item.name;

  const sub = document.createElement("div");
  sub.className = "movie-sub";
  sub.textContent = item.type === "video" ? "🎬 Video file" : "📁 Thư mục";

  info.appendChild(title);
  info.appendChild(sub);

  card.appendChild(img);
  card.appendChild(info);

  card.onclick = () => {
    if (item.type === "video" || item.type === "file") {
      window.location.href = `/movie-player.html?file=${encodeURIComponent(
        item.path
      )}&key=${getSourceKey()}`;
    } else {
      loadMovieFolder(item.path);
    }
  };

  return card;
}

function loadRandomSliders() {
  const sourceKey = getSourceKey();
  loadRandomSection(
    "folder",
    sourceKey,
    "randomFolderSection",
    "🎲 Folder ngẫu nhiên",
    false
  );
  loadRandomSection(
    "file",
    sourceKey,
    "randomVideoSection",
    "🎲 Video ngẫu nhiên",
    false
  );
}

async function loadRandomSection(
  type,
  sourceKey,
  sectionId,
  title,
  force = false
) {
  if (!sourceKey) {
    console.warn("⚠️ Không có sourceKey – skip random section");
    return;
  }

  const cacheKey = `${
    type === "file" ? "randomVideos" : "randomFolders"
  }-${sourceKey}`;
  const tsId =
    type === "file" ? "random-timestamp-video" : "random-timestamp-folder";

  if (!force) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expired = Date.now() - parsed.timestamp > 30 * 60 * 1000;
        if (!expired) {
          renderFolderSlider({
            title,
            folders: parsed.data,
            targetId: sectionId,
            onRefresh: () =>
              loadRandomSection(type, sourceKey, sectionId, title, true),
          });

          const el = document.getElementById(tsId);
          if (el) showRandomUpdatedTime(parsed.timestamp, tsId);
          return;
        }
      } catch {}
    }
  }

  const res = await fetch(
    `/api/video-cache?mode=random&type=${type}&key=${sourceKey}`
  );
  const json = await res.json();
  const folders = Array.isArray(json) ? json : json.folders;
  const now = Date.now();

  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data: folders, timestamp: now })
  );
  localStorage.setItem(
    `randomView::${sourceKey}::1`,
    JSON.stringify({ data: folders })
  );

  renderFolderSlider({
    title,
    folders,
    targetId: sectionId,
    onRefresh: () => loadRandomSection(type, sourceKey, sectionId, title, true),
  });

  const el = document.getElementById(tsId);
  if (el) showRandomUpdatedTime(now, tsId);
}

function loadTopVideoSlider() {
  const key = getSourceKey();
  if (!key) return;

  fetch(`/api/video-cache?key=${key}&mode=top`)
    .then((res) => res.json())
    .then((data) => {
      renderFolderSlider({
        title: "🔥 Xem nhiều",
        folders: data.folders,
        showViews: true,
      });
    });
}
