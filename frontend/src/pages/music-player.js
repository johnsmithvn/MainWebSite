// 📁 frontend/src/pages/music-player.js

// 📦 Import các hàm cần thiết
import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";
import { toggleSearchBar, filterMusic, setupMusicSidebar } from "/src/core/ui.js";

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
  let folderPrefix = track.path?.split("/").slice(0, -1).join("/");
  let thumb = track.thumbnail
    ? `/audio/${folderPrefix ? folderPrefix + "/" : ""}${track.thumbnail.replace(/\\/g, "/")}`
    : "/default/music-thumb.png";

  // Render info nổi bật giống Spotify
  el.innerHTML = `
    <div class="now-playing-cover">
      <img class="now-playing-thumb" src="${thumb}" alt="thumb" />
      <div class="now-playing-meta">
        <div class="now-title">${track.name}</div>
        <div class="now-artist">${track.artist || "Unknown Artist"}</div>
        <div class="now-extra">
          <span>👁️ ${track.viewCount || 0}</span>
          <span>${track.album ? "• " + track.album : ""}</span>
        </div>
      </div>
    </div>
  `;
}

// ========================
// SETUP UI CƠ BẢN
// ========================
setupMusicSidebar();
document.getElementById("searchToggle")?.addEventListener("click", toggleSearchBar);
document.getElementById("floatingSearchInput")?.addEventListener("input", filterMusic);
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar-menu")?.classList.toggle("active");
});

// ========================
// XỬ LÝ BIẾN TOÀN CỤC
// ========================
const urlParams = new URLSearchParams(window.location.search);
const currentFile = urlParams.get("file");
const playlistId = urlParams.get("playlist");
const sourceKey = urlParams.get("key") || getSourceKey(); // Ưu tiên lấy từ URL

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
const trackListEl = document.getElementById("track-list");

// Nếu là file riêng lẻ → xác định folder
let fileParts = [];
let folderPath = "";
let currentFileName = "";

if (currentFile) {
  fileParts = currentFile.split("/").filter(Boolean);
  folderPath = fileParts.slice(0, -1).join("/");
  currentFileName = fileParts.at(-1);
  folderTitleEl.textContent = `📁 ${folderPath.split("/").pop() || "Playlist"}`;
} else {
  folderTitleEl.textContent = `📁 Playlist`;
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
      `/api/music/music-folder?key=${sourceKey}&path=${encodeURIComponent(folderPath)}`
    );
    const data = await res.json();

    audioList = (data.folders || []).filter(
      (f) => f.type === "audio" || f.type === "file"
    );
    currentIndex = audioList.findIndex((f) => f.path === currentFile);

    renderTrackList();
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

    audioList = (data || []).filter(f => f.type === "audio" || f.type === "file");
    currentIndex = 0;

    renderTrackList();
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
    tr.className = index === currentIndex ? "playing" : "";

    const folderPrefix = item.path?.split("/").slice(0, -1).join("/");

    const tdSong = document.createElement("td");
    tdSong.innerHTML = `
      <div class="track-flex">
        <img class="track-thumb" src="${
          item.thumbnail
            ? `/audio/${folderPrefix ? folderPrefix + "/" : ""}${item.thumbnail.replace(/\\/g, "/")}`
            : "/default/music-thumb.png"
        }" alt="thumb" />
        <div class="track-info">
          <div class="track-title">${item.name}</div>
          <div class="track-artist">${item.artist || "Unknown"}</div>
        </div>
      </div>
    `;

    const tdAlbum = document.createElement("td");
    tdAlbum.textContent = item.album || "Unknown";

    const folderParts = item.path?.split("/").filter(Boolean);
    const folderPath = folderParts.length > 1 ? folderParts.slice(0, -1).join("/") : "";

    const tdFolder = document.createElement("td");
    tdFolder.textContent = folderPath || "Root";
    tdFolder.classList.add("clickable-folder");

    if (folderPath) {
      tdFolder.style.color = "#1db954";
      tdFolder.style.cursor = "pointer";
      tdFolder.title = "Click để mở thư mục";
      tdFolder.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/music-index.html?path=${encodeURIComponent(folderPath)}`;
      };
    }

    const tdViews = document.createElement("td");
    tdViews.textContent = item.viewCount || 0;

    const tdDuration = document.createElement("td");
    tdDuration.textContent = formatDuration(item.duration);
    tdDuration.className = "track-duration";

    tr.onclick = () => playAtIndex(index);
    tr.append(tdSong, tdAlbum, tdFolder, tdViews, tdDuration);
    tbody.appendChild(tr);
  });

  document.getElementById("folder-meta").textContent = `${audioList.length} tracks`;
}

// ========================
// PHÁT NHẠC & UPDATE INFO
// ========================
function playAtIndex(index) {
  if (index < 0 || index >= audioList.length) return;
  currentIndex = index;

  const file = audioList[index];
  const src = `/api/music/audio?key=${sourceKey}&file=${encodeURIComponent(file.path)}`;

  audioEl.src = src;
  audioEl.play().catch(() => {
    showToast("⚠️ Không thể phát bài hát");
  });

  nowPlayingEl.textContent = `🎵 ${file.name}`;
  renderNowPlayingInfo(file); // ⭐⭐ Update block info trên cùng
  updateTrackHighlight();
}

// Cập nhật trạng thái dòng đang phát
function updateTrackHighlight() {
  document.querySelectorAll("#track-body tr").forEach((row, idx) => {
    row.classList.toggle("playing", idx === currentIndex);
  });
}

// ========================
// BUTTON ĐIỀU KHIỂN
// ========================
document.getElementById("btn-prev").onclick = () => {
  if (currentIndex > 0) playAtIndex(currentIndex - 1);
};
document.getElementById("btn-next").onclick = () => {
  if (currentIndex + 1 < audioList.length) playAtIndex(currentIndex + 1);
};
document.getElementById("btn-play").onclick = () => {
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
};

audioEl.addEventListener("ended", () => {
  if (currentIndex + 1 < audioList.length) {
    playAtIndex(currentIndex + 1);
  }
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
