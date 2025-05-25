// 📁 folderSlider.js (Scroll Native version – scroll snap, auto-scroll, hover pause, visibility-aware)
import { renderFolderCard } from "./folderCard.js";
import { renderRecentViewed } from "../core/ui.js";
import { getRootFolder, recentViewedKey } from "../core/storage.js";

/**
 * Hiển thị slider thư mục truyện bằng scroll native (scroll snap + auto-scroll chỉ khi visible và không hover)
 */
export function renderFolderSlider({ title, folders, showViews = false }) {
  const section = document.createElement("section");
  section.className = "folder-section slider";

  // === HEADER ===
  const header = document.createElement("div");
  header.className = "folder-section-header";

  const left = document.createElement("div");
  left.className = "slider-left";

  const h3 = document.createElement("h3");
  h3.className = "folder-section-title";
  h3.textContent = title;
  left.appendChild(h3);

  header.appendChild(left);

  // === Nếu là Random Banner thì thêm nút Refresh + timestamp ===
  if (title.includes("ngẫu nhiên") || title.includes("Mới đọc")) {
    const right = document.createElement("div");
    right.className = "slider-right";

    if (title.includes("ngẫu nhiên")) {
      const refreshBtn = document.createElement("button");
      refreshBtn.id = "refresh-random-btn";
      refreshBtn.textContent = "🔄 Refresh";
      refreshBtn.className = "small-button";
      right.appendChild(refreshBtn);

      const timestamp = document.createElement("span");
      timestamp.id = "random-timestamp";
      timestamp.className = "random-timestamp";
      timestamp.textContent = "";
      right.appendChild(timestamp);
    }

    if (title.includes("Mới đọc")) {

      const clearBtn = document.createElement("button");
      clearBtn.textContent = "🗑️ Xoá tất cả";
      clearBtn.className = "small-button";
      clearBtn.onclick = () => {
        const root = getRootFolder?.();
        if (!root) return;
        localStorage.removeItem(recentViewedKey());
        renderRecentViewed([]);
      };
      right.appendChild(clearBtn);
    }

    header.appendChild(right);
  }

  section.appendChild(header);

  // === SLIDER ===
  const sliderContainer = document.createElement("div");
  sliderContainer.style.position = "relative";

  const wrapper = document.createElement("div");
  wrapper.className = "slider-wrapper";
  wrapper.style.scrollSnapType = "x mandatory";
  wrapper.style.overflowX = "auto";

  folders.forEach((f) => {
    const card = renderFolderCard(f, showViews);
    card.style.scrollSnapAlign = "start";
    wrapper.appendChild(card);
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

  // === PAGINATION DOTS ===
  const dots = document.createElement("div");
  dots.className = "slider-pagination";
  section.appendChild(dots);

  const containerId = title.includes("ngẫu nhiên")
    ? "section-random"
    : title.includes("Xem nhiều")
    ? "section-topview"
    : "section-recent";

  const container = document.getElementById(containerId);
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

  // === AUTO SCROLL ===
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
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    },
    { threshold: 0.5 }
  );
  observer.observe(section);

  wrapper.addEventListener("mouseenter", stopAutoScroll);
  wrapper.addEventListener("mouseleave", startAutoScroll);
}
