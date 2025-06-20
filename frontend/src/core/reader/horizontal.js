import {
  toggleReaderUI,
  preloadAroundPage,
  updateReaderPageInfo,
} from "./utils.js";
let clickTimer = null;
const VISIBLE_RANGE = 5;

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
  const slides = images.map(
    (src) => `
      <div class="swiper-slide" style="position:relative;z-index:10;">
        <div class="pinch-zoom">
          <img data-src="${src}" class="loading" style="position:relative;z-index:10;" />
        </div>
      </div>
    `
  );

  let swiper = null;
  let currentPage = initialPage;
  const handleClick = (e) =>
    handleReaderClickEvent(e, swiperContainer, swiper);

  setTimeout(() => {
    swiper = new Swiper(swiperContainer, {
      initialSlide: currentPage,
      loop: false,
      virtual: {
        slides,
        renderSlide: (slide) => slide,
        addSlidesBefore: VISIBLE_RANGE,
        addSlidesAfter: VISIBLE_RANGE,
      },
      on: {
        slideChange: () => {
          if (!swiper) return;

          currentPage = swiper.activeIndex;
          preloadAroundPage(currentPage, images);
          updateReaderPageInfo(currentPage + 1, images.length);
          onPageChange(currentPage);

          loadImagesAround(currentPage, images, swiperWrapper);
          setTimeout(initPinchZoom, 100);
        },
        virtualUpdate: () => {
          loadImagesAround(currentPage, images, swiperWrapper);
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
    preloadAroundPage(currentPage, images);
    updateReaderPageInfo(currentPage + 1, images.length);
    onPageChange(currentPage);
    loadImagesAround(currentPage, images, swiperWrapper);
    setTimeout(initPinchZoom, 100);

    container.__readerControl = {
      setCurrentPage: (pageIndex) => {
        if (swiper) swiper.slideTo(pageIndex);
      },
    };
  }, 50);
  // 🖱 Toggle UI khi click ảnh

  swiperContainer.addEventListener("click", handleClick);

  return {
    setCurrentPage(pageIndex) {
      if (swiper) {
        currentPage = pageIndex;
        swiper.slideTo(pageIndex);
        loadImagesAround(pageIndex, images, swiperWrapper);
      } else {
        setTimeout(() => {
          container.__readerControl?.setCurrentPage?.(pageIndex);
        }, 100);
      }
    },
    destroy() {
      swiperContainer.removeEventListener("click", handleClick);
      if (swiper) {
        swiper.destroy(true, true);
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

function loadImagesAround(page, images, wrapper) {
  if (!wrapper) return;
  const start = Math.max(0, page - VISIBLE_RANGE);
  const end = Math.min(images.length - 1, page + VISIBLE_RANGE);

  for (let i = start; i <= end; i++) {
    const slide = wrapper.querySelector(
      `.swiper-slide[data-swiper-slide-index="${i}"] img`
    );
    if (slide && !slide.src) {
      slide.src = slide.dataset.src;
      slide.onload = () => slide.classList.remove("loading");
    }
  }
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
