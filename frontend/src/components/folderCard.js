// 📁 folderCard.js – component dùng chung để hiển thị 1 thẻ folder

import { getSourceKey } from "/src/core/storage.js"; // ✅ gom về 1 dòng import
import {
  getFolderCacheKey,
  getFolderCache,
  setFolderCache,
  getRootFolder,
} from "/src/core/storage.js";

/**
 * Tạo 1 card HTML cho folder (sử dụng cho slider hoặc grid)
 * @param {Object} folder - Thông tin folder (path, name, thumbnail, count, images, isSelfReader, isFavorite)
 * @param {boolean} showViews - Có hiển thị lượt xem không
 * @returns HTMLElement - Thẻ <div class="folder-card">
 */
export function renderFolderCard(folder, showViews = false) {
  const card = document.createElement("div");
  card.className = "folder-card";

  // Ảnh thumbnail (nếu có)
  let thumbContent;
  if (folder.thumbnail) {
    const img = document.createElement("img");
    img.src = folder.thumbnail;
    img.alt = folder.name;
    img.loading = "lazy";
    thumbContent = img;
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "folder-thumb-placeholder";
    placeholder.textContent = "Không có ảnh";
    thumbContent = placeholder;
  }

  let displayName = folder.name;
  if (folder.name === "__self__") {
    const parts = folder.path.split("/");
    displayName = parts.at(-2) || "Ảnh";
  }
  // HTML bên trong card
  const thumbWrapper = document.createElement("div");
  thumbWrapper.className = "folder-thumb";
  thumbWrapper.appendChild(thumbContent);

  if (showViews && folder.count) {
    const views = document.createElement("div");
    views.className = "folder-views";
    views.textContent = `👁 ${folder.count}`;
    thumbWrapper.appendChild(views);
  }

  const favDiv = document.createElement("div");
  favDiv.className = "folder-fav" + (folder.isFavorite ? " active" : "");
  favDiv.title = folder.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích";
  favDiv.textContent = folder.isFavorite ? "❤️" : "🤍";
  thumbWrapper.appendChild(favDiv);

  const titleDiv = document.createElement("div");
  titleDiv.className = "folder-title";
  titleDiv.textContent = displayName;

  card.append(thumbWrapper, titleDiv);

  // Xử lý click vào ảnh (tránh click vào nút yêu thích)
  card.onclick = (e) => {
    if (e.target.classList.contains("folder-fav")) return;

    if (folder.isSelfReader && folder.images) {
      const encoded = encodeURIComponent(folder.path);
      window.location.href = `/manga/reader.html?path=${encoded}`;
    } else {
      window.loadFolder?.(folder.path);
    }
  };

  // Xử lý toggle yêu thích
  const favBtn = card.querySelector(".folder-fav");
  favBtn.onclick = async (e) => {
    e.stopPropagation();
    const sourceKey = getSourceKey();
    const rootFolder = getRootFolder(); // 👈 Thêm dòng này

    const newVal = !folder.isFavorite;
    folder.isFavorite = newVal;
    favBtn.classList.toggle("active", newVal);
    favBtn.textContent = newVal ? "❤️" : "🤍";
    favBtn.title = newVal ? "Bỏ yêu thích" : "Thêm yêu thích";

    try {
      const isMovie = sourceKey?.startsWith("V_"); // Nếu key là movie
      // const body = isMovie
      // ? { key: sourceKey, path: folder.path, value: newVal } // 🎬 movie
      // : { dbkey: sourceKey, path: folder.path, value: newVal }; // 📚 manga
      await fetch(isMovie ? "/api/movie/favorite-movie" : "/api/manga/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbkey: sourceKey,
          path: folder.path,
          value: newVal,
        }),
      });

      // Cập nhật cache cho cả folder hiện tại và folder gốc
      updateFavoriteEverywhere(sourceKey, rootFolder, folder.path, newVal);
    } catch (err) {
      console.warn("❌ Không thể lưu yêu thích:", err);
    }
  };

  return card;
}


export function updateFavoriteEverywhere(sourceKey, rootFolder, folderPath, newVal) {
  const isMovie = sourceKey?.startsWith("V_");

  // 📁 folderCard.js – trong updateFavoriteEverywhere()

  // 📦 Nếu là movie ➜ update movieCache
  if (isMovie) {
    const prefix = `movieCache::${sourceKey}::`;
    for (const key in localStorage) {
      if (key.startsWith(prefix)) {
        try {
          const raw = localStorage.getItem(key);
          const parsed = JSON.parse(raw);
          let changed = false;
          if (Array.isArray(parsed.data)) {
            for (const f of parsed.data) {
              if (f.path === folderPath) {
                f.isFavorite = newVal;
                changed = true;
              }
            }
          }
          if (changed) {
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        } catch (err) {
          console.warn("❌ Không thể update movieCache:", err);
        }
      }
    }

    // 🔁 Thêm xử lý random cache
    ["randomFolders", "randomVideos"].forEach((prefix) => {
      const cacheKey = `${prefix}-${sourceKey}`;
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        let changed = false;
        if (Array.isArray(parsed.data)) {
          for (const f of parsed.data) {
            if (f.path === folderPath) {
              f.isFavorite = newVal;
              changed = true;
            }
          }
        }
        if (changed) {
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch (err) {
        console.warn("❌ Không thể update random cache:", err);
      }
    });

    return;
  }

  // 📚 Nếu là manga ➜ giữ nguyên logic cũ
  const prefix = `folderCache::${sourceKey}::${rootFolder}`;
  for (const key in localStorage) {
    if (key.startsWith(prefix)) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        let changed = false;
        if (parsed.data && parsed.data.folders) {
          for (const f of parsed.data.folders) {
            if (f.path === folderPath) {
              f.isFavorite = newVal;
              changed = true;
            }
          }
        }
        if (parsed.data?.images && folderPath.endsWith("/__self__")) {
          parsed.data.isFavorite = newVal;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (err) {
        console.warn("❌ Không thể update folderCache:", err);
      }
    }
  }

  // ✅ Update recentViewed (manga)
  try {
    const recentKey = `recentViewed::${rootFolder}::${rootFolder}`;
    const raw = localStorage.getItem(recentKey);
    if (raw) {
      const list = JSON.parse(raw);
      let changed = false;
      for (const item of list) {
        if (item.path === folderPath) {
          item.isFavorite = newVal;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(recentKey, JSON.stringify(list));
      }
    }
  } catch (err) {
    console.warn("❌ Không thể update recentViewed:", err);
  }
}
