import { getSourceKey } from "/src/core/storage.js";

/**
 * 🎬 Tạo card phim có thumbnail, tiêu đề, loại và toggle favorite
 */
export function renderMovieCardWithFavorite(item) {
  const card = document.createElement("div");
  card.className = "movie-card";

  // ✅ Xử lý thumbnail fallback
  let thumbnailUrl = item.thumbnail;
  if (!thumbnailUrl || thumbnailUrl === "null") {
    thumbnailUrl = item.type === "folder"
      ? "/default/folder-thumb.png"
      : "/default/video-thumb.png";
  }

  const img = document.createElement("img");
  img.className = "movie-thumb";
  img.src = thumbnailUrl;

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
      await fetch("/api/movie/favorite-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbkey: getSourceKey(),
          path: item.path,
          value: newVal,
        }),
      });
    } catch (err) {
      console.warn("❌ Lỗi khi toggle favorite:", err);
    }
  };

  card.appendChild(favBtn);

  // 📽 Click: vào video hoặc folder
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
