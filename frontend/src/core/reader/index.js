import { loadFolder } from "/src/core/folder.js";
import {
  getRootFolder,
  saveRecentViewed,
  getSourceKey,
} from "/src/core/storage.js";
import { updateReaderPageInfo, showJumpPageInput } from "./utils.js";
import { showToast } from "../ui.js";
// let currentImages = [];
// let currentPage = 0;
// let readerMode = "horizontal"; // or "vertical"
// let controller = null; // object: { setCurrentPage(page) }

/**
 * 📖 Gọi từ reader.html – render chế độ đọc
 */
let readerContainer = null; // Reuse duy nhất 1 thẻ reader DOM
let controller = null; // Giữ instance của chế độ đọc
let currentImages = [];
let currentPage = 0;
let readerMode = "horizontal"; // "vertical" or "horizontal"
/**
 * 📖 Hàm render chính (gọi khi vào reader.html hoặc đổi mode)
 */
export function renderReader(
  images,
  preserveCurrentPage = false,
  scrollPage = 0
) {
  // tang view
  const urlParams = new URLSearchParams(window.location.search);
  const path = urlParams.get("path");
  const parts = path.split("/");
  const folderName =
    parts[parts.length - 1] === "__self__"
      ? parts[parts.length - 2] || "Xem ảnh"
      : parts[parts.length - 1] || "Xem ảnh";

  updateReaderHeaderTitle(folderName);
  saveRecentViewed({
    name: folderName,
    path,
    thumbnail: images[0] || null,
  });
  const sourceKey = getSourceKey();
  const rootFolder = getRootFolder();

  if (!sourceKey) return;

  if (controller?.destroy) {
    try {
      controller.destroy();
    } catch (e) {
      console.error("destroy reader error", e);
    }
  }

  if (!preserveCurrentPage) {
    fetch("/api/increase-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: path,
        dbkey: sourceKey,
        rootKey: rootFolder,
      }),
    });
  }
  //
  currentImages = images;
  if (!preserveCurrentPage) currentPage = 0;

  const app = document.getElementById("app");

  // 🧱 Reuse readerContainer thay vì tạo mới
  if (!readerContainer) {
    readerContainer = document.createElement("div");
    readerContainer.id = "reader";
    readerContainer.className = "reader";
    app.appendChild(readerContainer);

    setupReaderModeButton();
    setupPageInfoClick();
    setupChapterNavigation();
  }
  // 🧽 Xoá nội dung cũ (ảnh cũ)
  readerContainer.innerHTML = "";
  readerContainer.classList.toggle("scroll-mode", readerMode === "vertical");
  // Import dynamic mode
  const load =
    readerMode === "vertical"
      ? import("./scroll.js")
      : import("./horizontal.js");

  load.then(({ renderScrollReader, renderHorizontalReader }) => {
    const renderFn =
      readerMode === "vertical" ? renderScrollReader : renderHorizontalReader;

    // 🧠 Cập nhật controller + onPageChange callback
    controller = renderFn(
      images,
      readerContainer,
      (newPage) => {
        currentPage = newPage;
      },
      readerMode === "vertical" ? scrollPage : currentPage
    );

    if (readerMode === "horizontal") {
      updateReaderPageInfo(currentPage + 1, currentImages.length);
      setupPageInfoClick(); // ✅ Gán lại click Trang X/Y về dạng input
    }
    const imageCountInfo = document.getElementById("image-count-info");
    if (imageCountInfo) {
      imageCountInfo.style.display =
        readerMode === "vertical" ? "block" : "none";
    }
  });
}

/**
 * 🧩 Gắn nút đổi chế độ đọc 📖
 */
function setupReaderModeButton() {
  if (document.getElementById("readerModeButton")) return;

  const btn = document.createElement("button");
  btn.id = "readerModeButton";
  btn.textContent = "📖";
  btn.title = "Đổi chế độ đọc";

  Object.assign(btn.style, {
    position: "fixed",
    bottom: "60px",
    left: "16px",
    zIndex: 1000,
    padding: "12px 14px",
    fontSize: "20px",
    borderRadius: "50%",
    border: "none",
    background: "#444",
    color: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    cursor: "pointer",
  });

  btn.onclick = toggleReaderMode;
  document.body.appendChild(btn);
}

/**
 * 🔁 Toggle giữa scroll/horizontal
 */
export function toggleReaderMode() {
  let scrollPage = 0;

  if (readerMode === "vertical") {
    // scroll ➜ horizontal
    const count = document.getElementById("image-count-info");
    const match = count?.textContent?.match(/Ảnh (\d+)/);
    if (match) currentPage = parseInt(match[1]) - 1;
    readerMode = "horizontal";
  } else {
    // horizontal ➜ scroll
    scrollPage = Math.floor(currentPage / 200);
    readerMode = "vertical";
  }

  renderReader(currentImages, true, scrollPage);
  // ⚠️ Không cần setCurrentPage sau khi render vì đã truyền startPage
}

export function getCurrentImage() {
  return currentImages[currentPage] || null;
}

/**
 * ⏩ Nút Next/Prev chapter
 */
function setupChapterNavigation() {
  const prevBtn = document.getElementById("prev-chapter-btn");
  const nextBtn = document.getElementById("next-chapter-btn");
  if (!prevBtn || !nextBtn) return;

  prevBtn.onclick = () => moveChapter("prev");
  nextBtn.onclick = () => moveChapter("next");
}

function moveChapter(direction = "next") {
  const root = getRootFolder();
  const key = getSourceKey();
  const urlParams = new URLSearchParams(window.location.search);
  let path = urlParams.get("path") || "";
  path = path.replace(/\/__self__$/, "");

  if (!key || !root || !path) {
    alert("❌ Thiếu key, root hoặc path!");
    return;
  }



  fetch(
    `/api/manga/next-chapter?key=${encodeURIComponent(key)}&root=${encodeURIComponent(
      root
    )}&path=${encodeURIComponent(path)}&dir=${direction}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data.path) {
        alert(
          direction === "next" ? "🚫 Hết chương!" : "🚫 Đây là chương đầu!"
        );
        return;


      }

      fetch(
        `/api/manga/folder-cache?mode=path&key=${encodeURIComponent(
          key
        )}&root=${encodeURIComponent(root)}&path=${encodeURIComponent(
          data.path
        )}`
      )
        .then((res) => res.json())
        .then((chapter) => {
          const normalize = (p) => p.replace(/\/__self__$/, "");
          const isReader =
            Array.isArray(chapter.images) && chapter.images.length > 0;
          const isSame = normalize(data.path) === normalize(path);
          const isEmpty =
            !isReader && (!chapter.folders || chapter.folders.length === 0);

          if (isSame && isEmpty) {
            const parts = path.split("/").filter(Boolean);
            if (parts.length >= 2) {
              const parentPath = parts.slice(0, -1).join("/");
              loadFolder(parentPath);
            } else {
              alert("❌ Không còn folder cha!");
            }
            return;
          }

          const isFolderView =
            !isReader &&
            Array.isArray(chapter.folders) &&
            chapter.folders.length > 0;

          if (isReader) {
            let readerPath = data.path;
            if (chapter.folders?.length > 0) {
              readerPath += "/__self__";
            }

            const newURL = `${
              window.location.pathname
            }?path=${encodeURIComponent(readerPath)}`;
            window.history.replaceState({}, "", newURL);

            renderReader(chapter.images);
          } else if (isFolderView) {
            // ✅ Nếu đang trong reader.html mà gặp folder chỉ có subfolder
            // → redirect về index.html để hiện list folder
            window.location.href = `/manga/index.html?path=${encodeURIComponent(
              data.path
            )}`;
            return;
          }
        });
    })
    .catch((err) => {
      console.error("❌ Lỗi chuyển chương:", err);
      alert("❌ Lỗi kết nối server");
    });
}

/**
 * 🧩 Click vào Trang X/Y để chuyển nhanh
 */
function setupPageInfoClick() {
  const pageInfo = document.getElementById("page-info");
  if (!pageInfo) return;

  pageInfo.onclick = () => {
    if (readerMode === "vertical") return; // scroll mode có modal riêng
    showJumpPageInput(currentPage, currentImages.length, (newPage) => {
      currentPage = newPage;
      if (controller?.setCurrentPage) {
        controller.setCurrentPage(newPage);
      }
    });
  };
}

/**
 * 🧾 Tạo header hiển thị tên thư mục + xử lý back folder cha (không thêm history)
 */
function updateReaderHeaderTitle(folderName) {
  const titleEl = document.getElementById("reader-folder-name");
  if (!titleEl) return;

  titleEl.textContent = folderName;
  titleEl.title = folderName;

  // Gán class để CSS xử lý hover/cursor
  titleEl.classList.add("clickable-folder");

  titleEl.onclick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPath = urlParams.get("path") || "";
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop(); // bỏ folder hiện tại
    const parentPath = parts.join("/");

    if (!parentPath) {
      window.location.replace("/manga/index.html");
    } else {
      window.location.replace(
        `/manga/index.html?path=${encodeURIComponent(parentPath)}`
      );
    }
  };
}
