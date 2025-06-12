// 📁 frontend/src/pages/favorites-movie.js

import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";
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
  grid.className = "grid";

  const paged = allFavorites.slice(currentPage * perPage, (currentPage + 1) * perPage);
  paged.forEach((item) => {
    const thumbnailUrl = item.thumbnail
      ? `/video/${item.thumbnail.replace(/\\/g, "/")}`
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
  console.log(getComputedStyle(grid).display);
}

// ✅ Render phân trang
function renderPagination() {
  const app = document.getElementById("movie-app");
  const totalPages = Math.ceil(allFavorites.length / perPage);

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

  const info = document.createElement("div");
  info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
  nav.appendChild(info);

  const next = document.createElement("button");
  next.textContent = "Trang sau ➡";
  next.disabled = currentPage + 1 >= totalPages;
  next.onclick = () => {
    currentPage++;
    renderGridPage();
  };
  nav.appendChild(next);

  app.appendChild(nav);
}

// ✅ Gọi API và khởi động
async function loadFavoritesMovie() {
  const key = getSourceKey();
  if (!key) return showToast("❌ Thiếu sourceKey");

  document.getElementById("loading-overlay")?.classList.remove("hidden");

  try {
    const res = await fetch(`/api/movie/favorite-movie?key=${encodeURIComponent(key)}`);
    allFavorites = await res.json();
    currentPage = 0;
    renderGridPage();
  } catch (err) {
    showToast("❌ Lỗi khi tải danh sách yêu thích phim");
    console.error("favorite-movie.js error:", err);
  } finally {
    document.getElementById("loading-overlay")?.classList.add("hidden");
  }
}

window.addEventListener("DOMContentLoaded", loadFavoritesMovie);
