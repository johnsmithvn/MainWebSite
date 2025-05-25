/**
 * ⚡ Preload ảnh quanh currentPage
 */
export function preloadAroundPage(currentPage, images, range = 10) {
  // 🧹 Xoá preload ảnh cũ
  document.querySelectorAll('link[rel="preload"][as="image"]').forEach((link) => {
    link.remove();
  });

  // 🔁 Thêm preload mới quanh currentPage
  const start = Math.max(0, currentPage - range);
  const end = Math.min(images.length - 1, currentPage + range);

  for (let i = start; i <= end; i++) {
    if (i === currentPage) continue;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = images[i];
    document.head.appendChild(link);
  }
}

/**
 * 🧮 Cập nhật Trang X/Y trong reader-footer
 */
export function updateReaderPageInfo(currentPage, totalPages) {
  const pageInfo = document.getElementById("page-info");
  if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
}

/**
 * 🔢 Tạo input nhập trang cho horizontal mode
 */
export function showJumpPageInput(currentPage, totalPages, onChange) {
  const pageInfo = document.getElementById("page-info");
  if (!pageInfo) return;

  const input = document.createElement("input");
  input.type = "number";
  input.min = 1;
  input.max = totalPages;
  input.placeholder = "Nhập trang...";
  input.style.width = "60px";
  input.style.fontSize = "14px";
  input.style.textAlign = "center";

  pageInfo.innerHTML = "";
  pageInfo.appendChild(input);
  input.focus();

  input.onblur = input.onchange = () => {
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onChange(page - 1); // chỉ gọi callback, việc update giao diện để reader lo
    }
  };
}

/**
 * 👆 Toggle hiển/ẩn header và reader-footer
 * Dùng chung cho mọi chế độ reader (horizontal, scroll...)
 */
/**
 * Toggle visibility of UI elements by their IDs.
 * @param {string[]} elementIds - Array of element IDs to toggle.
 * @param {string} action - Action to perform: "add", "remove", or "toggle".
 */
const UI_ELEMENTS = ["site-header", "reader-footer", "readerModeButton"];

function updateUIVisibility(elementIds, action) {
  elementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList[action]("hidden");
    }
  });
}
export function toggleReaderUI() {
  updateUIVisibility(UI_ELEMENTS, "toggle");
}
/**
 * 👆 Show lại UI nếu đang ẩn
 */
export function showReaderUI() {
  updateUIVisibility(UI_ELEMENTS, "remove");
}

/**
 * 👇 Hide toàn bộ UI để tập trung đọc
 */
export function hideReaderUI() {
  updateUIVisibility(UI_ELEMENTS, "add");
}
