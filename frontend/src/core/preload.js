// 📁 frontend/src/preload.js

/**
 * 📸 Preload thumbnail images để load nhanh hơn
 * @param {Array} folders - Danh sách folders từ API
 */
export function preloadThumbnails(folders = []) {
  const head = document.head || document.getElementsByTagName("head")[0];

  folders.forEach((folder) => {
    if (folder.thumbnail) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = folder.thumbnail;

      // Tránh preload trùng
      if (!head.querySelector(`link[rel="preload"][href="${folder.thumbnail}"]`)) {
        head.appendChild(link);
      }
    }
  });
}
