// 📁 folderSlider.js (Scroll Native version – scroll snap, auto-scroll, hover pause, visibility-aware)
import { renderFolderCard } from "./folderCard.js";
import { renderRecentViewed, showRandomUpdatedTime } from "../core/ui.js";
import {
  recentViewedKey,
  getSourceKey,
  recentViewedVideoKey,
  recentViewedMusicKey,
} from "../core/storage.js";
import { buildThumbnailUrl } from "../core/ui.js";
import { SLIDER, RESPONSIVE, CACHE } from "../constants.js";

/**
 * Hiển thị thanh trượt thư mục/phim/nhạc.
 * Dùng scroll ngang và có nút chuyển slide.
 * @param {Object} options Thông tin cấu hình
 * @param {string} options.title Tiêu đề hiển thị
 * @param {Array} options.folders Danh sách folder hoặc file
 * @param {boolean} options.showViews Có hiện lượt xem hay không
 * @param {string} [options.targetId] Id section sẽ render vào
 * @param {Function} [options.onRefresh] Hàm gọi lại khi ấn refresh
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
  const isRecent =
    title.toLowerCase().includes("vừa xem") ||
    title.toLowerCase().includes("vừa nghe") ||
    title.toLowerCase().includes("mới đọc") ||
    title.toLowerCase().includes("nhạc vừa nghe");

  if (title.includes("ngẫu nhiên") || isRecent) {
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
      } else if (title.includes("Bài hát")) {
        // hoặc: Audio
        timestamp.id = "random-timestamp-audio";
      } else {
        timestamp.id = "random-timestamp"; // fallback cho manga
      }
      timestamp.textContent = "";
      right.appendChild(timestamp);
    }

    if (isRecent) {
      const clearBtn = document.createElement("button");
      clearBtn.textContent = "🗑️ Xoá tất cả";
      clearBtn.className = "small-button";
      clearBtn.onclick = () => {
        let key;
        let rerender;
        if (window.location.pathname.includes("movie")) {
          key = recentViewedVideoKey();
          rerender = renderRecentViewed;
        } else if (window.location.pathname.includes("music")) {
          key = recentViewedMusicKey();
          // Gọi hàm đúng cho music recent!
          rerender = window.renderRecentViewedMusic || renderRecentViewed;
        } else {
          key = recentViewedKey();
          rerender = renderRecentViewed;
        }
        localStorage.removeItem(key);
        rerender([]);
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

    const isMusicPage = window.location.pathname.includes("music");
    const isMoviePage = window.location.pathname.includes("movie");
    const isMangaPage = !isMusicPage && !isMoviePage; // còn lại là manga/comic/reader/...

    let mediaType = "movie";
    if (isMusicPage) mediaType = "music";
    else if (isMangaPage) mediaType = "manga";

    const thumbnailUrl = buildThumbnailUrl(f, mediaType);

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
      if (e.target.classList.contains("folder-fav")) return;

      if (f.isPlaylist) {
        const key = getSourceKey();
        window.location.href = `/music/player.html?playlist=${encodeURIComponent(f.path)}&key=${key}`;
        return;
      }

      const isMusicPage = window.location.pathname.includes("music");
      const isMoviePage = window.location.pathname.includes("movie");

      // Xử lý mở player cho cả music và movie
      if (
        (isMusicPage && (f.type === "audio" || f.type === "file")) ||
        (isMoviePage && (f.type === "video" || f.type === "file"))
      ) {
        // Nếu là file nhạc thì sang music/player, nếu là video thì sang movie/player
        const page = isMusicPage ? "music/player" : "movie/player";
        window.location.href = `/${page}.html?file=${encoded}&key=${key}`;
        return;
      }

      // Nếu là folder
      if (isMusicPage) {
        window.location.href = `/music/index.html?path=${encoded}&key=${key}`;
      } else if (isMoviePage) {
        window.location.href = `/movie/index.html?path=${encoded}&key=${key}`;
      } else if (f.isSelfReader && f.images) {
        window.location.href = `/manga/reader.html?path=${encoded}`;
      } else if (typeof window.loadFolder === "function") {
        window.loadFolder(f.path);
      }
    };
  });

  sliderContainer.appendChild(wrapper);

  const isMobile = window.innerWidth <= RESPONSIVE.MOBILE_BREAKPOINT; // 768 - from constants
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

// 👉 Tạo sẵn các section random nếu trang chưa có (dùng cho player)
export function setupRandomSectionsIfMissing() {
  ["randomFolderSection", "randomVideoSection"].forEach((id) => {
    if (!document.getElementById(id)) {
      const sec = document.createElement("section");
      sec.id = id;
      document.body.prepend(sec);
    }
  });
}

// 👉 Hàm tải 2 slider ngẫu nhiên (folder và video/audio)
export function loadRandomSliders(contentType = "movie") {
  const sourceKey = getSourceKey();
  const isMusic = contentType === "music";
  const api = isMusic ? "/api/music/audio-cache" : "/api/movie/video-cache";

  // Thêm timestamp id cho audio random
  loadRandomSection(
    "folder",
    sourceKey,
    "randomFolderSection",
    isMusic ? "🎲 Thư mục nhạc ngẫu nhiên" : "🎲 Folder ngẫu nhiên",
    false,
    api,
    isMusic ? "random-timestamp-folder" : "random-timestamp-folder"
  );

  loadRandomSection(
    "file",
    sourceKey,
    isMusic ? "randomAudioSection" : "randomVideoSection",
    isMusic ? "🎵 Bài hát ngẫu nhiên" : "🎬 Video ngẫu nhiên",
    false,
    api,
    isMusic ? "random-timestamp-audio" : "random-timestamp-video"
  );
}

// ✅ Hàm gọi API lấy dữ liệu ngẫu nhiên và render slider
async function loadRandomSection(
  type,
  sourceKey,
  sectionId,
  title,
  force = false,
  apiBase,
  tsId // Thêm id timestamp riêng cho audio
) {
  if (!apiBase) {
    const path = window.location.pathname;
    if (path.includes("music")) apiBase = "/api/music/audio-cache";
    else if (path.includes("movie")) apiBase = "/api/movie/video-cache";
    else if (
      path.includes("manga") ||
      path.includes("comic") ||
      path.includes("reader")
    )
      apiBase = "/api/manga/folder-cache";
    else apiBase = "/api/movie/video-cache"; // fallback
  }
  if (!sourceKey) return;

  const cacheKey = `${
    type === "file"
      ? apiBase.includes("music")
        ? "randomAudios"
        : "randomVideos"
      : "randomFolders"
  }-${sourceKey}`;

  tsId =
    tsId ||
    (type === "file"
      ? apiBase.includes("music")
        ? "random-timestamp-audio"
        : "random-timestamp-video"
      : "random-timestamp-folder");

  if (!force) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expired = Date.now() - parsed.timestamp > CACHE.SLIDER_CACHE_MS; // 30 minutes - from constants
        if (!expired) {
          renderFolderSlider({
            title,
            folders: parsed.data,
            targetId: sectionId,
            onRefresh: () =>
              loadRandomSection(
                type,
                sourceKey,
                sectionId,
                title,
                true,
                apiBase,
                tsId
              ),
          });
          // Bổ sung timestamp cho từng sectionId (audio/video)
          const el = document.getElementById(tsId);
          if (el) showRandomUpdatedTime(parsed.timestamp, tsId);
          return;
        }
      } catch {}
    }
  }

  try {
    const res = await fetch(
      `${apiBase}?mode=random&type=${type}&key=${sourceKey}`
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
        loadRandomSection(
          type,
          sourceKey,
          sectionId,
          title,
          true,
          apiBase,
          tsId
        ),
    });

    const el = document.getElementById(tsId);
    if (el) showRandomUpdatedTime(now, tsId);
  } catch (err) {
    console.error("❌ Lỗi random slider:", err);
  }
}

//
