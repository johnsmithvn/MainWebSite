// playlistMenu.js
import { getSourceKey } from "/src/core/storage.js";
import { showToast,showConfirm,showInputPrompt } from "/src/core/ui.js";

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

  // === Render cấu trúc khung popup sticky title + vùng scroll + sticky button add ===
  container.innerHTML = `
    <div class="popup-title">Add "${name}"</div>
    <div class="playlist-list-scroll"></div>
  `;

  const listScroll = container.querySelector('.playlist-list-scroll');

  // Render từng playlist-row vào vùng scroll
  const playlistStatus = await Promise.all(
    playlists.map(async (p) => {
      const res = await fetch(`/api/music/playlist/${p.id}?key=${key}`);
      const items = await res.json();
      const contains = items.tracks?.some((song) => song.path === path);
      return { ...p, contains };
    })
  );

  playlistStatus.forEach((p) => {
    const row = document.createElement("div");
    row.className = "playlist-row";

    // Nút tick add/remove bài
    const btn = document.createElement("button");
    btn.className = "playlist-option" + (p.contains ? " bold" : "");
    btn.innerHTML = p.contains ? `✅ ${p.name}` : p.name;
    btn.style.flex = "1";
    btn.style.textAlign = "left";
    btn.onclick = async () => {
      if (p.contains) {
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
      showPlaylistMenu(path, name, anchor);
    };

    // Nút xoá playlist bên phải
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.className = "playlist-delete-btn";
    delBtn.title = "Xoá playlist này";
    delBtn.style.marginLeft = "6px";
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      const ok = await showConfirm(`Xoá playlist "${p.name}"?`);
      if (!ok) return;
      await fetch("/api/music/playlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, id: p.id }),
      });
      showToast("🗑️ Đã xoá playlist");
      showPlaylistMenu(path, name, anchor);
    };

    row.appendChild(btn);
    row.appendChild(delBtn);

    // Flex-row style
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "0";

    listScroll.appendChild(row); // Append vào vùng scroll!
  });

  // Tạo mới playlist (sticky dưới)
  const newBtn = document.createElement("button");
  newBtn.className = "playlist-option bold playlist-add-btn";
  newBtn.textContent = "➕ Tạo playlist mới...";
  newBtn.onclick = async () => {
    const value = await showInputPrompt("Nhập tên playlist mới", "Tên playlist");
    if (!value) return;
    const res = await fetch("/api/music/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, name: value }),
    });
    const data = await res.json();
    if (data?.id) {
      showToast("✅ Tạo playlist thành công!");
      showPlaylistMenu(path, name, anchor);
    }
  };
  container.appendChild(newBtn);

  // Popup căn giữa (mobile/desktop)
  const isMobile = window.innerWidth <= 480;
  container.style.position = "fixed";
  container.style.left = "50%";
  container.style.top = "50%";
  container.style.transform = "translate(-50%, -50%)";
  container.style.width = isMobile ? "min(96vw, 400px)" : "340px";
  container.style.maxWidth = isMobile ? "96vw" : "340px";
  container.style.maxHeight = isMobile ? "87vh" : "70vh";

  // Click ngoài sẽ ẩn popup
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
