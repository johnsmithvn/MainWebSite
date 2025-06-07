import { getSourceKey } from "/src/core/storage.js";
import { showPlaylistMenu } from "/src/components/playlistMenu.js";

/**
 * 🎵 Tạo card bài hát hoặc thư mục nhạc
 */
export function renderMusicCardWithFavorite(item) {
  const card = document.createElement("div");
  card.className = "movie-card"; // dùng lại CSS của movie

  // ✅ Thumbnail: fallback chuẩn
  let thumbnailUrl = item.thumbnail;
  const isMissing =
    !thumbnailUrl || thumbnailUrl === "null" || thumbnailUrl === "undefined";

  if (isMissing) {
    thumbnailUrl =
      item.type === "folder"
        ? "/default/folder-thumb.png"
        : "/default/music-thumb.png";
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

  if (item.type === "audio" || item.type === "file") {
    const ext = item.path?.split(".").pop()?.toLowerCase();
    sub.textContent = `🎧 .${ext || "audio"}`;
  } else {
    sub.textContent = "📁 Thư mục";
  }

  info.appendChild(title);
  info.appendChild(sub);
  card.appendChild(img);
  card.appendChild(info);
  // nút menu 3 chấm
  if (item.type === "audio" || item.type === "file") {
    const menuBtn = document.createElement("button");
menuBtn.textContent = "+"; // ✅ Thay vì "⋮"
    menuBtn.className = "card-menu-btn";

    // ✅ Bắt riêng sự kiện click menu
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // không để lan ra card
      e.preventDefault(); // tránh trigger hành vi mặc định
      showPlaylistMenu(item.path, item.name, e.target);
    });

    card.appendChild(menuBtn);
  }

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
      await fetch("/api/music/favorite", {
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

  card.addEventListener("click", (e) => {
    // ✅ Nếu bấm vào nút ⋮ thì bỏ qua
    if (e.target.closest(".card-menu-btn")) return;

    const encoded = encodeURIComponent(item.path);
    const key = getSourceKey();

    if (item.type === "audio" || item.type === "file") {
      window.location.href = `/music-player.html?file=${encoded}&key=${key}`;
    } else {
      window.location.href = `/music-index.html?path=${encoded}`;
    }
  });

  return card;
}
