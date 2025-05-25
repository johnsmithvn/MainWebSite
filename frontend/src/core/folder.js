// 📁 frontend/src/folder.js

import { showToast, updateFolderPaginationUI } from "./ui.js";
import {
  getRootFolder,
  getSourceKey,
  getFolderCache,
  setFolderCache,
} from "./storage.js";
import { preloadThumbnails } from "./preload.js";
import { renderFolderCard } from "../components/folderCard.js";
export const state = {
  currentPath: "",
  allFolders: [],
};
let folderPage = 0;
const foldersPerPage = 24;
let totalFolders = 0; // 🆕 Tổng số folder thực tế không bị slice

/**
 * 📂 Load folder từ API hoặc cache + hiển thị thư mục / ảnh
 * @param {string} path
 * @param {number} page
 */
export function loadFolder(path = "", page = 0) {
  const rootFolder = getRootFolder();
  const sourceKey = getSourceKey(); // VD: FANTASY

  state.currentPath = path;
  folderPage = page;

  document.getElementById("loading-overlay")?.classList.remove("hidden");

  const readerBtn = document.getElementById("readerModeButton");
  if (readerBtn) readerBtn.remove();

  const cached = getFolderCache(sourceKey, rootFolder, path);
  if (cached) {
    renderFromData(cached);
    document.getElementById("loading-overlay")?.classList.add("hidden");
    return;
  }

  fetch(
    `/api/folder-cache?mode=path&key=${encodeURIComponent(
      sourceKey
    )}&root=${encodeURIComponent(rootFolder)}&path=${encodeURIComponent(path)}`
  )
    .then((res) => res.json())
    .then((data) => {
      setFolderCache(sourceKey, rootFolder, path, data);
      renderFromData(data);
    })
    .catch((err) => {
      console.error("❌ Lỗi khi load folder:", err);
      showToast("🚫 Lỗi khi tải thư mục, vui lòng thử lại!");
    })
    .finally(() => {
      document.getElementById("loading-overlay")?.classList.add("hidden");
    });
}

/**
 * 🧱 Render dữ liệu folder hoặc reader từ cache hoặc API
 * @param {object} data
 */
function renderFromData(data) {
  console.log("📦 Data render:", data); // debug
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (data.type === "folder") {
   
    state.allFolders = [];

    if (data.images && data.images.length > 0) {
      const parts = state.currentPath.split("/");
      const folderName = parts[parts.length - 1] || "Xem ảnh";

      state.allFolders.push({
        name: folderName,
        path: state.currentPath + "/__self__",
        thumbnail: data.images[0],
        isSelfReader: true,
        images: data.images,
        hasImages: true, // ✅ Duy nhất chỗ này có thể check được
      });
    }

    state.allFolders = state.allFolders.concat(data.folders);

    preloadThumbnails(state.allFolders);

    // 🆕 Ghi lại tổng số folders thực tế
    totalFolders = state.allFolders.length;

    // 🆕 Slice phân trang chỉ đúng trang cần render
    const pagedFolders = state.allFolders.slice(
      folderPage * foldersPerPage,
      (folderPage + 1) * foldersPerPage
    );

    renderFolderGrid(pagedFolders);

    // 🆕 update đúng phân trang: dùng tổng số folders
    updateFolderPaginationUI(folderPage, totalFolders, foldersPerPage);
  } else if (data.type === "reader") {
    document.getElementById("loading-overlay")?.classList.remove("hidden");

    const encoded = encodeURIComponent(state.currentPath);
    window.location.href = `/reader.html?path=${encoded}`;
  }
}

/**
 * 📂 Render danh sách folder dưới dạng lưới (grid layout)
 * @param {Array} folders - Danh sách folder có thumbnail
 */
export function renderFolderGrid(folders) {
  // 🎯 Lấy thẻ chính (vùng hiển thị) và reset nội dung cũ
  const app = document.getElementById("app");
  app.innerHTML = "";

  // 📦 Tạo section chính cho phần grid, gán class "grid"
  const section = document.createElement("section");
  section.className = "folder-section grid";

  // 📌 Header cho section: chứa tiêu đề và chức năng back (nếu có)
  const header = document.createElement("div");
  header.className = "folder-section-header";

  // 🏷️ Tạo thẻ tiêu đề
  const title = document.createElement("h3");
  title.className = "folder-section-title";

  // 🧠 Xác định tên folder hiện tại dựa trên path
  const pathParts = state.currentPath.split("/").filter(Boolean); // loại bỏ chuỗi rỗng
  const currentName = pathParts[pathParts.length - 1]; // tên folder hiện tại

  // 🖋️ Gán nội dung tiêu đề: nếu ở thư mục gốc thì ghi "Thư mục", còn lại là tên folder
  title.textContent =
    pathParts.length === 0 ? "📂 Thư mục" : `📁 ${currentName}`;

  // 🔙 Nếu đang trong thư mục con: cho phép click để quay lại thư mục cha
  if (pathParts.length > 0) {
    title.style.cursor = "pointer";
    title.title = "Click để quay về thư mục cha";

    title.onclick = () => {
      const parentPath = pathParts.slice(0, -1).join("/"); // cắt bỏ tên folder hiện tại
      loadFolder(parentPath); // tải lại folder cha
    };
    // ✅ Nếu tên dài → cắt bớt, hiển thị "...", giữ full name trong title
    title.style.maxWidth = "100%";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.whiteSpace = "nowrap";
  }

  // 🧱 Gắn tiêu đề vào header, rồi header vào section
  header.appendChild(title);
  section.appendChild(header);

  // 🗂️ Tạo thẻ div dùng để chứa các folder dưới dạng grid
  const grid = document.createElement("div");
  grid.className = "grid"; // CSS sẽ chia cột tự động

  // 🧩 Tạo từng card folder và thêm vào grid
  folders.forEach((f) => {
    const card = renderFolderCard(f, true); // true = hiển thị lượt xem
    grid.appendChild(card);
  });

  // 🧱 Gắn grid vào section chính, rồi render vào vùng app
  section.appendChild(grid);
  app.appendChild(section);
}
