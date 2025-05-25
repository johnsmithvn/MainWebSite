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
    window.location.href = "/home.html";
    return;
  }

  currentPath = path;
  moviePage = page;

  const cached = getMovieCache(sourceKey, path);
  if (cached && Date.now() - cached.timestamp < 7 * 60 * 60 * 1000) {
    console.log("⚡ Dùng cache movie folder");
    fullList = cached.data || [];
    renderMovieGrid(paginateList(fullList), path);
    updateMoviePaginationUI(moviePage, fullList.length, moviesPerPage);
    return;
  }

  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/movie-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => {
      fullList = data.folders || [];
      setMovieCache(sourceKey, path, fullList);
      renderMovieGrid(paginateList(fullList), path);
      updateMoviePaginationUI(moviePage, fullList.length, moviesPerPage);
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
    title.textContent = "📁 " + parts[parts.length - 1];
    title.style.cursor = "pointer";
    title.title = "Quay lại thư mục cha";
    title.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMovieFolder(parent); // ⬅️ dùng đúng global currentPath
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
  const parentPath = path.split("/").slice(0, -1).join("/");
  app.innerHTML += `
    <div class="empty-folder">
      <p>❌ Không tìm thấy nội dung trong thư mục này.</p>
      <button onclick="loadMovieFolder('${parentPath}')">⬅ Quay lại</button>
    </div>
  `;
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
