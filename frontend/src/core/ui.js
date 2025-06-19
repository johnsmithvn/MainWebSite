// ➕ BỔ SUNG UI FRONTEND RENDER BANNER RANDOM
// 📁 frontend/src/ui.js ➜ renderRandomBanner()
import { getRootFolder, getSourceKey } from "./storage.js";

import { state, loadFolder } from "/src/core/folder.js";
import { changeRootFolder } from "./storage.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";

const SEARCH_LIMIT = 50;
const searchStates = {
  manga: { keyword: "", offset: 0, loading: false, hasMore: true, attached: false },
  movie: { keyword: "", offset: 0, loading: false, hasMore: true, attached: false, type: "" },
  music: { keyword: "", offset: 0, loading: false, hasMore: true, attached: false, type: "" },
};

/**
 * 🔍 Lọc danh sách truyện theo từ khóa
 */

export async function filterManga(fromScroll = false) {
  const keyword = document
    .getElementById("floatingSearchInput")
    ?.value.trim()
    .toLowerCase();
  const dropdown = document.getElementById("search-dropdown");
  const rootFolder = getRootFolder();
  const sourceKey = getSourceKey();

  const state = searchStates.manga;

  if (!keyword) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    state.keyword = "";
    state.offset = 0;
    state.hasMore = true;
    return;
  }

  if (keyword !== state.keyword) {
    state.keyword = keyword;
    state.offset = 0;
    state.hasMore = true;
    dropdown.innerHTML = "";
  } else if (fromScroll && !state.hasMore) {
    return;
  }

  if (state.loading) return;

  state.loading = true;
  dropdown.classList.remove("hidden");
  const loader = document.createElement("div");
  loader.id = "search-loader";
  loader.textContent = state.offset === 0 ? "🔍 Đang tìm kiếm..." : "🔄 Đang tải thêm...";
  dropdown.appendChild(loader);

  try {
    const res = await fetch(
      `/api/manga/folder-cache?mode=search&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(rootFolder)}&q=${encodeURIComponent(
        keyword
      )}&limit=${SEARCH_LIMIT}&offset=${state.offset}`
    );
    const results = await res.json();

    dropdown.removeChild(loader);

    if (state.offset === 0 && results.length === 0) {
      dropdown.innerHTML = `<div id="search-loader">❌ Không tìm thấy kết quả</div>`;
      state.hasMore = false;
      state.loading = false;
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

        if (window.location.pathname.includes("reader.html")) {
          window.location.href = `/manga/index.html?path=${encodeURIComponent(
            f.path
          )}`;
        } else {
          window.loadFolder?.(f.path);
        }
      };

      dropdown.appendChild(item);
    });

    state.offset += results.length;
    if (results.length < SEARCH_LIMIT) state.hasMore = false;
  } catch (err) {
    dropdown.removeChild(loader);
    dropdown.innerHTML = `<div id="search-loader">⚠️ Lỗi khi tìm kiếm</div>`;
    console.error("❌ Lỗi tìm kiếm:", err);
  } finally {
    state.loading = false;
    if (!state.attached) {
      dropdown.addEventListener("scroll", () => {
        if (
          dropdown.scrollTop + dropdown.clientHeight >=
          dropdown.scrollHeight - 10
        ) {
          filterManga(true);
        }
      });
      state.attached = true;
    }
  }
}
export async function filterMovie(fromScroll = false) {
  const keyword = document
    .getElementById("floatingSearchInput")
    ?.value.trim()
    .toLowerCase();
  const dropdown = document.getElementById("search-dropdown");
  const sourceKey = localStorage.getItem("sourceKey");
  const type = document.getElementById("search-type-select")?.value || "video"; // ✅ loại tìm

  const state = searchStates.movie;

  if (!keyword) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    state.keyword = "";
    state.offset = 0;
    state.hasMore = true;
    return;
  }

  if (keyword !== state.keyword || type !== state.type) {
    state.keyword = keyword;
    state.type = type;
    state.offset = 0;
    state.hasMore = true;
    dropdown.innerHTML = "";
  } else if (fromScroll && !state.hasMore) {
    return;
  }

  if (state.loading) return;

  state.loading = true;
  dropdown.classList.remove("hidden");
  const loader = document.createElement("div");
  loader.id = "search-loader";
  loader.textContent = state.offset === 0 ? "🔍 Đang tìm video..." : "🔄 Đang tải thêm...";
  dropdown.appendChild(loader);

  try {
    const res = await fetch(
      `/api/movie/video-cache?mode=search&key=${encodeURIComponent(
        sourceKey
      )}&q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}&limit=${SEARCH_LIMIT}&offset=${state.offset}`
    );
    const data = await res.json();
    dropdown.removeChild(loader);

    if (!data.folders || data.folders.length === 0) {
      if (state.offset === 0) {
        dropdown.innerHTML = `<div id="search-loader">❌ Không tìm thấy video nào</div>`;
      }
      state.hasMore = false;
      state.loading = false;
      return;
    }

    data.folders.forEach((f) => {
      const item = document.createElement("div");
      item.className = "search-item";

      let thumbSrc = buildThumbnailUrl(f, "movie");

      item.innerHTML = `
    <img src="${thumbSrc}" class="search-thumb" alt="thumb">
    <div class="search-title">${f.name}</div>
  `;

      item.onclick = () => {
        dropdown.classList.add("hidden");
        if (f.type === "video" || f.type === "file") {
          window.location.href = `/movie/player.html?file=${encodeURIComponent(
            f.path
          )}&key=${sourceKey}`;
        } else {
          window.location.href = `/movie/index.html?path=${encodeURIComponent(
            f.path
          )}`;
        }
      };

      dropdown.appendChild(item);
    });

    state.offset += data.folders.length;
    if (data.folders.length < SEARCH_LIMIT) state.hasMore = false;
  } catch (err) {
    dropdown.removeChild(loader);
    console.error("❌ Lỗi tìm kiếm video:", err);
    dropdown.innerHTML = `<div id="search-loader">⚠️ Lỗi khi tìm kiếm</div>`;
  } finally {
    state.loading = false;
    if (!state.attached) {
      dropdown.addEventListener("scroll", () => {
        if (
          dropdown.scrollTop + dropdown.clientHeight >=
          dropdown.scrollHeight - 10
        ) {
          filterMovie(true);
        }
      });
      state.attached = true;
    }
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
export function updateFolderPaginationUI(
  currentPage,
  totalItems,
  perPage,
  onPageChange,
  target = null
) {
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
  const isMoviePage = window.location.pathname.includes("movie");

  const filtered = isMoviePage
    ? folders.filter((f) => f.type === "video" || f.type === "file")
    : folders.filter(
        (f) => !f.type || (f.type !== "video" && f.type !== "file")
      );

  renderFolderSlider({
    title: isMoviePage ? "🕓 Vừa xem" : "🕘 Mới đọc",
    folders: filtered,
    targetId: "section-recent",
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
    createSidebarButton(
      "🔄 Reset DB (Xoá + Scan)",
      withLoading(async () => {
        const ok = await showConfirm("Bạn chắc muốn reset và scan lại DB?");
        if (!ok) return;

        const res = await fetch(
          `/api/manga/reset-cache?root=${encodeURIComponent(
            root
          )}&key=${encodeURIComponent(sourceKey)}&mode=reset`,
          { method: "DELETE" }
        );
        const data = await res.json();
        showToast(data.message || "✅ Reset DB xong");
      })
    )
  );

  // 📦 Quét thư mục mới (Scan DB)
  // 📦 Scan folder mới (không xoá DB)
sidebar.appendChild(
  createSidebarButton("📦 Quét thư mục mới", withLoading(async () => {
    // Chỉ gọi showConfirm không truyền {loading: true}
    const ok = await showConfirm("Quét folder mới (không xoá DB)?");
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
    }
  }))
);


  // 🧼 Xoá cache folder localStorage
  sidebar.appendChild(
    createSidebarButton("🧼 Xoá cache folder", withLoading(async () => {
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
      goHome(); // ✅ Quay lại chọn root
      showToast(`✅ Đã xoá ${count} cache folder`);
    }))
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
      goHome();
    })
  );

  // 🗑 Xoá DB Movie
sidebar.appendChild(
  createSidebarButton(
    "🗑 Xoá DB Movie",
    withLoading(async () => {
      // KHÔNG truyền {loading: true} nữa!
      const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB Movie?");
      if (!ok) return;

      try {
        const res = await fetch(
          `/api/movie/reset-cache-movie?key=${sourceKey}&mode=delete`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        showToast(data.message || "✅ Đã xoá DB Movie");
        window.location.reload();
      } catch (err) {
        showToast("❌ Lỗi khi gọi API xoá DB Movie");
        console.error(err);
      }
      // KHÔNG cần finally overlay nữa!
    })
  )
);

  // 🗑 Xoá DB Movie
  sidebar.appendChild(
    createSidebarButton(
      "🗑 Reset DB Movie (xóa và scan)",
      withLoading(async () => {
        const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB Movie?", {
          loading: true,
        });
        if (!ok) return;

        try {
          const res = await fetch(
            `/api/movie/reset-cache-movie?key=${sourceKey}&mode=reset`,
            {
              method: "DELETE",
            }
          );
          const data = await res.json();
          showToast(data.message || "✅ Đã xoá DB Movie");
          window.location.reload();
        } catch (err) {
          showToast("❌ Lỗi khi gọi API xoá DB Movie");
          console.error(err);
        }
      })
    )
  );

  sidebar.appendChild(
    createSidebarButton(
      "📦 Quét thư mục mới",
      withLoading(async () => {
        const ok = await showConfirm("Quét folder mới (không xoá DB)?", {});
        if (!ok) return;

        try {
          const res = await fetch("/api/movie/scan-movie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: sourceKey }),
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
    )
  );

  // 🧹 Xoá cache movie folder localStorage
  sidebar.appendChild(
    createSidebarButton(
      "🧼 Xoá cache folder",
      withLoading(async () => {
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
    )
  );
}

export function setupMusicSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  if (!sidebar) return;
  sidebar.innerHTML = "";

  const sourceKey = getSourceKey();

  // 🎼 Đổi Music Folder
  sidebar.appendChild(
    createSidebarButton("🎼 Đổi Music Folder", () => {
      localStorage.removeItem("rootFolder");
      goHome();
    })
  );

  // 🗑 Xoá DB
  sidebar.appendChild(
    createSidebarButton("🗑 Xoá Music DB", withLoading(async () => {
      const ok = await showConfirm("Bạn có chắc muốn xoá DB music?", {
        loading: true,
      });
      if (!ok) return;

      try {
        const res = await fetch(
          `/api/music/reset-cache-music?key=${sourceKey}&mode=delete`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        showToast(data.message || "✅ Đã xoá DB");
      } catch (err) {
        showToast("❌ Lỗi khi gọi API xoá DB");
      }
    }))
  );

  // 🔄 Reset DB
  sidebar.appendChild(
    createSidebarButton("🔄 Reset DB (Xoá + Scan)", withLoading(async () => {
      const ok = await showConfirm("Reset DB music và scan lại?", {
      });
      if (!ok) return;

      try {
        const res = await fetch(
          `/api/music/reset-cache-music?key=${sourceKey}&mode=reset`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        showToast(data.message || "✅ Reset DB xong");
        window.location.reload();
      } catch (err) {
        console.error(err);
        showToast("❌ Lỗi reset DB");
      }
    }))
  );

  // 📦 Quét thư mục mới
  sidebar.appendChild(
    createSidebarButton("📦 Quét thư mục mới",withLoading( async () => {
      const ok = await showConfirm("Quét folder mới (không xoá DB)?", {
      });
      if (!ok) return;

      try {
        const res = await fetch(`/api/music/scan-music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: sourceKey }),
        });
        const data = await res.json();
        showToast(
          `✅ Scan xong:\nInserted ${data.stats.inserted}, Updated ${data.stats.updated}, Skipped ${data.stats.skipped}`
        );
      } catch (err) {
        showToast("❌ Lỗi khi quét folder");
      }
    }))
  );

  // 🧹 Xoá cache folder
  sidebar.appendChild(
    createSidebarButton("🧼 Xoá cache folder", withLoading(async () => {
      const ok = await showConfirm("Xoá toàn bộ cache folder music?");
      if (!ok) return;

      let count = 0;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`musicCache::${sourceKey}::`)) {
          localStorage.removeItem(key);
          count++;
        }
      });

      showToast(`✅ Đã xoá ${count} cache folder`);
    }))
  );
}

// filter music
export async function filterMusic(fromScroll = false) {
  const keyword = document
    .getElementById("floatingSearchInput")
    ?.value.trim()
    .toLowerCase();
  const dropdown = document.getElementById("search-dropdown");
  const sourceKey = getSourceKey();
  const type = document.getElementById("search-type-select")?.value || "audio";

  const state = searchStates.music;

  if (!keyword) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    state.keyword = "";
    state.offset = 0;
    state.hasMore = true;
    return;
  }

  if (keyword !== state.keyword || type !== state.type) {
    state.keyword = keyword;
    state.type = type;
    state.offset = 0;
    state.hasMore = true;
    dropdown.innerHTML = "";
  } else if (fromScroll && !state.hasMore) {
    return;
  }

  if (state.loading) return;

  state.loading = true;
  dropdown.classList.remove("hidden");
  const loader = document.createElement("div");
  loader.id = "search-loader";
  loader.textContent = state.offset === 0 ? "🔍 Đang tìm nhạc..." : "🔄 Đang tải thêm...";
  dropdown.appendChild(loader);

  try {
    const res = await fetch(
      `/api/music/audio-cache?mode=search&key=${encodeURIComponent(
        sourceKey
      )}&q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}&limit=${SEARCH_LIMIT}&offset=${state.offset}`
    );
    const data = await res.json();
    dropdown.removeChild(loader);

    if (!data.folders || data.folders.length === 0) {
      if (state.offset === 0) {
        dropdown.innerHTML = `<div id="search-loader">❌ Không tìm thấy bài hát nào</div>`;
      }
      state.hasMore = false;
      state.loading = false;
      return;
    }

    data.folders.forEach((f) => {
      const item = document.createElement("div");
      item.className = "search-item";

      const isAudio = f.type === "audio" || f.type === "file";
      let thumbSrc = buildThumbnailUrl(f, "music");

      item.innerHTML = `
        <img src="${thumbSrc}" class="search-thumb" alt="thumb">
        <div class="search-title">${f.name}</div>
      `;

      item.onclick = () => {
        dropdown.classList.add("hidden");
        if (isAudio) {
          window.location.href = `/music/player.html?file=${encodeURIComponent(
            f.path
          )}`;
        } else {
          window.location.href = `/music/index.html?path=${encodeURIComponent(
            f.path
          )}`;
        }
      };

      dropdown.appendChild(item);
    });

    state.offset += data.folders.length;
    if (data.folders.length < SEARCH_LIMIT) state.hasMore = false;
  } catch (err) {
    dropdown.removeChild(loader);
    console.error("❌ Lỗi tìm kiếm nhạc:", err);
    dropdown.innerHTML = `<div id="search-loader">⚠️ Lỗi khi tìm kiếm</div>`;
  } finally {
    state.loading = false;
    if (!state.attached) {
      dropdown.addEventListener("scroll", () => {
        if (
          dropdown.scrollTop + dropdown.clientHeight >=
          dropdown.scrollHeight - 10
        ) {
          filterMusic(true);
        }
      });
      state.attached = true;
    }
  }
}

export function showInputPrompt(
  message,
  placeholder = "",
  okText = "OK",
  cancelText = "Hủy"
) {
  return new Promise((resolve) => {
    // Tạo overlay
    let overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.style.zIndex = "99999";
    overlay.innerHTML = `
      <div class="popup-confirm">
        <div class="popup-message">${message}</div>
        <input class="popup-input" type="text" placeholder="${placeholder}" autofocus />
        <div class="popup-actions">
          <button class="popup-ok">${okText}</button>
          <button class="popup-cancel">${cancelText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector(".popup-input");
    const okBtn = overlay.querySelector(".popup-ok");
    const cancelBtn = overlay.querySelector(".popup-cancel");

    // Sự kiện OK
    okBtn.onclick = () => {
      const value = input.value.trim();
      overlay.remove();
      resolve(value || null);
    };
    // Sự kiện Hủy
    cancelBtn.onclick = () => {
      overlay.remove();
      resolve(null);
    };
    // Enter
    input.onkeydown = (e) => {
      if (e.key === "Enter") okBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    };
    input.focus();
  });
}

//

/**
 * Build thumbnail url cho movie/audio: luôn trả về URL tuyệt đối dùng được cho img.src
 * @param {object} f - object chứa ít nhất .path, .thumbnail, .type
 * @param {"movie"|"music"} mediaType
 * @returns {string} url thumbnail
 */
export function buildThumbnailUrl(f, mediaType = "movie") {
  let prefix = "/video/";
  let defaultFile = "/default/video-thumb.png";
  let defaultFolder = "/default/folder-thumb.png";
  if (mediaType === "music") {
    prefix = "/audio/";
    defaultFile = "/default/music-thumb.png";
    defaultFolder = "/default/folder-thumb.png";
  } else if (mediaType === "manga" || mediaType === "comic") {
    prefix = "/manga/";
    defaultFile = "/default/manga-thumb.png";
    defaultFolder = "/default/folder-thumb.png";
  }

  // Phân biệt folder/file để lấy prefix đúng
  let folderPrefix;
  if (f.type === "folder") {
    folderPrefix = f.path || "";
  } else {
    folderPrefix = f.path?.split("/").slice(0, -1).join("/") || "";
  }

  // Nếu không có thumbnail thì trả về default
  if (!f.thumbnail) {
    if (mediaType === "music") {
      return f.type === "audio" || f.type === "file"
        ? defaultFile
        : defaultFolder;
    } else if (mediaType === "manga" || mediaType === "comic") {
      return f.type === "folder" ? defaultFolder : defaultFile;
    } else {
      return f.type === "video" || f.type === "file"
        ? defaultFile
        : defaultFolder;
    }
  }

  // Nếu thumbnail đã là URL tuyệt đối thì trả luôn
  if (
    f.thumbnail.startsWith(prefix) ||
    f.thumbnail.startsWith("http") ||
    f.thumbnail.startsWith("/default/")
  ) {
    return f.thumbnail;
  }
  // Nếu thumbnail đã bị dính prefix folder (do bug hay import DB cũ) thì cắt đi
  if (folderPrefix && f.thumbnail.startsWith(folderPrefix + "/")) {
    f.thumbnail = f.thumbnail.slice(folderPrefix.length + 1);
  }
  // Build lại URL chuẩn
  return `${prefix}${
    folderPrefix ? folderPrefix + "/" : ""
  }${f.thumbnail.replace(/\\/g, "/")}`;
}

export function renderRecentViewedMusic(list = []) {
  // Lọc chỉ lấy audio/file (nếu cần)
  const filtered = list.filter((f) => f.type === "audio" || f.type === "file");

  renderFolderSlider({
    title: "🕘 Nhạc vừa nghe",
    folders: filtered,
    targetId: "section-recent-music", // Tạo 1 div/section này trong HTML hoặc tự động sinh
  });
}

export function hideOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}
export function showOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("hidden");
}

export function goHome() {
  localStorage.removeItem("sourceKey");
  window.location.href = "/home.html";
}
