// 📁 frontend/src/preload.js

/**
 * 📸 Preload thumbnail images để load nhanh hơn
 * @param {Array} folders - Danh sách folders từ API
 */
const preloaded = new Set();

export function preloadThumbnails(folders = []) {
  const head = document.head || document.getElementsByTagName("head")[0];
  const frag = document.createDocumentFragment();

  folders.forEach((folder) => {
    if (folder.thumbnail && !preloaded.has(folder.thumbnail)) {
      preloaded.add(folder.thumbnail);
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = folder.thumbnail;
      frag.appendChild(link);
    }
  });

  if (frag.childNodes.length) head.appendChild(frag);
}
  