// /src/pages/home.js
import { showToast, showConfirm, showOverlay, hideOverlay } from "/src/core/ui.js";
import { ensureAuth, setupSecurityFetch } from "/src/core/security.js";

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
      if (!(await ensureAuth(key))) return;
      // Hiện overlay loading
      showOverlay();

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
          hideOverlay(); // Ẩn overlay nếu lỗi
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
          hideOverlay(); // Ẩn overlay nếu lỗi
        }
      } catch (err) {
        // Có thể hiện toast lỗi nếu muốn
        console.error("❌ Lỗi check/scan DB:", err);
        alert("Lỗi khi load dữ liệu!"); // hoặc showToast nếu đã dùng ở home
        hideOverlay(); // Ẩn overlay nếu lỗi
      }
    };
    container.appendChild(btn);
  });
}

// Đảm bảo 2 script đã load lên window trước khi render (script inline .js nên yên tâm)
// Đảm bảo overlay luôn ẩn khi vào lại trang Home
window.addEventListener("DOMContentLoaded", () => {
  setupSecurityFetch();
  hideOverlay();
  // ... gọi renderSourceList như cũ
  renderSourceList("manga-list", window.mangaKeys || [], "manga");
  renderSourceList("movie-list", window.movieKeys || [], "movie");
  renderSourceList("music-list", window.musicKeys || [], "music");
  setupClearStorageButton();
});

function setupClearStorageButton() {
  const btn = document.getElementById("clear-storage-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const ok = await showConfirm("Xoá toàn bộ localStorage?");
    if (!ok) return;
    localStorage.clear();
    showToast("✅ Đã xoá localStorage");
  });
}
