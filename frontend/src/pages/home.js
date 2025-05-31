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

      if (type === "manga") {
        window.location.href = "/select.html";
      } else if (type === "movie") {
        // Kiểm tra DB movie rỗng thì scan trước khi chuyển trang
        try {
          const resp = await fetch(`/api/movie/movie-folder-empty?key=${key}`);
          const data = await resp.json();
          if (data.empty) {
            // Scan nếu rỗng
            await fetch("/api/movie/scan-movie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
            // Có thể hiện toast/loading ở đây nếu muốn
          }
        } catch (err) {
          // Có thể hiện toast lỗi nếu muốn
          console.error("❌ Lỗi check/scan DB movie:", err);
        }
        // Xong luôn chuyển sang movie-index.html
        window.location.href = "/movie-index.html";
      }
    };
    container.appendChild(btn);
  });
}

// Đảm bảo 2 script đã load lên window trước khi render (script inline .js nên yên tâm)
window.addEventListener("DOMContentLoaded", () => {
  renderSourceList("manga-list", window.mangaKeys || [], "manga"); // source-manga.js sẽ gán window.sourceKeys
  renderSourceList("movie-list", window.movieKeys || [], "movie"); // source-movies.js sẽ gán window.movieKeys
});
