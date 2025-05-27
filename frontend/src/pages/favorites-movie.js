// 📁 frontend/src/pages/favorites-movie.js

import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";

let allFavorites = [];
let currentPage = 0;
const perPage = 20;

function renderMovieCardWithFavorite(item) {
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

  // ❤️ Icon yêu thích
  const favBtn = document.createElement("div");
  favBtn.className = "folder-fav" + (item.isFavorite ? " active" : "");
  favBtn.title = item.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích";
  favBtn.textContent = item.isFavorite ? "❤️" : "🤍";

  favBtn.onclick = async (e) => {
    e.stopPropagation();
    const newVal = !item.isFavorite;
    item.isFavorite = newVal;
    favBtn.classList.toggle("active", newVal);
    favBtn.textContent = newVal ? "❤️" : "🤍";
    favBtn.title = newVal ? "Bỏ yêu thích" : "Thêm yêu thích";

    try {
      await fetch("/api/favorite-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbkey : getSourceKey(),
          path: item.path,
          value: newVal,
        }),
      });
    } catch (err) {
      console.warn("❌ Không thể lưu yêu thích:", err);
    }
  };

  info.appendChild(title);
  info.appendChild(sub);
  card.appendChild(img);
  card.appendChild(info);
  card.appendChild(favBtn);

  card.onclick = () => {
    const encoded = encodeURIComponent(item.path);
    const key = getSourceKey();
    if (item.type === "video" || item.type === "file") {
      window.location.href = `/movie-player.html?file=${encoded}&key=${key}`;
    } else {
      window.location.href = `/movie-index.html?path=${encoded}`;
    }
  };

  return card;
}

// ✅ Render grid từng page
function renderGridPage() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const section = document.createElement("section");
  section.className = "folder-section grid";

  const header = document.createElement("div");
  header.className = "folder-section-header";

  const title = document.createElement("h3");
  title.className = "folder-section-title";
  title.textContent = `❤️ Phim yêu thích (${allFavorites.length})`;
  header.appendChild(title);
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "grid";

  const paged = allFavorites.slice(currentPage * perPage, (currentPage + 1) * perPage);
  paged.forEach((item) => grid.appendChild(renderMovieCardWithFavorite(item)));

  section.appendChild(grid);
  app.appendChild(section);

  renderPagination();
}

// ✅ Render phân trang
function renderPagination() {
  const app = document.getElementById("app");
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
    const res = await fetch(`/api/favorite-movie?key=${encodeURIComponent(key)}`);
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
