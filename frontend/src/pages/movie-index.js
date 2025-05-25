import { renderFolderCard } from "/src/components/folderCard.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";
import { getSourceKey } from "/src/core/storage.js";
import { showRandomUpdatedTime } from "/src/core/ui.js"; // ✅ Giống manga

let currentPath = "";

function loadMovieFolder(path = "") {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn phim!");
    window.location.href = "/home.html";
    return;
  }
  currentPath = path;
  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/movie-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => renderMovieGrid(data.folders, path));
}

window.loadMovieFolder = loadMovieFolder;

function renderMovieGrid(list, basePath) {
  const app = document.getElementById("movie-app");
  app.innerHTML = "";

  const parts = basePath ? basePath.split("/").filter(Boolean) : [];

  const title = document.createElement("h2");
  title.className = "folder-section-title";

  if (parts.length === 0) {
    title.textContent = "📂 Danh sách phim";
  } else {
    title.textContent = "📁 " + parts[parts.length - 1];
    title.style.cursor = "pointer";
    title.title = "Quay lại thư mục cha";
    title.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMovieFolder(parent);
    };
  }

  app.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "grid";

  list.forEach((item) => {
    let thumbnailUrl = null;
    if (item.thumbnail) {
      thumbnailUrl = `/video/${item.thumbnail.replace(/\\/g, "/")}`;
    } else {
      thumbnailUrl =
        item.type === "video" || item.type === "file"
          ? "/default/video-thumb.png"
          : "/default/folder-thumb.png";
    }

    let cardData = {
      name: item.name,
      path: item.path,
      thumbnail: thumbnailUrl,
      isSelfReader: false,
    };

    const card = renderFolderCard(cardData, false, false);

    card.onclick = () => {
      if (item.type === "video" || item.type === "file") {
        window.location.href = `/movie-player.html?file=${encodeURIComponent(
          cardData.path
        )}&key=${getSourceKey()}`;
      } else {
        loadMovieFolder(cardData.path);
      }
    };

    grid.appendChild(card);
  });

  app.appendChild(grid);
}

function loadRandomSliders() {
  const sourceKey = getSourceKey();
  loadRandomSection(
    "folder",
    sourceKey,
    "randomFolderSection",
    "🎲 Folder ngẫu nhiên",
    false // ✅ kiểm tra cache trước khi fetch
  );
  loadRandomSection(
    "file",
    sourceKey,
    "randomVideoSection",
    "🎲 Video ngẫu nhiên",
    false // ✅ kiểm tra cache trước khi fetch
  );
}

async function loadRandomSection(
  type,
  sourceKey,
  sectionId,
  title,
  force = false
) {
  if (!sourceKey) {
    console.warn("⚠️ Không có sourceKey – skip random section");
    return;
  }

  const cacheKey = `${
    type === "file" ? "randomVideos" : "randomFolders"
  }-${sourceKey}`;

  // 🆔 Xác định id timestamp theo type
  const tsId =
    type === "file" ? "random-timestamp-video" : "random-timestamp-folder";

  if (!force) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expired = Date.now() - parsed.timestamp > 30 * 60 * 1000;
        if (!expired) {
          renderFolderSlider({
            title,
            folders: parsed.data,
            targetId: sectionId,
            onRefresh: () =>
              loadRandomSection(type, sourceKey, sectionId, title, true),
          });

          const el = document.getElementById(tsId);
          if (el) showRandomUpdatedTime(parsed.timestamp,tsId);
          return;
        }
      } catch {}
    }
  }

  const res = await fetch(
    `/api/video-cache?mode=random&type=${type}&key=${sourceKey}`
  );
  const json = await res.json();
  const folders = Array.isArray(json) ? json : json.folders;
  const now = Date.now();

  // ✅ Ghi vào cache
  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data: folders, timestamp: now })
  );

  // ✅ Ghi randomView giống manga
  localStorage.setItem(
    `randomView::${sourceKey}::1`,
    JSON.stringify({ data: folders })
  );

  renderFolderSlider({
    title,
    folders,
    targetId: sectionId,
    onRefresh: () => loadRandomSection(type, sourceKey, sectionId, title, true),
  });

  const el = document.getElementById(tsId);
  if (el) showRandomUpdatedTime(now, tsId); // ✅ cần truyền id
}

window.addEventListener("DOMContentLoaded", () => {
  loadMovieFolder();
  loadRandomSliders();

  const deleteBtn = document.getElementById("delete-movie-db");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm("Bạn có chắc muốn xoá sạch DB Movie này không?")) return;
      const sourceKey = getSourceKey();
      try {
        await fetch(`/api/reset-movie-db?key=${sourceKey}`, {
          method: "DELETE",
        });
        alert("Đã xoá xong DB Movie! Vào lại sẽ tự scan lại.");
        window.location.reload();
      } catch (err) {
        alert("Lỗi khi xoá DB movie!");
        console.error(err);
      }
    };
  }
});

["randomFolderSection", "randomVideoSection"].forEach((id) => {
  const exist = document.getElementById(id);
  if (!exist) {
    const sec = document.createElement("section");
    sec.id = id;
    document.body.prepend(sec);
  }
});
