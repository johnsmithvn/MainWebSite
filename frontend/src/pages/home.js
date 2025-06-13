// /src/pages/home.js
import { redirectWithLoading } from "/src/core/ui.js";

function renderSourceList(listId, keys, type) {
  const container = document.getElementById(listId);
  if (!container) return;
  container.innerHTML = "";

  keys.forEach((key) => {
    const btn = document.createElement("div");
    btn.className = "source-btn";
    btn.textContent = `📁 ${key}`;
    btn.onclick = async () => {
      localStorage.setItem("sourceKey", key);



      try {
        if (type === "manga") {
          redirectWithLoading("/select.html");
        } else if (type === "movie") {
          const resp = await fetch(`/api/movie/movie-folder-empty?key=${key}`);
          const data = await resp.json();
          if (data.empty) {
            // Nếu rỗng thì scan, chờ scan xong mới chuyển trang
            await fetch("/api/movie/scan-movie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
          }
          // Chuyển trang sau khi mọi thứ xong
          redirectWithLoading("/movie/index.html");
        } else if (type === "music") {
          const resp = await fetch(`/api/music/music-folder?key=${key}`);
          const data = await resp.json();
          if (!data.total || data.total === 0) {
            await fetch("/api/music/scan-music", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
          }

          redirectWithLoading("/music/index.html");
        }
      } catch (err) {
        // Có thể hiện toast lỗi nếu muốn
        console.error("❌ Lỗi check/scan DB:", err);
        alert("Lỗi khi load dữ liệu!"); // hoặc showToast nếu đã dùng ở home
      }
    };
    container.appendChild(btn);
  });
}

// Đảm bảo 2 script đã load lên window trước khi render (script inline .js nên yên tâm)
window.addEventListener("DOMContentLoaded", () => {
  // ... gọi renderSourceList như cũ
  renderSourceList("manga-list", window.mangaKeys || [], "manga");
  renderSourceList("movie-list", window.movieKeys || [], "movie");
  renderSourceList("music-list", window.musicKeys || [], "music");
});
