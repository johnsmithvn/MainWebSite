// 📁 frontend/src/pages/music/player.js

// 📦 Import các hàm cần thiết
import { getSourceKey,saveRecentViewedMusic  } from "/src/core/storage.js";
import { showToast, goHome } from "/src/core/ui.js";
import {
  toggleSearchBar,
  filterMusic,
  setupMusicSidebar,
} from "/src/core/ui.js";
import { buildThumbnailUrl } from "/src/core/ui.js";
import { showPlaylistMenu } from "/src/components/music/playlistMenu.js";
import { renderFolderSlider } from "/src/components/folderSlider.js";
import { isSecureKey, getToken, showLoginModal } from "/src/core/security.js";

window.goHome = goHome;

// ========================
// Hàm render info nổi bật như Spotify
// ========================
function renderNowPlayingInfo(track) {
  // Lấy element để render info
  const el = document.getElementById("now-playing-info");
  if (!el) return;
  if (!track) {
    el.innerHTML = "";
    return;
  }
  // Xử lý đường dẫn thumbnail
  let thumb = buildThumbnailUrl(track, "music");

  // Render info nổi bật giống Spotify, THÊM NÚT "+"
  el.innerHTML = "";

  const cover = document.createElement("div");
  cover.className = "now-playing-cover";

  const img = document.createElement("img");
  img.className = "now-playing-thumb";
  img.src = thumb;
  img.alt = "thumb";

  const meta = document.createElement("div");
  meta.className = "now-playing-meta";

  const titleDiv = document.createElement("div");
  titleDiv.className = "now-title";

  const titleText = document.createElement("span");
  titleText.textContent = track.name;

  const addBtn = document.createElement("button");
  addBtn.id = "btn-add-playlist";
  addBtn.title = "Thêm vào playlist";
  addBtn.style.marginLeft = "8px";
  addBtn.textContent = "+";

  const thumbBtn = document.createElement("button");
  thumbBtn.id = "btn-add-thumb";
  thumbBtn.title = "Dùng thumbnail này";
  thumbBtn.style.marginLeft = "6px";
  thumbBtn.textContent = "🖼️";

  titleDiv.append(titleText, addBtn, thumbBtn);

  const artistDiv = document.createElement("div");
  artistDiv.className = "now-artist";
  artistDiv.textContent = track.artist || "Unknown Artist";

  const extraDiv = document.createElement("div");
  extraDiv.className = "now-extra";
  const viewsSpan = document.createElement("span");
  viewsSpan.textContent = `👁️ ${track.viewCount || 0}`;
  const albumSpan = document.createElement("span");
  if (track.album) albumSpan.textContent = `• ${track.album}`;
  extraDiv.append(viewsSpan, albumSpan);

  meta.append(titleDiv, artistDiv, extraDiv);
  cover.append(img, meta);
  el.appendChild(cover);

  // Gắn sự kiện mở popup playlist
  document.getElementById("btn-add-playlist")?.addEventListener("click", (e) => {
    e.stopPropagation();
    showPlaylistMenu(track.path, track.name, e.target);
  });
  document.getElementById("btn-add-thumb")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      await fetch("/api/music/extract-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: sourceKey, path: track.path }),
      });
      if (playlistId) {
        await fetch("/api/music/playlist-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: sourceKey, playlistId, srcPath: track.path }),
        });
        showToast("✅ Đã đặt thumbnail cho playlist");
        loadPlaylistSlider();
      } else {
        await fetch("/api/music/folder-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: sourceKey, folderPath, srcPath: track.path }),
        });
        showToast("✅ Đã đặt thumbnail cho thư mục");
      }
    } catch {
      showToast("❌ Lỗi đặt thumbnail");
    }
  });
}
// ========================
// SETUP UI CƠ BẢN
// ========================
setupMusicSidebar();
document
  .getElementById("searchToggle")
  ?.addEventListener("click", toggleSearchBar);
document
  .getElementById("floatingSearchInput")
  ?.addEventListener("input", filterMusic);
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar-menu")?.classList.toggle("active");
});

// ========================
// XỬ LÝ BIẾN TOÀN CỤC
// ========================
const urlParams = new URLSearchParams(window.location.search);
const currentFile = urlParams.get("file");
const playlistId = urlParams.get("playlist");
let sourceKey = urlParams.get("key") || getSourceKey(); // Ưu tiên lấy từ URL
if (urlParams.get("key")) localStorage.setItem("sourceKey", sourceKey);

(async () => {
  if (isSecureKey(sourceKey) && !getToken()) {
    const ok = await showLoginModal(sourceKey);
    if (!ok) {
      goHome();
      return;
    }
  }
})();

if (!sourceKey) {
  showToast("❌ Thiếu sourceKey");
  throw new Error("Missing sourceKey");
}
if (!currentFile && !playlistId) {
  showToast("❌ Thiếu file hoặc playlist");
  throw new Error("Missing file or playlistId");
}

// Khởi tạo DOM element
const audioEl = document.getElementById("audio-player");
const nowPlayingEl = document.getElementById("now-playing");
const folderTitleEl = document.getElementById("folder-title");
const folderTrackCountEl = document.getElementById("folder-track-count");
// Nếu là file riêng lẻ → xác định folder

let fileParts = [];
let folderPath = "";
let currentFileName = "";

if (currentFile) {
  fileParts = currentFile.split("/").filter(Boolean);
  folderPath = fileParts.slice(0, -1).join("/");
  currentFileName = fileParts.at(-1);
}

function updateFolderHeader() {
  if (playlistId) return; // Không làm gì nếu là playlist, vì đã gán ở trên
  if (folderPath) {
    const folderName = folderPath.split("/").pop() || "Root";
    folderTitleEl.textContent = `📁 ${folderName}`;
    folderTitleEl.classList.add("clickable");
    folderTitleEl.title = "Quay lại thư mục này";
    folderTitleEl.onclick = () => {
      window.location.href = `/music/index.html?path=${encodeURIComponent(
        folderPath
      )}`;
    };
  } else {
    folderTitleEl.textContent = "📁 Playlist";
    folderTitleEl.classList.remove("clickable");
    folderTitleEl.onclick = null;
  }
}

// Danh sách bài + chỉ số hiện tại
let audioList = [];
let currentIndex = -1;

// ========================
// HÀM LOAD NHẠC
// ========================

// Load nhạc từ folder (khi mở từng file)
async function loadFolderSongs() {
  try {
    const res = await fetch(
      `/api/music/music-folder?key=${sourceKey}&path=${encodeURIComponent(
        folderPath
      )}`
    );
    const data = await res.json();

    audioList = (data.folders || []).filter(
      (f) => f.type === "audio" || f.type === "file"
    );
    currentIndex = audioList.findIndex((f) => f.path === currentFile);

    renderTrackList();
    updateFolderHeader(); // ⭐ GỌI NGAY SAU KHI CÓ DỮ LIỆU MỚI

    if (currentIndex >= 0) {
      playAtIndex(currentIndex);
    } else {
      showToast("❌ Không tìm thấy bài hiện tại");
    }
  } catch (err) {
    console.error("❌ Lỗi khi load thư mục:", err);
    showToast("Lỗi khi tải danh sách bài hát");
  }
}

// Load nhạc từ playlist
async function loadPlaylistSongs(id) {
  try {
    const res = await fetch(`/api/music/playlist/${id}?key=${sourceKey}`);
    const data = await res.json();

    // Lấy tên playlist từ API trả về (data.name)
    audioList = (data.tracks || []).filter(
      (f) => f.type === "audio" || f.type === "file"
    );
    currentIndex = 0;

    renderTrackList();
    // Gán tên vào header luôn ở đây, KHÔNG gọi updateFolderHeader khi là playlist
    folderTitleEl.textContent = `🎵 ${data.name || "Playlist"}`;
    folderTitleEl.classList.add("playlist-title");
    folderTitleEl.classList.remove("clickable");
    folderTitleEl.onclick = null;

    folderTrackCountEl.textContent = `${audioList.length} tracks`;

    playAtIndex(currentIndex);
  } catch (err) {
    showToast("❌ Không thể load playlist");
    console.error(err);
  }
}

// ========================
// RENDER DANH SÁCH TRACK
// ========================
function renderTrackList() {
  const tbody = document.getElementById("track-body");
  tbody.innerHTML = "";

  audioList.forEach((item, index) => {
    const tr = document.createElement("tr");
    // Lấy index thực tế của bài đang play
    let realPlayingIndex;
    if (isShuffle && shuffleOrder.length === audioList.length) {
      realPlayingIndex = shuffleOrder[currentIndex];
    } else {
      realPlayingIndex = currentIndex;
    }
    tr.className = index === realPlayingIndex ? "playing" : "";

    const thumb = buildThumbnailUrl(item, "music");
    const tdSong = document.createElement("td");
    const flexDiv = document.createElement("div");
    flexDiv.className = "track-flex";

    const img = document.createElement("img");
    img.className = "track-thumb";
    img.src = thumb;
    img.alt = "thumb";

    const infoDiv = document.createElement("div");
    infoDiv.className = "track-info";

    const titleDiv = document.createElement("div");
    titleDiv.className = "track-title";
    titleDiv.textContent = item.name;

    const artistDiv = document.createElement("div");
    artistDiv.className = "track-artist";
    artistDiv.textContent = item.artist || "Unknown";

    infoDiv.append(titleDiv, artistDiv);
    flexDiv.append(img, infoDiv);
    tdSong.appendChild(flexDiv);
    const tdAlbum = document.createElement("td");
    tdAlbum.textContent = item.album || "Unknown";

    const folderParts = item.path?.split("/").filter(Boolean);
    const folderPath =
      folderParts.length > 1 ? folderParts.slice(0, -1).join("/") : "";

    const tdFolder = document.createElement("td");
    tdFolder.textContent = folderPath || "Root";
    tdFolder.classList.add("clickable-folder");

    if (folderPath) {
      tdFolder.style.color = "#1db954";
      tdFolder.style.cursor = "pointer";
      tdFolder.title = "Click để mở thư mục";
      tdFolder.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/music/index.html?path=${encodeURIComponent(
          folderPath
        )}`;
      };
    }

    const tdViews = document.createElement("td");
    tdViews.textContent = item.viewCount || 0;

    const tdDuration = document.createElement("td");
    tdDuration.textContent = formatDuration(item.duration);
    tdDuration.className = "track-duration";

    let clickIndex = index;
    if (isShuffle && shuffleOrder.length === audioList.length) {
      // Tìm vị trí index này trong shuffleOrder để chuyển sang đúng bài
      clickIndex = shuffleOrder.findIndex((realIdx) => realIdx === index);
    }
    tr.onclick = () => playAtIndex(clickIndex);
    tr.append(tdSong, tdAlbum, tdFolder, tdViews, tdDuration);
    tbody.appendChild(tr);
  });

  folderTrackCountEl.textContent = `${audioList.length} tracks`;
}

// ========================
// PHÁT NHẠC & UPDATE INFO (CHỈ GIỮ DUY NHẤT BẢN DƯỚI)
// ========================
function playAtIndex(index) {
  if (!audioList.length) return;
  // Xử lý shuffle
  let realIdx = isShuffle ? shuffleOrder[index] : index;
  if (realIdx === undefined) realIdx = index;
  currentIndex = index;

  const file = audioList[realIdx];
  const token = getToken();
  const src = `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(
    file.path
  )}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

  audioEl.src = src;
  audioEl.play().catch(() => {
    showToast("⚠️ Không thể phát bài hát");
  });

  nowPlayingEl.textContent = `🎵 ${file.name}`;
  renderNowPlayingInfo(file);
  updateTrackHighlight();
  updateSeekbar();

  // =========== Tăng view ==============
  fetch("/api/increase-view/music", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: sourceKey, path: file.path }),
  }).catch(() => {});
    console.log( file);
  // ====== Lưu vào recent view nhạc ======
  saveRecentViewedMusic({
    name: file.name,
    path: file.path,
    thumbnail: file.thumbnail, // nếu có field này từ API/cache, hoặc:
    // thumbnail: buildThumbnailUrl(file, "music"), // cũng được, FE sẽ tự build đúng sau
    type: "audio",
    artist: file.artist || "",
    album: file.album || "",
  });
}

// ========================
// Cập nhật trạng thái dòng đang phát
// ========================
function updateTrackHighlight() {
  let realPlayingIndex;
  if (isShuffle && shuffleOrder.length === audioList.length) {
    realPlayingIndex = shuffleOrder[currentIndex];
  } else {
    realPlayingIndex = currentIndex;
  }
  document.querySelectorAll("#track-body tr").forEach((row, idx) => {
    row.classList.toggle("playing", idx === realPlayingIndex);
  });
}

// ========================
// BUTTON ĐIỀU KHIỂN & LOGIC SHUFFLE, REPEAT, SEEK
// ========================
let isRepeat = false;
let isShuffle = false;
let shuffleOrder = [];

const repeatBtn = document.getElementById("btn-repeat");
const seekbar = document.getElementById("seekbar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const shuffleBtn = document.getElementById("btn-shuffle");
const playBtn = document.getElementById("btn-play");

repeatBtn.onclick = () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle("active", isRepeat);
};

function shuffleArray(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Update seekbar mỗi khi play bài mới
function updateSeekbar() {
  seekbar.max = audioEl.duration || 1;
  seekbar.value = audioEl.currentTime || 0;
  currentTimeEl.textContent = formatDuration(audioEl.currentTime);
  durationEl.textContent = formatDuration(audioEl.duration);
}
audioEl.addEventListener("timeupdate", updateSeekbar);
audioEl.addEventListener("loadedmetadata", updateSeekbar);
seekbar.addEventListener("input", () => {
  audioEl.currentTime = seekbar.value;
  currentTimeEl.textContent = formatDuration(audioEl.currentTime);
});

// Play/Pause UI đồng bộ
audioEl.addEventListener("play", () => {
  playBtn.textContent = "⏸";
});
audioEl.addEventListener("pause", () => {
  playBtn.textContent = "▶️";
});

// Shuffle
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  if (isShuffle) {
    // Shuffle toàn bộ nhưng không replay lại bài hiện tại
    const realPlaying =
      isShuffle && shuffleOrder.length === audioList.length
        ? shuffleOrder[currentIndex]
        : currentIndex;
    shuffleOrder = [realPlaying].concat(
      shuffleArray(
        [...Array(audioList.length).keys()].filter((i) => i !== realPlaying)
      )
    );
    // Tìm lại vị trí bài hiện tại trong shuffleOrder (luôn là 0)
    currentIndex = 0;
  } else {
    // Khi tắt shuffle, lấy index thực của bài đang play về lại index thường
    if (shuffleOrder.length === audioList.length) {
      const realIdx = shuffleOrder[currentIndex];
      currentIndex = realIdx;
    }
    shuffleOrder = [];
  }
  // KHÔNG gọi playAtIndex(currentIndex) ở đây!
  // -> Không replay lại nhạc!
  updateTrackHighlight();
};

// Prev/Next/Play
document.getElementById("btn-prev").onclick = () => {
  if (!audioList.length) return;
  if (currentIndex > 0) playAtIndex(currentIndex - 1);
  else playAtIndex(audioList.length - 1);
};
document.getElementById("btn-next").onclick = () => {
  if (!audioList.length) return;
  if (currentIndex + 1 < audioList.length) playAtIndex(currentIndex + 1);
  else playAtIndex(0);
};
playBtn.onclick = () => {
  if (audioEl.paused) audioEl.play();
  else audioEl.pause();
};

// Ended: Repeat hoặc next/shuffle
audioEl.addEventListener("ended", () => {
  if (isRepeat) playAtIndex(currentIndex);
  else if (currentIndex + 1 < audioList.length) playAtIndex(currentIndex + 1);
  else playAtIndex(0);
});

// ========================
// HÀM XỬ LÝ THỜI LƯỢNG
// ========================
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "--:--";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ========================
// KHỞI TẠO GỌI CHƯƠNG TRÌNH
// ========================
if (playlistId) {
  loadPlaylistSongs(playlistId);
} else {
  loadFolderSongs();
}

loadPlaylistSlider();

async function loadPlaylistSlider() {
  const key = getSourceKey();
  if (!key) return;

  const container = document.getElementById("section-playlists");
  if (!container) return;

  container.innerHTML = "<p>⏳ Đang tải playlist...</p>";

  try {
    const res = await fetch(`/api/music/playlists?key=${key}`);
    const playlists = await res.json();

    if (!Array.isArray(playlists) || playlists.length === 0) {
      container.innerHTML = "<p>😅 Chưa có playlist nào</p>";
      return;
    }

    const withThumbs = await Promise.all(
      playlists.map(async (p) => {
        if (p.thumbnail) {
          return {
            ...p,
            path: p.id.toString(),
            thumbnail: buildThumbnailUrl({ thumbnail: p.thumbnail, path: "" }, "music"),
            isPlaylist: true,
            type: "folder",
          };
        }
        try {
          const r = await fetch(`/api/music/playlist/${p.id}?key=${key}`);
          const detail = await r.json();
          const first = detail.tracks?.[0];
          const thumb = first
            ? buildThumbnailUrl(first, "music")
            : "/default/folder-thumb.png";
          return {
            ...p,
            path: p.id.toString(),
            thumbnail: thumb,
            isPlaylist: true,
            type: "folder",
          };
        } catch {
          return {
            ...p,
            path: p.id.toString(),
            thumbnail: "/default/folder-thumb.png",
            isPlaylist: true,
            type: "folder",
          };
        }
      })
    );

    renderFolderSlider({
      title: "🎶 Playlist",
      folders: withThumbs,
      targetId: "section-playlists",
    });
  } catch (err) {
    console.error("loadPlaylistSlider error", err);
    container.innerHTML = "<p>❌ Lỗi tải playlist</p>";
  }
}
