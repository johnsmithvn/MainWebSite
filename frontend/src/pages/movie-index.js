import { renderFolderCard } from "/src/components/folderCard.js"; // Đảm bảo dùng card chung

let currentPath = "";

function getSourceKey() {
  return localStorage.getItem("sourceKey");
}

function loadMovieFolder(path = "") {
  const sourceKey = getSourceKey();
  if (!sourceKey) {
    alert("Chưa chọn nguồn phim!");
    window.location.href = "/home.html";
    return;
  }
  currentPath = path;
  const params = new URLSearchParams();
  params.set("key", sourceKey);
  if (path) params.set("path", path);

  fetch("/api/movie-folder?" + params.toString())
    .then((res) => res.json())
    .then((data) => renderMovieGrid(data.folders, path));
}

function renderMovieGrid(list, basePath) {
  const app = document.getElementById("movie-app");
  app.innerHTML = "";

  // Header breadcrumb hoặc back
  const parts = basePath ? basePath.split("/").filter(Boolean) : [];
  const backBtn = document.getElementById("back-root");
  if (parts.length > 0) {
    backBtn.style.display = "";
    backBtn.onclick = () => {
      const parent = parts.slice(0, -1).join("/");
      loadMovieFolder(parent);
    };
  } else {
    backBtn.style.display = "none";
  }

  // Tiêu đề
  const title = document.createElement("h2");
  title.textContent =
    parts.length === 0 ? "📂 Danh sách phim" : "📁 " + parts[parts.length - 1];
  app.appendChild(title);

  // Grid card
  const grid = document.createElement("div");
  grid.className = "grid";

  list.forEach((item) => {
    // Chuẩn hóa cho folderCard
    let thumbnailUrl = null;
    if (item.thumbnail) {
      thumbnailUrl = `/video/${item.thumbnail.replace(/\\/g, "/")}`;
    } else {
      thumbnailUrl =
        item.type === "video"
          ? "/default/video-thumb.png"
          : "/default/folder-thumb.png";
    }

    let cardData = {
      name: item.name,
      path: item.path,
      thumbnail: thumbnailUrl,
      isSelfReader: false,
    };

    // Card render
    const card = renderFolderCard(cardData, false, false); // showViews, showFavorite = false

    // Click action
    card.onclick = () => {
      if (item.type === "video") {
        window.location.href = `/movie-player.html?file=${encodeURIComponent(
          cardData.path
        )}&key=${getSourceKey()}`;
      } else {
        loadMovieFolder(cardData.path);
      }
    };

    grid.appendChild(card);
  });

  app.appendChild(grid);
}

window.addEventListener("DOMContentLoaded", () => {
  loadMovieFolder();

  // Xử lý nút xoá DB movie
  const deleteBtn = document.getElementById("delete-movie-db");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm("Bạn có chắc muốn xoá sạch DB Movie này không?")) return;
      const sourceKey = getSourceKey();
      try {
        // Gọi API xoá DB movie (xoá file hoặc truncate bảng folders)
        await fetch(`/api/reset-movie-db?key=${sourceKey}`, {
          method: "DELETE",
        });
        alert("Đã xoá xong DB Movie! Vào lại sẽ tự scan lại.");
        // Optional: reload luôn trang
        window.location.reload();
      } catch (err) {
        alert("Lỗi khi xoá DB movie!");
        console.error(err);
      }
    };
  }
});
