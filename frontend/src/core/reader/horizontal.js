import {
  toggleReaderUI,
  preloadAroundPage,
  updateReaderPageInfo,
} from "./utils.js";
let clickTimer = null;

/**
 * 📖 Horizontal/Swipe Mode Reader – Virtual Slide + Zoom + Preload
 */
export function renderHorizontalReader(
  images,
  container,
  onPageChange = () => {},
  initialPage = 0
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

  // ⚠️ Tránh renderSlide gây lỗi → dùng HTML chuỗi trực tiếp
  const slides = images.map((src) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.style.position = "relative";
    slide.style.zIndex = 10;

    const zoomWrapper = document.createElement("div");
    zoomWrapper.className = "pinch-zoom";

    const img = document.createElement("img");
    img.dataset.src = src; // 🚫 Không gán src ngay để tránh load toàn bộ
    img.className = "loading";
    img.style.zIndex = 10;
    img.style.position = "relative";

    zoomWrapper.appendChild(img);
    slide.appendChild(zoomWrapper);
    return slide;
  });

  function loadSlidesAround(page, range = 10) {
    const start = Math.max(0, page - range);
    const end = Math.min(slides.length - 1, page + range);

    slides.forEach((slide, index) => {
      const img = slide.querySelector("img");
      if (!img) return;

      if (index >= start && index <= end) {
        if (!img.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.remove("loading");
        }
      } else if (img.src) {
        img.removeAttribute("src");
        img.classList.add("loading");
      }
    });
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
        slideChange: () => {
          if (!swiper) return; // 👈 fix chắc chắn

          currentPage = swiper.activeIndex;
          loadSlidesAround(currentPage);
          preloadAroundPage(currentPage, images);
          updateReaderPageInfo(currentPage + 1, images.length);
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
      loadSlidesAround(currentPage);
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
    loadSlidesAround(currentPage);
    preloadAroundPage(currentPage, images);
    updateReaderPageInfo(currentPage + 1, images.length);
    onPageChange(currentPage);
    setTimeout(initPinchZoom, 100);

    container.__readerControl = {
      setCurrentPage: (pageIndex) => {
        if (swiper) {
          loadSlidesAround(pageIndex);
          swiper.slideTo(pageIndex);
        }
      },
    };
  }, 50);
  // 🖱 Toggle UI khi click ảnh

  swiperContainer.addEventListener("click", (e) =>
    handleReaderClickEvent(e, swiperContainer, swiper)
  );

  return {
    setCurrentPage(pageIndex) {
      if (swiper) {
        currentPage = pageIndex;
        loadSlidesAround(pageIndex);
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
