// 📁 frontend/src/select.js
import { withLoading, showToast, showConfirm } from "/src/core/ui.js";
import {
  requireSourceKey,
  getSourceKey,
  clearAllFolderCache
} from "/src/core/storage.js";
/**
 * 📂 Fetch danh sách folder gốc và render ra giao diện
 */

/**
 * 📦 Tạo thẻ card cho folder root
 */
function createRootFolderCard(folder) {
  const sourceKey = getSourceKey();
  requireSourceKey(); // 🔐 Kiểm tra sourceKey
  const card = document.createElement("div");
  card.className = "select-card";

  const thumbnail = document.createElement("img");
  thumbnail.className = "select-thumbnail";
  thumbnail.loading = "lazy";
  thumbnail.alt = folder;
  thumbnail.src = "/default/default-cover.jpg";

  fetch(
    `/api/manga/root-thumbnail?key=${encodeURIComponent(
      sourceKey
    )}&root=${encodeURIComponent(folder)}`
  )
    .then((r) => r.json())
    .then((d) => {
      if (d.thumbnail) {
        thumbnail.src = `/manga/${encodeURIComponent(folder)}/${d.thumbnail}`;
      }
    })
    .catch(() => {});

  const label = document.createElement("div");
  label.className = "select-label";
  label.textContent = folder;

  card.appendChild(thumbnail);
  card.appendChild(label);

  card.onclick = withLoading(async () => {
    localStorage.setItem("rootFolder", folder);

    const res = await fetch(
      `/api/manga/folder-cache?mode=folders&key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(folder)}`
    );
    const data = await res.json();

    if (Array.isArray(data) && data.length === 0) {
      console.log("📂 DB rỗng, tiến hành scan...");

      await withLoading(async () => {
        await fetch("/api/manga/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ root: folder, key: sourceKey }),
        });
      })();

      alert("✅ Đã quét cache cho root folder.");
    }

    window.location.href = "/manga/index.html"; // ✅ Chuyển sang trang chính
  });

  return card;
}

/**
 * 📂 Load danh sách root folders
 */
async function loadRootFolders() {
  const dbkey = localStorage.getItem("sourceKey");
  if (!dbkey) {
    showToast("❌ Chưa chọn nguồn manga!");
    return (window.location.href = "/home.html");
  }
  try {
    const res = await fetch(`/api/list-roots?key=${encodeURIComponent(dbkey)}`);
    if (!res.ok) {
      const errText = await res.text(); // đọc lỗi thô để debug
      throw new Error(`Server ${res.status}: ${errText}`);
    }
    const folders = await res.json();
    const list = document.getElementById("folder-list");
    list.innerHTML = ""; // Clear cũ nếu có

    folders.forEach((folder) => {
      const card = createRootFolderCard(folder);
      list.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Lỗi load root folders:", err);
  }
}

document
  .getElementById("reset-all-db-btn")
  ?.addEventListener("click", async () => {
    const ok = await showConfirm("Bạn có chắc muốn xoá toàn bộ DB không?", {
      loading: true,
    });
    if (!ok) return;

    try {
      const sourceKey = getSourceKey();
      if (!sourceKey) return showToast("❌ Thiếu sourceKey");

      const res = await fetch(
        `/api/manga/reset-cache/all?key=${encodeURIComponent(sourceKey)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      showToast(data.message || "✅ Đã xoá toàn bộ DB thành công!");
    } catch (err) {
      showToast("❌ Lỗi khi xoá DB");
      console.error("❌ reset-all-db:", err);
    } finally {
      const overlay = document.getElementById("loading-overlay");
      overlay?.classList.add("hidden");
    }
  });

document
  .getElementById("clear-all-folder-cache-btn")
  ?.addEventListener("click", async () => {
    const ok = await showConfirm(
      "Bạn có chắc muốn xoá toàn bộ folder cache localStorage?"
    );
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) return showToast("❌ Thiếu sourceKey");

    clearAllFolderCache(); // ✅ Dùng hàm có sẵn
    showToast("🧼 Đã xoá toàn bộ folder cache");
    location.reload();
  });

window.addEventListener("DOMContentLoaded", loadRootFolders);
