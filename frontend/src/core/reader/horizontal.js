import {
  toggleReaderUI,
  preloadAroundPage,
  updateReaderPageInfo,
} from "./utils.js";
import { getRootFolder, getSourceKey } from "/src/core/storage.js";
let clickTimer = null;

/**
 * 📖 Horizontal/Swipe Mode Reader – Virtual Slide + Zoom + Preload
 */
export function renderHorizontalReader(
  images,
  container,
  onPageChange = () => {},
  initialPage = 0,
  totalImages = images.length
) {
  if (!images || images.length === 0) return;
  console.log("✅ Swiper version:", window.Swiper?.version);

  container.innerHTML = "";
  container.classList.add("reader");

  const swiperContainer = document.createElement("div");
  swiperContainer.className = "swiper";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";
  swiperContainer.appendChild(swiperWrapper);
  container.appendChild(swiperContainer);

  const LIMIT = 200;
  let imagesList = [...images];

  function createSlide(src) {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.style.position = "relative";
    slide.style.zIndex = 10;

    const zoomWrapper = document.createElement("div");
    zoomWrapper.className = "pinch-zoom";

    const img = document.createElement("img");
    img.src = src;
    img.className = "loading";
    img.style.zIndex = 10;
    img.style.position = "relative";
    img.onload = () => img.classList.remove("loading");

    zoomWrapper.appendChild(img);
    slide.appendChild(zoomWrapper);
    return slide;
  }

  // ⚠️ Tránh renderSlide gây lỗi → dùng HTML chuỗi trực tiếp
  const slides = imagesList.map(createSlide);

  async function fetchMoreImages() {
    const offset = imagesList.length;
    if (offset >= totalImages) return [];

    const key = getSourceKey();
    const root = getRootFolder();
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get("path") || "";

    try {
      const res = await fetch(
        `/api/manga/folder-cache?mode=path&key=${encodeURIComponent(
          key
        )}&root=${encodeURIComponent(root)}&path=${encodeURIComponent(
          path
        )}&limit=${LIMIT}&offset=${offset}`
      );
      const data = await res.json();
      if (Array.isArray(data.images) && data.images.length > 0) {
        imagesList = imagesList.concat(data.images);
        const newSlides = data.images.map(createSlide);
        if (swiper) {
          swiper.virtual.appendSlide(newSlides);
          swiper.virtual.update();
        }
        return data.images;
      }
    } catch (err) {
      console.error("❌ load more images", err);
    }
    return [];
  }

  async function ensureLoaded(targetIndex) {
    while (targetIndex >= imagesList.length && imagesList.length < totalImages) {
      const added = await fetchMoreImages();
      if (added.length === 0) break;
    }
  }

  let swiper = null;
  let currentPage = initialPage;

  setTimeout(() => {
    swiper = new Swiper(swiperContainer, {
      initialSlide: currentPage,
      loop: false,
      virtual: {
        slides, // HTML dạng string
        renderSlide: (slide, index) => slide,
      },
      on: {
        slideChange: async () => {
          if (!swiper) return; // 👈 fix chắc chắn

          currentPage = swiper.activeIndex;

          if (
            imagesList.length < totalImages &&
            currentPage >= imagesList.length - 5
          ) {
            await fetchMoreImages();
          }

          preloadAroundPage(currentPage, imagesList);
          updateReaderPageInfo(currentPage + 1, totalImages);
          onPageChange(currentPage);

          setTimeout(initPinchZoom, 100);
        },
      },
    });

    // Đảm bảo render xong DOM
    setTimeout(() => {
      swiper.virtual.update();
      console.log(
        "🧩 DOM slide count:",
        document.querySelectorAll(".swiper-slide").length
      );
    }, 100);

    setTimeout(() => {
      const img = document.querySelector(".swiper-slide img");
      if (img) {
        img.onload = () => {
          document.getElementById("loading-overlay")?.classList.add("hidden");
        };
      }
    }, 1000);

    // Gọi lần đầu
    preloadAroundPage(currentPage, imagesList);
    updateReaderPageInfo(currentPage + 1, totalImages);
    onPageChange(currentPage);
    setTimeout(initPinchZoom, 100);

    container.__readerControl = {
      setCurrentPage: async (pageIndex) => {
        await ensureLoaded(pageIndex);
        if (swiper) swiper.slideTo(pageIndex);
      },
    };
  }, 50);
  // 🖱 Toggle UI khi click ảnh

  swiperContainer.addEventListener("click", (e) =>
    handleReaderClickEvent(e, swiperContainer, swiper)
  );

  return {
    async setCurrentPage(pageIndex) {
      if (swiper) {
        await ensureLoaded(pageIndex);
        currentPage = pageIndex;
        swiper.slideTo(pageIndex);
      } else {
        setTimeout(() => {
          container.__readerControl?.setCurrentPage?.(pageIndex);
        }, 100);
      }
    },
  };
}

/**
 * 🧠 Init lại pinch zoom cho ảnh hiển thị sau mỗi lần slide
 */
function initPinchZoom() {
  document.querySelectorAll(".pinch-zoom").forEach((el) => {
    if (!el.__pinchZoomInitialized) {
      el.__pinchZoomInitialized = true;
      new window.PinchZoom.default(el, {
        draggableUnzoomed: false,
        tapZoomFactor: 2,
      });
    }
  });
}

/**
 * 📌 Xử lý click 1 lần để prev/next/toggle UI
 *      và bỏ qua nếu là double click (zoom)
 * @param {MouseEvent} e
 * @param {HTMLElement} swiperContainer
 * @param {Swiper} swiper
 */
function handleReaderClickEvent(e, swiperContainer, swiper) {
  if (clickTimer !== null) {
    // 👉 double click → zoom → bỏ qua click đơn
    clickTimer = clearTimeout(clickTimer);
    return;
  }

  clickTimer = setTimeout(() => {
    clickTimer = null;

    const pinch = e.target.closest(".pinch-zoom");
    const scale = pinch?.style?.transform;

    if (!scale || scale.includes("scale(1")) {
      // 👉 Not zoomed → xử lý next/prev
      const { clientX } = e;
      const { width, left } = swiperContainer.getBoundingClientRect();
      const x = clientX - left;

      const THRESHOLD = width * 0.25;

      if (x < THRESHOLD) {
        swiper.slidePrev();
      } else if (x > width - THRESHOLD) {
        swiper.slideNext();
      } else {
        toggleReaderUI();
      }
    }
    // 👉 Nếu đang zoom thì không next/prev
  }, 120); // set timeout đẻ tránh conflig dbclic và click
}
