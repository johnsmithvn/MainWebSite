// /src/pages/home.js

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

      // Hiện overlay loading
      const overlay = document.getElementById("loading-overlay");
      overlay?.classList.remove("hidden");

      try {
        if (type === "manga") {
          window.location.href = "/manga/select.html";
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
          window.location.href = "/movie/index.html";
          overlay?.classList.add("hidden"); // Ẩn overlay nếu lỗi
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

          window.location.href = "/music/index.html";
          overlay?.classList.add("hidden"); // Ẩn overlay nếu lỗi
        }
      } catch (err) {
        // Có thể hiện toast lỗi nếu muốn
        console.error("❌ Lỗi check/scan DB:", err);
        alert("Lỗi khi load dữ liệu!"); // hoặc showToast nếu đã dùng ở home
        overlay?.classList.add("hidden"); // Ẩn overlay nếu lỗi
      }
    };
    container.appendChild(btn);
  });
}

// Đảm bảo 2 script đã load lên window trước khi render (script inline .js nên yên tâm)
// Đảm bảo overlay luôn ẩn khi vào lại trang Home
window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("loading-overlay");
  overlay?.classList.add("hidden");
  // ... gọi renderSourceList như cũ
  renderSourceList("manga-list", window.mangaKeys || [], "manga");
  renderSourceList("movie-list", window.movieKeys || [], "movie");
  renderSourceList("music-list", window.musicKeys || [], "music");
});
