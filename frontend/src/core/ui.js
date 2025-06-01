// ➕ BỔ SUNG UI FRONTEND RENDER BANNER RANDOM
// 📁 frontend/src/ui.js ➜ renderRandomBanner()
import { getRootFolder, getSourceKey } from "./storage.js";

import { state, loadFolder } from "/src/core/folder.js";
import { changeRootFolder } from "./storage.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";

/**
 * 🔍 Lọc danh sách truyện theo từ khóa
 */

export async function filterManga() {
  const keyword = document
    .getElementById("floatingSearchInput")
    ?.value.trim()
    .toLowerCase();
  const dropdown = document.getElementById("search-dropdown");
  const rootFolder = getRootFolder();
  const sourceKey = getSourceKey();
  if (!keyword) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    return;
  }

  // Hiện dropdown + loader
  dropdown.classList.remove("hidden");
  dropdown.innerHTML = `<div id="search-loader">🔍 Đang tìm kiếm...</div>`;

  try {
    const res = await fetch(
      `/api/manga/folder-cache?mode=search&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}&q=${encodeURIComponent(
        keyword
      )}`
    );
    const results = await res.json();

    dropdown.innerHTML = "";

    if (results.length === 0) {
      dropdown.innerHTML = `<div id="search-loader">❌ Không tìm thấy kết quả</div>`;
      return;
    }

    results.forEach((f) => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `
        <img src="${f.thumbnail}" class="search-thumb" alt="thumb">
        <div class="search-title">${f.name}</div>
      `;
      item.onclick = () => {
        dropdown.classList.add("hidden");

        // Nếu đang trong reader.html thì redirect thủ công
        if (window.location.pathname.includes("reader.html")) {
          window.location.href = `/index.html?path=${encodeURIComponent(
            f.path
          )}`;
        } else {
          window.loadFolder?.(f.path);
        }
      };

      dropdown.appendChild(item);
    });
  } catch (err) {
    dropdown.innerHTML = `<div id="search-loader">⚠️ Lỗi khi tìm kiếm</div>`;
    console.error("❌ Lỗi tìm kiếm:", err);
  }
}
export async function filterMovie() {
  const keyword = document
    .getElementById("floatingSearchInput")
    ?.value.trim()
    .toLowerCase();
  const dropdown = document.getElementById("search-dropdown");
  const sourceKey = localStorage.getItem("sourceKey");
  const type = document.getElementById("search-type-select")?.value || "video"; // ✅ loại tìm

  if (!keyword) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    return;
  }

  dropdown.classList.remove("hidden");
  dropdown.innerHTML = `<div id="search-loader">🔍 Đang tìm video...</div>`;

  try {
    const res = await fetch(
      `/api/movie/video-cache?mode=search&key=${encodeURIComponent(
        sourceKey
      )}&q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}`
    );
    const data = await res.json();
    dropdown.innerHTML = "";

    if (!data.folders || data.folders.length === 0) {
      dropdown.innerHTML = `<div id="search-loader">❌ Không tìm thấy video nào</div>`;
      return;
    }

    data.folders.forEach((f) => {
      const item = document.createElement("div");
      item.className = "search-item";

      // ✅ Xử lý thumbnail theo loại
      let thumbSrc = "/default/folder-thumb.png";

      if (f.type === "video" || f.type === "file") {
        thumbSrc = f.thumbnail
          ? `/video/${f.thumbnail.replace(/\\/g, "/")}`
          : "/default/video-thumb.png";
      } else {
        thumbSrc = f.thumbnail
          ? `/video/${f.thumbnail.replace(/\\/g, "/")}`
          : "/default/folder-thumb.png";
      }

      item.innerHTML = `
        <img src="${thumbSrc}" class="search-thumb" alt="thumb">
        <div class="search-title">${f.name}</div>
      `;

      item.onclick = () => {
        dropdown.classList.add("hidden");
        if (f.type === "video" || f.type === "file") {
          window.location.href = `/movie-player.html?file=${encodeURIComponent(
            f.path
          )}&key=${sourceKey}`;
        } else {
          window.location.href = `/movie-index.html?path=${encodeURIComponent(
            f.path
          )}`;
        }
      };

      dropdown.appendChild(item);
    });
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm video:", err);
    dropdown.innerHTML = `<div id="search-loader">⚠️ Lỗi khi tìm kiếm</div>`;
  }
}

/**
 * 🌙 Bật / tắt chế độ dark mode
 */
export function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

/**
 * 📄 Cập nhật UI phân trang
 */
export function updateFolderPaginationUI(currentPage, totalItems, perPage, onPageChange, target = null) {
  const totalPages = Math.ceil(totalItems / perPage);
  const container = target || document.getElementById("app");
  if (!container) return;

  const nav = document.createElement("div");
  nav.className = "reader-controls";

  const prev = document.createElement("button");
  prev.textContent = "⬅ Trang trước";
  prev.disabled = currentPage <= 0;
  prev.onclick = () => loadFolder(state.currentPath, currentPage - 1);
  nav.appendChild(prev);

  const jumpForm = document.createElement("form");
  jumpForm.style.display = "inline-block";
  jumpForm.style.margin = "0 10px";
  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const inputPage = parseInt(jumpInput.value) - 1;
    if (!isNaN(inputPage) && inputPage >= 0) {
      loadFolder(state.currentPath, inputPage);
    }
  };

  const jumpInput = document.createElement("input");
  jumpInput.type = "number";
  jumpInput.min = 1;
  jumpInput.max = totalPages;
  jumpInput.placeholder = `Trang...`;
  jumpInput.title = `Tổng ${totalPages} trang`;
  jumpInput.style.width = "60px";

  const jumpBtn = document.createElement("button");
  jumpBtn.textContent = "⏩";

  jumpForm.appendChild(jumpInput);
  jumpForm.appendChild(jumpBtn);
  nav.appendChild(jumpForm);

  const next = document.createElement("button");
  next.textContent = "Trang sau ➡";
  next.disabled = currentPage + 1 >= totalPages;
  next.onclick = () => loadFolder(state.currentPath, currentPage + 1);
  nav.appendChild(next);

  container.appendChild(nav);

  const info = document.createElement("div");
  info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
  info.style.textAlign = "center";
  info.style.marginTop = "10px";
  container.appendChild(info);
}

/**
 * 🔍 Toggle thanh tìm kiếm nổi (slide xuống giống YouTube)
 */
export function toggleSearchBar() {
  const bar = document.getElementById("floating-search");
  bar?.classList.toggle("active");

  const input = document.getElementById("floatingSearchInput");
  if (bar?.classList.contains("active")) {
    input?.focus();
  } else {
    input.value = "";
    filterManga();
  }
}

/**
 * 🖼️ Render banner thư mục ngẫu nhiên dạng slider ngang
 * @param {Array} folders - Danh sách folder có thumbnail
 */
// ✅ Hiển thị thời gian cập nhật ngẫu nhiên bên dưới banner random
export function showRandomUpdatedTime(timestamp, id = "random-timestamp") {
  const info = document.getElementById(id);
  if (!info) return;

  const diff = Math.floor((Date.now() - timestamp) / 60000);
  const isMobile = window.innerWidth <= 480;

  if (isMobile) {
    info.textContent = `🎲 ${diff === 0 ? "now" : `${diff}m`}`;
  } else {
    info.textContent = `🎲 Random ${
      diff === 0 ? "vừa xong" : `${diff} phút trước`
    }`;
  }
}

export function renderRandomBanner(folders) {
  renderFolderSlider({
    title: "✨ Đề xuất ngẫu nhiên",
    folders,
    showRefresh: true,
  });
}

/**
 * 📈 Render hàng TOP VIEW bên dưới banner random
 * @param {Array} folders - Có dạng {name, path, thumbnail, count}
 */

// ✅ Cập nhật renderTopView để thêm tiêu đề
export function renderTopView(folders) {
  renderFolderSlider({
    title: "👑 Xem nhiều nhất",
    folders,
    showViews: true,
  });
}

// ➕ BỔ SUNG UI FRONTEND - TIÊU ĐỀ + RECENT VIEW

/** 🧠 Danh sách truy cập gần đây – hiển thị bên phải, vuốt được */
export function renderRecentViewed(folders = []) {
  renderFolderSlider({
    title: "🕘 Mới đọc",
    folders,
  });
}

// / Side bar
// 📂 Sidebar functions gộp từ sidebar.js
function createSidebarButton(text, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

export function setupSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  if (!sidebar) return;
  sidebar.innerHTML = "";

  const root = getRootFolder();
  const sourceKey = getSourceKey();

  // 🔄 Đổi Manga Folder
  sidebar.appendChild(
    createSidebarButton("🔄 Đổi Manga Folder", () => {
      changeRootFolder();
    })
  );

  // 🗑 Xoá DB
  sidebar.appendChild(
    createSidebarButton("🗑 Xoá DB", async () => {
      const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB không?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch(
          `/api/manga/reset-cache?root=${encodeURIComponent(
            root
          )}&key=${encodeURIComponent(sourceKey)}&mode=delete`,
          { method: "DELETE" }
        );
        const data = await res.json();
        showToast(data.message || "✅ Đã xoá DB");
      } catch (err) {
        showToast("❌ Lỗi khi gọi API");
      } finally {
        // ✅ ĐẢM BẢO LUÔN TẮT LOADING
        const overlay = document.getElementById("loading-overlay");
        overlay?.classList.add("hidden");
      }
    })
  );
  // 🔁 Reset cache DB + scan lại theo rootFolder
  sidebar.appendChild(
    createSidebarButton("🔄 Reset DB (Xoá + Scan)", async () => {
      const ok = await showConfirm("Bạn chắc muốn reset và scan lại DB?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch(
          `/api/manga/reset-cache?root=${encodeURIComponent(
            root
          )}&key=${encodeURIComponent(sourceKey)}&mode=reset`,
          { method: "DELETE" }
        );
        const data = await res.json();
        showToast(data.message || "✅ Reset DB xong");
      } catch (err) {
        showToast("❌ Lỗi reset DB");
        console.error(err);
      } finally {
        const overlay = document.getElementById("loading-overlay");
        overlay?.classList.add("hidden");
      }
    })
  );

  // 📦 Quét thư mục mới (Scan DB)
  // 📦 Scan folder mới (không xoá DB)
  sidebar.appendChild(
    createSidebarButton("📦 Quét thư mục mới", async () => {
      const ok = await showConfirm("Quét folder mới (không xoá DB)?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch("/api/manga/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ root: root, key: sourceKey }),
        });
        const data = await res.json();
        showToast(
          `✅ Scan xong:\nInserted ${data.stats.inserted}, Updated ${data.stats.updated}, Skipped ${data.stats.skipped}`
        );
      } catch (err) {
        showToast("❌ Lỗi khi quét folder");
        console.error(err);
      } finally {
        const overlay = document.getElementById("loading-overlay");
        overlay?.classList.add("hidden");
      }
    })
  );

  // 🧼 Xoá cache folder localStorage
  sidebar.appendChild(
    createSidebarButton("🧼 Xoá cache folder", async () => {
      const ok = await showConfirm(
        "Bạn có chắc muốn xoá cache folder localStorage?"
      );
      if (!ok) return;

      const sourceKey = getSourceKey();
      let count = 0;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`folderCache::${sourceKey}::`)) {
          localStorage.removeItem(key);
          count++;
        }
      });
      window.location.href = "/home.html"; // ✅ Quay lại chọn root
      showToast(`✅ Đã xoá ${count} cache folder`);
    })
  );
}

export function toggleSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  if (!sidebar) return;
  sidebar.classList.toggle("active");
}

export function withLoading(fn) {
  return async (...args) => {
    const overlay = document.getElementById("loading-overlay");
    overlay?.classList.remove("hidden");

    // 💥 Ép trình duyệt render overlay trước khi tiếp tục
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

    try {
      await fn(...args);
    } catch (e) {
      console.error("❌ withLoading error:", e);
    } finally {
      overlay?.classList.add("hidden");
    }
  };
}

export function showToast(msg) {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#333";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "14px";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

export function showConfirm(message, options = {}) {
  let modal = document.getElementById("global-confirm");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "global-confirm";
    modal.className = "modal-overlay hidden";
    modal.innerHTML = `
      <div class="modal-box">
        <p id="confirm-text"></p>
        <div class="buttons">
          <button class="ok">OK</button>
          <button class="cancel">Huỷ</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.querySelector("#confirm-text").textContent = message;
  modal.classList.remove("hidden");

  return new Promise((resolve) => {
    const okBtn = modal.querySelector("button.ok");
    const cancelBtn = modal.querySelector("button.cancel");

    const cleanup = () => {
      modal.classList.add("hidden");
      okBtn.removeEventListener("click", onOK);
      cancelBtn.removeEventListener("click", onCancel);
    };

    const onOK = () => {
      cleanup();

      // ✅ Nếu options.loading = true thì bật overlay sau khi OK
      if (options.loading) {
        const overlay = document.getElementById("loading-overlay");
        overlay?.classList.remove("hidden");
      }

      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener("click", onOK);
    cancelBtn.addEventListener("click", onCancel);
  });
}

export function setupMovieSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  if (!sidebar) return;
  sidebar.innerHTML = "";

  const sourceKey = getSourceKey();

  // 🔄 Đổi Movie Folder (chuyển về home.html)
  sidebar.appendChild(
    createSidebarButton("🎬 Đổi Movie Folder", () => {
      localStorage.removeItem("rootFolder");
      window.location.href = "/home.html";
    })
  );

  // 🗑 Xoá DB Movie
  sidebar.appendChild(
    createSidebarButton("🗑 Xoá DB Movie", async () => {
      const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB Movie?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch(`/api/movie/reset-cache-movie?key=${sourceKey}&mode=delete`, {
          method: "DELETE",
        });
        const data = await res.json();
        showToast(data.message || "✅ Đã xoá DB Movie");
        window.location.reload();
      } catch (err) {
        showToast("❌ Lỗi khi gọi API xoá DB Movie");
        console.error(err);
      }
    })
  );

    // 🗑 Xoá DB Movie
  sidebar.appendChild(
    createSidebarButton("🗑 Reset DB Movie (xóa và scan)", async () => {
      const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB Movie?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch(`/api/movie/reset-cache-movie?key=${sourceKey}&mode=reset`, {
          method: "DELETE",
        });
        const data = await res.json();
        showToast(data.message || "✅ Đã xoá DB Movie");
        window.location.reload();
      } catch (err) {
        showToast("❌ Lỗi khi gọi API xoá DB Movie");
        console.error(err);
      }
    })
  );


  sidebar.appendChild(
    createSidebarButton("📦 Quét thư mục mới", async () => {
      const ok = await showConfirm("Quét folder mới (không xoá DB)?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch("/api/movie/scan-movie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({key : sourceKey}),
        });
        const data = await res.json();
        showToast(
          `✅ Scan xong:\nInserted ${data.stats.inserted}, Updated ${data.stats.updated}, Skipped ${data.stats.skipped}`
        );
      } catch (err) {
        showToast("❌ Lỗi khi quét folder");
        console.error(err);
      }
    })
  );

  // 🧹 Xoá cache movie folder localStorage
  sidebar.appendChild(
    createSidebarButton("🧼 Xoá cache folder", async () => {
      const ok = await showConfirm(
        "Bạn có chắc muốn xoá cache folder movie localStorage?"
      );
      if (!ok) return;

      let count = 0;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`movieCache::${sourceKey}::`)) {
          localStorage.removeItem(key);
          count++;
        }
      });

      showToast(`✅ Đã xoá ${count} cache folder`);
    })
  );
}
