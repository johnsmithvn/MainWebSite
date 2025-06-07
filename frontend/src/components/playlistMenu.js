// playlistMenu.js
import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";

export async function showPlaylistMenu(path, name, anchor) {
  let container = document.getElementById("playlist-popup");
  if (!container) {
    container = document.createElement("div");
    container.id = "playlist-popup";
    container.className = "playlist-popup";
    document.body.appendChild(container);
  }

  const key = getSourceKey();
  let playlists = [];
  try {
    const res = await fetch(`/api/music/playlists?key=${key}`);
    playlists = await res.json();
  } catch {
    showToast("❌ Lỗi tải danh sách playlist");
  }

  container.innerHTML = `<div class="popup-title">➕ Thêm "${name}" vào:</div>`;

  // ⭐⭐⭐ 1. Check trạng thái từng playlist
  const playlistStatus = await Promise.all(
    playlists.map(async (p) => {
      // Lấy danh sách bài trong playlist này
      const res = await fetch(`/api/music/playlist/${p.id}?key=${key}`);
      const items = await res.json();
      const contains = items.some(song => song.path === path);
      return { ...p, contains };
    })
  );

  // ⭐⭐⭐ 2. Render từng playlist, tick nếu đã có, click thì toggle add/remove
  playlistStatus.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "playlist-option" + (p.contains ? " bold" : "");
    btn.innerHTML = p.contains ? `✅ ${p.name}` : p.name;
    btn.onclick = async () => {
      if (p.contains) {
        // Remove khỏi playlist
        await fetch("/api/music/playlist/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            playlistId: p.id,
            path,
          }),
        });
        showToast("❌ Đã xoá khỏi playlist");
      } else {
        // Thêm vào playlist
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
      }
      // Reload lại popup để cập nhật tick ngay lập tức
      showPlaylistMenu(path, name, anchor);
    };
    container.appendChild(btn);
  });

  // ⭐⭐⭐ 3. Tạo mới playlist
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

  // ⭐⭐⭐ 4. Vị trí hiển thị popup
  const rect = anchor.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  container.style.top = rect.bottom + scrollY + "px";
  container.style.left = rect.left + scrollX + "px";

  // ⭐⭐⭐ 5. Tự ẩn nếu click ra ngoài
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
