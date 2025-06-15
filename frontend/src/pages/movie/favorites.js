// 📁 frontend/src/pages/movie/favorites.js

import { getSourceKey } from "/src/core/storage.js";
import { showToast, showOverlay, hideOverlay } from "/src/core/ui.js";
import { renderMovieCardWithFavorite } from "/src/components/movie/movieCard.js";

let allFavorites = [];
let currentPage = 0;
const perPage = 20;

// ✅ Render grid từng page
function renderGridPage() {
  const app = document.getElementById("movie-app"); // ✅ đúng ID giống movie-index
  app.innerHTML = "";

  const section = document.createElement("section");
  section.className = "folder-section"; // ❌ KHÔNG thêm grid ở đây

  const header = document.createElement("div");
  header.className = "folder-section-header";

  const title = document.createElement("h2");
  title.className = "folder-section-title";
  title.textContent = `❤️ Phim yêu thích (${allFavorites.length})`;

  // ❌ KHÔNG gắn onclick (vì là root page, không back gì hết)
  header.appendChild(title);
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "movie-grid"; // đồng bộ style với index

  const paged = allFavorites.slice(currentPage * perPage, (currentPage + 1) * perPage);
  paged.forEach((item) => {
    const parts = item.path?.split("/").filter(Boolean) || [];
    if (item.type === "video" || item.type === "file") parts.pop();
    const prefix = parts.join("/");
    const thumbnailUrl = item.thumbnail
      ? `/video/${prefix ? prefix + "/" : ""}${item.thumbnail.replace(/\\/g, "/")}`
      : item.type === "video" || item.type === "file"
      ? "/default/video-thumb.png"
      : "/default/folder-thumb.png";

    const card = renderMovieCardWithFavorite({
      ...item,
      thumbnail: thumbnailUrl,
    });

    grid.appendChild(card);
  });

  section.appendChild(grid);
  app.appendChild(section);

  renderPagination();
}

// ✅ Render phân trang
function renderPagination() {
  const app = document.getElementById("movie-app");
  const totalPages = Math.ceil(allFavorites.length / perPage);

  const oldControls = app.querySelector(".reader-controls");
  if (oldControls) oldControls.remove();
  const oldInfo = app.querySelector(".favorite-page-info");
  if (oldInfo) oldInfo.remove();

  const nav = document.createElement("div");
  nav.className = "reader-controls";

  const prev = document.createElement("button");
  prev.textContent = "⬅ Trang trước";
  prev.disabled = currentPage <= 0;
  prev.onclick = () => {
    currentPage--;
    renderGridPage();
  };
  nav.appendChild(prev);

  const jumpForm = document.createElement("form");
  jumpForm.style.display = "inline-block";
  jumpForm.style.margin = "0 10px";
  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const page = parseInt(jumpInput.value) - 1;
    if (!isNaN(page) && page >= 0) {
      currentPage = page;
      renderGridPage();
    }
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
  next.onclick = () => {
    currentPage++;
    renderGridPage();
  };
  nav.appendChild(next);

  app.appendChild(nav);

  const info = document.createElement("div");
  info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
  info.className = "favorite-page-info";
  info.style.textAlign = "center";
  info.style.marginTop = "10px";
  app.appendChild(info);
}

// ✅ Gọi API và khởi động
async function loadFavoritesMovie() {
  const key = getSourceKey();
  if (!key) return showToast("❌ Thiếu sourceKey");

  showOverlay();

  try {
    const res = await fetch(`/api/movie/favorite-movie?key=${encodeURIComponent(key)}`);
    allFavorites = await res.json();
    currentPage = 0;
    renderGridPage();
  } catch (err) {
    showToast("❌ Lỗi khi tải danh sách yêu thích phim");
    console.error("favorite-movie.js error:", err);
  } finally {
    hideOverlay();
  }
}

window.addEventListener("DOMContentLoaded", loadFavoritesMovie);
