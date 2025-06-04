// 📁 folderSlider.js (Scroll Native version – scroll snap, auto-scroll, hover pause, visibility-aware)
import { renderFolderCard } from "./folderCard.js";
import { renderRecentViewed, showRandomUpdatedTime } from "../core/ui.js";
import {
  getRootFolder,
  recentViewedKey,
  getSourceKey,
} from "../core/storage.js";

/**
 * Hiển thị slider thư mục (truyện hoặc phim) dạng ngang scroll
 * @param {Object} options
 * @param {string} options.title - tiêu đề (ví dụ: "✨ Random")
 * @param {Array} options.folders - danh sách folder
 * @param {boolean} options.showViews - có hiển thị lượt xem không
 * @param {string} [options.targetId] - nếu truyền thì render đúng vào container đó
 */
export function renderFolderSlider({
  title,
  folders,
  showViews = false,
  targetId,
  onRefresh = null,
}) {
  const section = document.createElement("section");
  section.className = "folder-section slider";

  const header = document.createElement("div");
  header.className = "folder-section-header";

  const left = document.createElement("div");
  left.className = "slider-left";

  const h3 = document.createElement("h3");
  h3.className = "folder-section-title";
  h3.textContent = title;
  left.appendChild(h3);
  header.appendChild(left);

  if (title.includes("ngẫu nhiên") || title.includes("Mới đọc")) {
    const right = document.createElement("div");
    right.className = "slider-right";

    if (title.includes("ngẫu nhiên")) {
      const refreshBtn = document.createElement("button");
      refreshBtn.id = "refresh-random-btn";
      refreshBtn.textContent = "🔄 Refresh";
      refreshBtn.className = "small-button";
      right.appendChild(refreshBtn);
      refreshBtn.onclick = () => {
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      };
      const timestamp = document.createElement("span");
      timestamp.className = "random-timestamp";
      // ✅ Set ID khác nhau cho Folder và Video
      if (title.includes("Folder")) {
        timestamp.id = "random-timestamp-folder";
      } else if (title.includes("Video")) {
        timestamp.id = "random-timestamp-video";
      } else {
        timestamp.id = "random-timestamp"; // fallback cho manga
      }
      timestamp.textContent = "";
      right.appendChild(timestamp);
    }

    if (title.includes("Mới đọc")) {
      const clearBtn = document.createElement("button");
      clearBtn.textContent = "🗑️ Xoá tất cả";
      clearBtn.className = "small-button";
      clearBtn.onclick = () => {
        const isMoviePage = window.location.pathname.includes("movie");
        const key = isMoviePage ? recentViewedVideoKey() : recentViewedKey();
        localStorage.removeItem(key);
        renderRecentViewed([]);
      };
      right.appendChild(clearBtn);
    }

    header.appendChild(right);
  }

  section.appendChild(header);

  const sliderContainer = document.createElement("div");
  sliderContainer.style.position = "relative";

  const wrapper = document.createElement("div");
  wrapper.className = "slider-wrapper";
  wrapper.style.scrollSnapType = "x mandatory";
  wrapper.style.overflowX = "auto";

  const isMoviePage = window.location.pathname.includes("movie");

  folders.forEach((f) => {
    // ✅ Thumbnail đúng cho cả manga và movie
    let thumbnailUrl = f.thumbnail;
    if (!f.thumbnail) {
      thumbnailUrl =
        f.type === "video" || f.type === "file"
          ? "/default/video-thumb.png"
          : "/default/folder-thumb.png";
    } else if (isMoviePage) {
      thumbnailUrl = `/video/${f.thumbnail.replace(/\\/g, "/")}`;
    }

    const cardData = {
      ...f,
      thumbnail: thumbnailUrl,
    };

    const card = renderFolderCard(cardData, showViews);
    card.style.scrollSnapAlign = "start";
    wrapper.appendChild(card);

    // ✅ Xử lý click tương thích movie & manga
    const encoded = encodeURIComponent(f.path);
    const key = getSourceKey();

    card.onclick = (e) => {
      // ❌ Nếu bấm vào nút ❤️ thì bỏ qua
      if (e.target.classList.contains("folder-fav")) return;

      if (f.type === "video" || f.type === "file") {
        window.location.href = `/movie-player.html?file=${encoded}&key=${key}`;
      } else {
        if (isMoviePage) {
          window.location.href = `/movie-index.html?path=${encoded}&key=${key}`;
        } else if (f.isSelfReader && f.images) {
          window.location.href = `/reader.html?path=${encoded}`;
        } else if (typeof window.loadFolder === "function") {
          window.loadFolder(f.path);
        }
      }
    };
  });

  sliderContainer.appendChild(wrapper);

  const isMobile = window.innerWidth <= 768;
  const prevBtn = document.createElement("button");
  const nextBtn = document.createElement("button");
  prevBtn.className = "nav-button prev-button";
  nextBtn.className = "nav-button next-button";
  prevBtn.innerHTML = "←";
  nextBtn.innerHTML = "→";

  if (!isMobile) {
    sliderContainer.appendChild(prevBtn);
    sliderContainer.appendChild(nextBtn);
  }

  section.appendChild(sliderContainer);

  const dots = document.createElement("div");
  dots.className = "slider-pagination";
  section.appendChild(dots);

  const container = targetId
    ? document.getElementById(targetId)
    : document.getElementById(
        title.includes("ngẫu nhiên")
          ? "section-random"
          : title.includes("Xem nhiều")
          ? "section-topview"
          : "section-recent"
      );

  if (container) {
    container.innerHTML = "";
    container.appendChild(section);
  }

  const step = wrapper.querySelector(".folder-card")?.offsetWidth + 16 || 200;
  const totalSlides = Math.ceil(folders.length / 5);

  prevBtn.onclick = () => wrapper.scrollBy({ left: -step, behavior: "smooth" });
  nextBtn.onclick = () => wrapper.scrollBy({ left: step, behavior: "smooth" });

  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("span");
    dot.className = "pagination-dot";
    dot.style.cursor = "pointer";
    if (i === 0) dot.classList.add("active");
    dot.onclick = () =>
      wrapper.scrollTo({ left: i * step * 5, behavior: "smooth" });
    dots.appendChild(dot);
  }

  wrapper.addEventListener("scroll", () => {
    const percent =
      wrapper.scrollLeft / (wrapper.scrollWidth - wrapper.clientWidth);
    const activeIndex = Math.round(percent * (totalSlides - 1));
    dots.querySelectorAll(".pagination-dot").forEach((d, i) => {
      d.classList.toggle("active", i === activeIndex);
    });
  });

  let currentScroll = 0;
  let autoTimer = null;
  const scrollInterval = () => {
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
    currentScroll += step * 5;
    if (currentScroll > maxScroll) currentScroll = 0;
    wrapper.scrollTo({ left: currentScroll, behavior: "smooth" });
  };

  const startAutoScroll = () => {
    if (!isMobile && !autoTimer) autoTimer = setInterval(scrollInterval, 20000);
  };
  const stopAutoScroll = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) startAutoScroll();
      else stopAutoScroll();
    },
    { threshold: 0.5 }
  );
  observer.observe(section);

  wrapper.addEventListener("mouseenter", stopAutoScroll);
  wrapper.addEventListener("mouseleave", startAutoScroll);
}

// 👉 Tạo section nếu thiếu trên trang
// 👉 Tạo section nếu thiếu nếu chưa có section (movie-player dùng)
export function setupRandomSectionsIfMissing() {
  ["randomFolderSection", "randomVideoSection"].forEach((id) => {
    if (!document.getElementById(id)) {
      const sec = document.createElement("section");
      sec.id = id;
      document.body.prepend(sec);
    }
  });
}

// 👉 Hàm load 2 slider random (folder + video)
export function loadRandomSliders() {
  const sourceKey = getSourceKey();
  loadRandomSection(
    "folder",
    sourceKey,
    "randomFolderSection",
    "🎲 Folder ngẫu nhiên"
  );
  loadRandomSection(
    "file",
    sourceKey,
    "randomVideoSection",
    "🎲 Video ngẫu nhiên"
  );
}

// ✅ Hàm riêng gọi API và render
async function loadRandomSection(
  type,
  sourceKey,
  sectionId,
  title,
  force = false
) {
  if (!sourceKey) return;

  const cacheKey = `${
    type === "file" ? "randomVideos" : "randomFolders"
  }-${sourceKey}`;
  const tsId =
    type === "file" ? "random-timestamp-video" : "random-timestamp-folder";

  if (!force) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expired = Date.now() - parsed.timestamp > 30 * 60 * 1000;
        if (!expired) {
          renderFolderSlider({
            title,
            folders: parsed.data,
            targetId: sectionId,
            onRefresh: () =>
              loadRandomSection(type, sourceKey, sectionId, title, true),
          });

          const el = document.getElementById(tsId);
          if (el) showRandomUpdatedTime(parsed.timestamp, tsId); // ✅ sửa timestamp về như manga
          return;
        }
      } catch {}
    }
  }

  try {
    const res = await fetch(
      `/api/movie/video-cache?mode=random&type=${type}&key=${sourceKey}`
    );
    const data = await res.json();
    const folders = Array.isArray(data) ? data : data.folders;
    const now = Date.now();

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: folders, timestamp: now })
    );

    renderFolderSlider({
      title,
      folders,
      targetId: sectionId,
      onRefresh: () =>
        loadRandomSection(type, sourceKey, sectionId, title, true),
    });

    const el = document.getElementById(tsId);
    if (el) showRandomUpdatedTime(now, tsId);
  } catch (err) {
    console.error("❌ Lỗi random slider:", err);
  }
}
