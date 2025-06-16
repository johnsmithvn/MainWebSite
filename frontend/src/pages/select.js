// 📁 frontend/src/select.js
import {
  withLoading,
  showToast,
  showConfirm,
  showOverlay,
  hideOverlay,
} from "/src/core/ui.js";
import {
  requireSourceKey,
  getSourceKey,
  clearAllFolderCache,
  getRootThumbCache,
  setRootThumbCache,
} from "/src/core/storage.js";
import { ensureAuth, setupSecurityFetch } from "/src/core/security.js";
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
  card.className = "music-card";

  const thumbnail = document.createElement("img");
  thumbnail.className = "music-thumb";
  thumbnail.src = "/default/default-cover.jpg";
  thumbnail.alt = folder;
  thumbnail.loading = "lazy";

  const cached = getRootThumbCache(sourceKey, folder);
  if (cached) {
    thumbnail.src = `/manga/${encodeURIComponent(folder)}/${cached.replace(/\\/g, "/")}`;
  } else {
    fetch(
      `/api/manga/root-thumbnail?key=${encodeURIComponent(
        sourceKey
      )}&root=${encodeURIComponent(folder)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.thumbnail) {
          const clean = data.thumbnail.replace(/\\/g, "/");
          thumbnail.src = `/manga/${encodeURIComponent(folder)}/${clean}`;
          setRootThumbCache(sourceKey, folder, data.thumbnail);
        }
      })
      .catch((err) => console.error("load thumbnail", err));
  }

  const info = document.createElement("div");
  info.className = "music-info";

  const label = document.createElement("div");
  label.className = "music-title";
  label.textContent = folder;

  info.appendChild(label);

  card.appendChild(thumbnail);
  card.appendChild(info);

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
  // 🛑 Nếu source hiện tại không phải manga thì về lại home
  if (!dbkey.startsWith("ROOT_")) {
    showToast("⚠️ Nguồn hiện tại không phải manga!");
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
      hideOverlay();
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

window.addEventListener("DOMContentLoaded", async () => {
  setupSecurityFetch();
  const key = getSourceKey();
  if (!(await ensureAuth(key))) {
    return (window.location.href = "/home.html");
  }
  loadRootFolders();
});
