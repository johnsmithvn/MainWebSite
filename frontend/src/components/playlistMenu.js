// playlistMenu.js
import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";

export async function showPlaylistMenu(path, name, anchor) {
  // nguyên code bạn đang dùng ở cuối file
  let container = document.getElementById("playlist-popup");
  if (!container) {
    container = document.createElement("div");
    container.id = "playlist-popup";
    container.className = "playlist-popup";
    document.body.appendChild(container);
  }

  // Lấy playlist hiện có
  const key = getSourceKey();
  let playlists = [];
  try {
    const res = await fetch(`/api/music/playlists?key=${key}`);
    playlists = await res.json();
  } catch {
    showToast("❌ Lỗi tải danh sách playlist");
  }

  container.innerHTML = `<div class="popup-title">➕ Thêm "${name}" vào:</div>`;

  // Danh sách playlist
  playlists.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "playlist-option";
    btn.textContent = `📁 ${p.name}`;
    btn.onclick = async () => {
      await fetch("/api/music/playlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          playlistId: p.id,
          path,
        }),
      });
      showToast("✅ Đã thêm vào playlist");
      container.remove();
    };
    container.appendChild(btn);
  });

  // Tạo mới
  const newBtn = document.createElement("button");
  newBtn.className = "playlist-option bold";
  newBtn.textContent = "➕ Tạo playlist mới...";
  newBtn.onclick = async () => {
    const name = prompt("Nhập tên playlist mới:");
    if (!name) return;

    const res = await fetch("/api/music/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, name }),
    });
    const data = await res.json();
    if (data?.id) {
      showToast("✅ Tạo playlist thành công!");
      showPlaylistMenu(path, name, anchor); // load lại popup
    }
  };
  container.appendChild(newBtn);

  // Vị trí hiển thị
const rect = anchor.getBoundingClientRect();
const scrollY = window.scrollY || document.documentElement.scrollTop;
const scrollX = window.scrollX || document.documentElement.scrollLeft;

container.style.top = rect.bottom + scrollY + "px";
container.style.left = rect.left + scrollX + "px";

  
  // Tự ẩn nếu click ra ngoài
  setTimeout(() => {
    function handleClickOutside(e) {
      if (!container.contains(e.target)) {
        container.remove();
        document.removeEventListener("click", handleClickOutside);
      }
    }
    document.addEventListener("click", handleClickOutside);
  }, 0);
}
