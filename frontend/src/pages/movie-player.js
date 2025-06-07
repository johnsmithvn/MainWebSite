import {
  getSourceKey,
  
  getMovieCache,
} from "/src/core/storage.js";
import { updateFavoriteEverywhere } from "/src/components/folderCard.js";
import { getRootFolder } from "/src/core/storage.js";
import {
  showToast,
  toggleSearchBar,
  renderRandomBanner,
  showRandomUpdatedTime,
  filterMovie,
  setupMovieSidebar,
} from "/src/core/ui.js";
import {
  loadRandomSliders,
  setupRandomSectionsIfMissing,
} from "/src/components/folderSlider.js";
import { saveRecentViewedVideo } from "/src/core/storage.js";

const urlParams = new URLSearchParams(window.location.search);
const file = urlParams.get("file");
const sourceKey = getSourceKey();
const videoEl = document.getElementById("video-player");
const favBtn = document.getElementById("fav-btn");

if (!file || !sourceKey) {
  showToast("❌ Thiếu file hoặc sourceKey");
  throw new Error("Missing file or sourceKey");
}

const src = `/api/movie/video?key=${sourceKey}&file=${encodeURIComponent(
  file
)}`;
videoEl.src = src;

// 📁 Extract folder info
const parts = file.split("/").filter(Boolean);
const videoName = parts[parts.length - 1];
document.getElementById("video-name").textContent = videoName;

const folderPath = parts.slice(0, -1).join("/");
const folderTitle = document.getElementById("movie-folder-name");
folderTitle.textContent = parts.at(-2) || "Home";
folderTitle.title = folderPath || "Quay lại thư mục";
folderTitle.classList.add("clickable-folder");

// 👉 Click quay lại folder cha
folderTitle.onclick = () => {
  const parentPath = folderPath;
  const target = parentPath
    ? `/movie-index.html?path=${encodeURIComponent(parentPath)}`
    : "/movie-index.html";
  window.location.href = target;
};

// ❤️ Yêu thích toggle
let isFavorite = false;

async function checkFavorite() {
  try {
    const res = await fetch(`/api/movie/favorite-movie?key=${sourceKey}`);
    const data = await res.json();
    const found = data.find((v) => v.path === file);
    isFavorite = !!found;
    updateFavBtn();
  } catch (err) {
    console.warn("❌ Failed to check favorite:", err);
  }
}

function updateFavBtn() {
  favBtn.textContent = isFavorite ? "❤️" : "🤍";
  favBtn.title = isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích";
}

favBtn.onclick = async () => {
  isFavorite = !isFavorite;
  updateFavBtn();

  try {
    await fetch("/api/movie/favorite-movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbkey: sourceKey, path: file, value: isFavorite }), // ✅ sửa key → dbkey
    });

    // ✅ Đồng bộ cache
    updateFavoriteEverywhere(sourceKey, getRootFolder(), file, isFavorite);
  } catch (err) {
    console.error("❌ Failed to toggle favorite:", err);
    showToast("❌ Lỗi khi toggle yêu thích");
  }
};

// 📈 Tăng view
fetch("/api/increase-view/movie", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: sourceKey, path: file }),
}).catch((err) => {
  console.error("❌ Failed to increase view:", err);
});

let thumb = null;

const cached = getMovieCache(sourceKey, folderPath);
if (cached?.data?.length) {
  const fileName = file.split("/").pop();
  const found = cached.data.find(
    (v) => v.path === file || v.name === fileName || file.endsWith(v.path)
  );

  if (found?.thumbnail) {
    const folderPrefix = file.split("/").slice(0, -1).join("/");
    thumb = `/video/${
      folderPrefix ? folderPrefix + "/" : ""
    }${found.thumbnail.replace(/\\/g, "/")}`;
  } else {
    // fallback jpg cùng folder
    const folderPrefix = file.split("/").slice(0, -1).join("/");
    const fileBase = file
      .split("/")
      .pop()
      .replace(/\.(mp4|mkv|ts|avi|mov|webm)$/i, "");
    thumb = `/video/${
      folderPrefix ? folderPrefix + "/" : ""
    }.thumbnail/${fileBase}.jpg`;
  }
}

// fallback jpg
if (!thumb) {
  thumb = file.replace(/\.(mp4|mkv|ts|avi|mov|webm)$/i, ".jpg");
}

saveRecentViewedVideo({
  name: videoName,
  path: file,
  thumbnail: thumb, // ✅ raw path
  type: "video",
});

// 🔍 Gắn search bar
document
  .getElementById("searchToggle")
  ?.addEventListener("click", toggleSearchBar);

// 🔁 Gọi random video
loadRandomSection();

async function loadRandomSection(force = false) {
  const cacheKey = `randomVideos-${sourceKey}`;
  const tsId = "random-timestamp-video";

  if (!force) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expired = Date.now() - parsed.timestamp > 30 * 60 * 1000;
        if (!expired) {
          renderRandomBanner(parsed.data);
          showRandomUpdatedTime(parsed.timestamp, tsId);
          return;
        }
      } catch {}
    }
  }

  try {
    const res = await fetch(
      `/api/movie/video-cache?mode=random&type=file&key=${sourceKey}`
    );
    const data = await res.json();
    const folders = Array.isArray(data) ? data : data.folders;
    const now = Date.now();

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: folders, timestamp: now })
    );
    renderRandomBanner(folders);
    showRandomUpdatedTime(now, tsId);
  } catch (err) {
    console.error("❌ Lỗi random video:", err);
  }
}

// ✅ Khởi động
checkFavorite();

document
  .getElementById("floatingSearchInput")
  ?.addEventListener("input", filterMovie);

document
  .getElementById("searchToggle")
  ?.addEventListener("click", toggleSearchBar);

// 👉 Tạo section nếu thiếu
setupRandomSectionsIfMissing();

// 👉 Hiển thị 2 random slider
loadRandomSliders();

// 🧭 Load video trước/sau cùng thư mục
loadSiblingVideos(folderPath, file);

async function loadSiblingVideos(folderPath, currentFile) {
  let videoList = [];

  // ⚡ Ưu tiên dùng cache nếu có
  const cached = getMovieCache(sourceKey, folderPath);
  if (cached && Array.isArray(cached.data)) {
    videoList = cached.data;
  } else {
    try {
      const res = await fetch(
        `/api/movie/movie-folder?key=${sourceKey}&path=${encodeURIComponent(
          folderPath
        )}`
      );
      const data = await res.json();
      videoList = data.folders || [];
    } catch (err) {
      console.error("❌ Lỗi khi load thư mục:", err);
      return;
    }
  }

  // 🎬 Chỉ lấy file video
  const videosOnly = videoList.filter(
    (v) => v.type === "video" || v.type === "file"
  );
  const index = videosOnly.findIndex((v) => v.path === currentFile);

  if (index === -1) {
    showToast("❌ Không tìm thấy video hiện tại trong thư mục");
    return;
  }

  const prev = videosOnly[index - 1];
  const next = videosOnly[index + 1];

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  btnPrev.disabled = !prev;
  btnNext.disabled = !next;

  if (prev) {
    btnPrev.onclick = () => {
      window.location.href = `/movie-player.html?file=${encodeURIComponent(
        prev.path
      )}&key=${sourceKey}`;
    };
  }

  if (next) {
    btnNext.onclick = () => {
      window.location.href = `/movie-player.html?file=${encodeURIComponent(
        next.path
      )}&key=${sourceKey}`;
    };
  }
  // 👉 Hiển thị danh sách tập
  const episodeList = document.getElementById("video-episode-list");
  episodeList.innerHTML = ""; // clear cũ

  videosOnly.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.textContent = `Tập ${idx + 1}`;
    if (item.path === currentFile) btn.classList.add("active");

    btn.onclick = () => {
      if (item.path === currentFile) return;
      window.location.href = `/movie-player.html?file=${encodeURIComponent(
        item.path
      )}&key=${sourceKey}`;
    };

    episodeList.appendChild(btn);
  });
}

document.getElementById("btn-random-jump").onclick = async () => {
  try {
    const res = await fetch(
      `/api/movie/video-cache?mode=random&type=file&key=${sourceKey}`
    );
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.folders;

    const videoOnly = list.filter(
      (v) => v.type === "video" || v.type === "file"
    );
    if (!videoOnly.length) return showToast("❌ Không có video ngẫu nhiên");

    const random = videoOnly[Math.floor(Math.random() * videoOnly.length)];
    if (!random?.path) return showToast("❌ Video lỗi");

    window.location.href = `/movie-player.html?file=${encodeURIComponent(
      random.path
    )}&key=${sourceKey}`;
  } catch (err) {
    console.error("❌ Lỗi khi random jump:", err);
    showToast("❌ Không thể tải video ngẫu nhiên");
  }
};

document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar-menu");
  if (sidebar) sidebar.classList.toggle("active");
});

setupMovieSidebar(); // ✅ render nội dung sidebar (quét, reset DB, v.v.)

// ⚙️ Double tap để tua 10s
const SKIP_SECONDS = 10;

// ⚡ Double tap trái/phải để tua đúng 10s
videoEl.addEventListener("dblclick", (e) => {
  const x = e.clientX;
  const width = videoEl.clientWidth;

  if (x < width / 2) {
    videoEl.currentTime = Math.max(0, videoEl.currentTime - SKIP_SECONDS);
    showToast(`⏪ Lùi ${SKIP_SECONDS}s`);
  } else {
    videoEl.currentTime = Math.min(
      videoEl.duration,
      videoEl.currentTime + SKIP_SECONDS
    );
    showToast(`⏩ Tua ${SKIP_SECONDS}s`);
  }
});

// 🎯 Gắn gesture cho video
const hammer = new Hammer(videoEl);
hammer.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });

let panDeltaX = 0;

hammer.on("pan", (ev) => {
  panDeltaX = ev.deltaX;

  // 👉 Optional: hiệu ứng preview hoặc bar (nếu bạn muốn)
});

hammer.on("panend", () => {
  const skipSeconds = Math.floor(panDeltaX / 10); // 10px = 1s
  if (skipSeconds !== 0) {
    videoEl.currentTime = Math.max(
      0,
      Math.min(videoEl.duration, videoEl.currentTime + skipSeconds)
    );
    showToast(`${skipSeconds > 0 ? "⏩" : "⏪"} ${Math.abs(skipSeconds)}s`);
  }
  panDeltaX = 0;
});
// // 📱 Vuốt ngang để tua (mobile only)
// let isDragging = false;
// let startX = 0;
// let lastDelta = 0;

// videoEl.addEventListener("touchstart", (e) => {
//   if (e.touches.length !== 1) return;
//   isDragging = true;
//   startX = e.touches[0].clientX;
//   lastDelta = 0;
// }, { passive: true });

// videoEl.addEventListener("touchmove", (e) => {
//   if (!isDragging || e.touches.length !== 1) return;
//   const deltaX = e.touches[0].clientX - startX;
//   lastDelta = deltaX;
// }, { passive: true });

// videoEl.addEventListener("touchend", () => {
//   if (!isDragging) return;
//   isDragging = false;

//   const skipSeconds = Math.floor(lastDelta / 10); // 10px = 1s
//   if (skipSeconds !== 0) {
//     videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, videoEl.currentTime + skipSeconds));
//     showToast(`${skipSeconds > 0 ? "⏩" : "⏪"} ${Math.abs(skipSeconds)}s`);
//   }
// });

// 👉 Nút "Mở bằng ExoPlayer" (nếu app hỗ trợ)
document.getElementById("btn-open-exoplayer")?.addEventListener("click", () => {
  const videoUrl = `${
    location.origin
  }/api/movie/video?key=${sourceKey}&file=${encodeURIComponent(file)}`;
  if (window.Android?.openExoPlayer) {
    window.Android.openExoPlayer(videoUrl);
  } else {
    showToast("❌ Ứng dụng không hỗ trợ ExoPlayer");
  }
});
