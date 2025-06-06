import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";
import {  toggleSearchBar, filterMovie } from "/src/core/ui.js";
import { setupMusicSidebar } from "/src/core/ui.js";

setupMusicSidebar(); // ✅ đúng
document.getElementById("searchToggle")?.addEventListener("click", toggleSearchBar);
document.getElementById("floatingSearchInput")?.addEventListener("input", filterMovie);
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar-menu")?.classList.toggle("active");
});

const urlParams = new URLSearchParams(window.location.search);
const currentFile = urlParams.get("file");
const sourceKey = getSourceKey();

const audioEl = document.getElementById("audio-player");
const nowPlayingEl = document.getElementById("now-playing");
const folderTitleEl = document.getElementById("folder-title");
const trackListEl = document.getElementById("track-list");

if (!currentFile || !sourceKey) {
  showToast("❌ Thiếu file hoặc sourceKey");
  throw new Error("Missing file or sourceKey");
}

const fileParts = currentFile.split("/").filter(Boolean);
const folderPath = fileParts.slice(0, -1).join("/");
const currentFileName = fileParts.at(-1);

// Gán title folder
folderTitleEl.textContent = `📁 ${folderPath.split("/").pop() || "Playlist"}`;

// Load danh sách bài cùng folder
let audioList = [];
let currentIndex = -1;

async function loadFolderSongs() {
  try {
    const res = await fetch(`/api/music/music-folder?key=${sourceKey}&path=${encodeURIComponent(folderPath)}`);
    const data = await res.json();

    audioList = (data.folders || []).filter(f => f.type === "audio" || f.type === "file");
    currentIndex = audioList.findIndex(f => f.path === currentFile);

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

function renderTrackList() {
  const tbody = document.getElementById("track-body");
  tbody.innerHTML = "";

  audioList.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = index === currentIndex ? "playing" : "";

    // Thumbnail
    const tdThumb = document.createElement("td");
    const img = document.createElement("img");
    img.src = item.thumbnail ? `/video/${item.thumbnail}` : "/default/music-thumb.png";
    img.className = "track-thumb";
    tdThumb.appendChild(img);

    // Title + name
    const tdTitle = document.createElement("td");
    tdTitle.innerHTML = `<div class="track-title">${item.name}</div>
                         <div class="track-artist">${item.artist || "Unknown"}</div>`;

    // Artist
    const tdArtist = document.createElement("td");
    tdArtist.textContent = item.artist || "Unknown";

    // Album = folder cha
    const tdAlbum = document.createElement("td");
    const folderParts = item.path.split("/");
    tdAlbum.textContent = folderParts.length > 1 ? folderParts.at(-2) : "Unknown";

    tr.onclick = () => playAtIndex(index);
    tr.append(tdThumb, tdTitle, tdArtist, tdAlbum);
    tbody.appendChild(tr);
  });

  document.getElementById("folder-meta").textContent = `${audioList.length} tracks`;
}


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
  updateTrackHighlight();
}

function updateTrackHighlight() {
  document.querySelectorAll("#track-body tr").forEach((row, idx) => {
    row.classList.toggle("playing", idx === currentIndex);
  });
}



// Nút điều khiển
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

loadFolderSongs();
