// 📁 frontend/src/pages/favorite.js

import { getRootFolder, getSourceKey } from "/src/core/storage.js";
import { renderFolderCard } from "/src/components/folderCard.js";
import { showToast, showOverlay, hideOverlay } from "/src/core/ui.js";
import { loadFolder } from "/src/core/folder.js";
let allFavorites = [];
let currentPage = 0;
const perPage = 20; // 👈 số lượng card mỗi trang

// ✅ Hàm render toàn bộ grid theo trang hiện tại
function renderGridPage() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const section = document.createElement("section");
   section.className = "folder-section grid";  // ✅ CHỈ gán folder-section cho section


  const header = document.createElement("div");
  header.className = "folder-section-header";

  const title = document.createElement("h3");
  title.className = "folder-section-title";
  title.textContent = `❤️ Truyện yêu thích (${allFavorites.length})`;
  header.appendChild(title);
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "grid";

  const paged = allFavorites.slice(
    currentPage * perPage,
    (currentPage + 1) * perPage
  );

  paged.forEach((folder) => {
    const card = renderFolderCard(folder, true);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  app.appendChild(section);

  renderPagination();
}

// ✅ Hiển thị nút phân trang
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

// ✅ Hàm khởi tạo khi vào trang
async function loadFavorites() {
  const root = getRootFolder();
  const key = getSourceKey();
  if (!root || !key) return showToast("❌ Thiếu root hoặc sourceKey");

  showOverlay();

  try {
    const res = await fetch(
      `/api/manga/favorite?key=${encodeURIComponent(key)}&root=${encodeURIComponent(
        root
      )}`
    );
    allFavorites = await res.json();
    currentPage = 0;
    renderGridPage();
  } catch (err) {
    showToast("❌ Lỗi khi tải danh sách yêu thích");
    console.error("favorite.js error:", err);
  } finally {
    hideOverlay();
  }
}

window.addEventListener("DOMContentLoaded", loadFavorites);
window.loadFolder = loadFolder;
