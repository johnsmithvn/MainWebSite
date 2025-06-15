// 📁 frontend/src/pages/movie/favorites.js

import { getSourceKey } from "/src/core/storage.js";
import {
  showToast,
  showOverlay,
  hideOverlay,
  buildThumbnailUrl,
} from "/src/core/ui.js";
import { renderMovieCardWithFavorite } from "/src/components/movie/movieCard.js";

let allFavorites = [];
let allFolders = [];
let allVideos = [];
let folderPage = 0;
let videoPage = 0;
const perPageFolder = 16;
const perPageVideo = 16;

// Tạo một section hiển thị danh sách và phân trang
function createSection(items, page, perPage, title, open, onChange) {
  const det = document.createElement("details");
  det.className = "favorite-collapse";
  if (open) det.open = true;

  const sum = document.createElement("summary");
  sum.textContent = title;
  det.appendChild(sum);

  const grid = document.createElement("div");
  grid.className = "movie-grid";
  const paged = items.slice(page * perPage, (page + 1) * perPage);
  paged.forEach((item) => {
    const thumb = buildThumbnailUrl(item, "movie");
    const card = renderMovieCardWithFavorite({ ...item, thumbnail: thumb });
    grid.appendChild(card);
  });
  det.appendChild(grid);

  const totalPages = Math.ceil(items.length / perPage);
  const nav = document.createElement("div");
  nav.className = "reader-controls";

  const prev = document.createElement("button");
  prev.textContent = "⬅ Trang trước";
  prev.disabled = page <= 0;
  prev.onclick = () => onChange(page - 1);
  nav.appendChild(prev);

  const jumpForm = document.createElement("form");
  jumpForm.style.display = "inline-block";
  jumpForm.style.margin = "0 10px";

  const jumpInput = document.createElement("input");
  jumpInput.type = "number";
  jumpInput.min = 1;
  jumpInput.max = totalPages;
  jumpInput.placeholder = "Trang...";
  jumpInput.style.width = "60px";

  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const p = parseInt(jumpInput.value) - 1;
    if (!isNaN(p) && p >= 0 && p < totalPages) onChange(p);
  };

  const jumpBtn = document.createElement("button");
  jumpBtn.textContent = "⏩";
  jumpForm.appendChild(jumpInput);
  jumpForm.appendChild(jumpBtn);
  nav.appendChild(jumpForm);

  const next = document.createElement("button");
  next.textContent = "Trang sau ➡";
  next.disabled = page + 1 >= totalPages;
  next.onclick = () => onChange(page + 1);
  nav.appendChild(next);

  det.appendChild(nav);

  const info = document.createElement("div");
  info.textContent = `Trang ${page + 1} / ${totalPages}`;
  info.className = "favorite-page-info";
  info.style.textAlign = "center";
  info.style.marginTop = "10px";
  det.appendChild(info);

  return det;
}

// ✅ Render toàn bộ danh sách
function renderGridPage() {
  const app = document.getElementById("movie-app");
  app.innerHTML = "";

  const section = document.createElement("section");
  section.className = "folder-section";

  const header = document.createElement("div");
  header.className = "folder-section-header";

  const title = document.createElement("h2");
  title.className = "folder-section-title";
  title.textContent = `❤️ Phim yêu thích (${allFavorites.length})`;
  header.appendChild(title);
  section.appendChild(header);

  if (allFolders.length) {
    section.appendChild(
      createSection(
        allFolders,
        folderPage,
        perPageFolder,
        "📁 Folder yêu thích",
        false,
        (p) => {
          folderPage = p;
          renderGridPage();
        }
      )
    );
  }

  if (allVideos.length) {
    section.appendChild(
      createSection(
        allVideos,
        videoPage,
        perPageVideo,
        "🎬 Video yêu thích",
        true,
        (p) => {
          videoPage = p;
          renderGridPage();
        }
      )
    );
  }

  app.appendChild(section);
}

// ✅ Gọi API và khởi động
async function loadFavoritesMovie() {
  const key = getSourceKey();
  if (!key) return showToast("❌ Thiếu sourceKey");

  showOverlay();

  try {
    const res = await fetch(`/api/movie/favorite-movie?key=${encodeURIComponent(key)}`);
    allFavorites = await res.json();
    allFolders = allFavorites
      .filter((i) => i.type === "folder")
      .sort((a, b) => a.name.localeCompare(b.name));
    allVideos = allFavorites
      .filter((i) => i.type === "video" || i.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));
    folderPage = 0;
    videoPage = 0;
    renderGridPage();
  } catch (err) {
    showToast("❌ Lỗi khi tải danh sách yêu thích phim");
    console.error("favorite-movie.js error:", err);
  } finally {
    hideOverlay();
  }
}

window.addEventListener("DOMContentLoaded", loadFavoritesMovie);
