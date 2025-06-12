import { getSourceKey } from "/src/core/storage.js";
import { showToast } from "/src/core/ui.js";

window.addEventListener("DOMContentLoaded", () => {
  loadPlaylists();

  document.getElementById("btn-new-playlist").onclick = async () => {
    const name = prompt("Nhập tên playlist:");
    if (!name) return;

    const key = getSourceKey();
    const res = await fetch("/api/music/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, name }),
    });
    const data = await res.json();
    if (data?.success) {
      showToast("✅ Tạo playlist thành công!");
      loadPlaylists();
    } else {
      showToast("❌ Không thể tạo playlist!");
    }
  };
});

async function loadPlaylists() {
  const key = getSourceKey();
  const res = await fetch(`/api/music/playlists?key=${key}`);
  const list = await res.json();

  const container = document.getElementById("playlist-container");
  container.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "folder-card";
    div.textContent = `📁 ${item.name}`;
    div.title = item.description || "";
    div.onclick = () => {
      // mở bằng music-player với id playlist
      const key = getSourceKey();
      window.location.href = `/music-player.html?playlist=${item.id}&key=${key}`;
    };

    // ============ Thêm nút xoá ============
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.className = "playlist-delete-btn";
    delBtn.title = "Xoá playlist này";
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Xoá playlist "${item.name}"?`)) return;
      const res = await fetch("/api/music/playlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, id: item.id }),
      });
      const data = await res.json();
      if (data?.success) {
        showToast("✅ Đã xoá playlist!");
        loadPlaylists();
      } else {
        showToast("❌ Không xoá được playlist!");
      }
    };
    div.appendChild(delBtn);

    container.appendChild(div);
  });
}
