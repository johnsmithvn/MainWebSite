import { toggleReaderUI, updateReaderPageInfo } from "./utils.js";

const imagesPerPage = 200;
const lazyBatchSize = 50;

// Hàng đợi load ảnh tuần tự
let loadQueue = [];
let isLoadingQueue = false;

function enqueueImages(imgs) {
  loadQueue.push(...imgs);
  if (!isLoadingQueue) loadNext();
}

function loadNext() {
  const img = loadQueue.shift();
  if (!img) {
    isLoadingQueue = false;
    return;
  }
  isLoadingQueue = true;
  const spinner = img.parentElement.querySelector(".spinner");
  const clear = () => {
    img.classList.remove("loading");
    spinner?.remove();
    loadNext();
  };
  img.onload = clear;
  img.onerror = clear;
  img.src = img.dataset.src;
}

/**
 * 📖 Scroll Mode Reader
 * @param {Array} images
 * @param {HTMLElement} container
 * @param {function} onPageChange
 * @param {number} startPageIndex
 * @returns {{ setCurrentPage: function }}
 */
export function renderScrollReader(
  images,
  container,
  onPageChange = () => {},
  startPageIndex = 0
) {
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(images.slice(i * imagesPerPage, (i + 1) * imagesPerPage));
  }

  const wrapper = document.createElement("div");
  wrapper.className = "reader scroll-mode";
  container.appendChild(wrapper);

  let currentPageIndex = startPageIndex;
  renderScrollPage(pages[currentPageIndex]);

  setupScrollLazyLoad(wrapper, pages[currentPageIndex]);
  syncScrollState();

  wrapper.addEventListener("click", toggleReaderUI);
  window.onscroll = syncScrollState;

  const pageInfo = document.getElementById("page-info");
  if (pageInfo) {
    pageInfo.style.cursor = "pointer";
    pageInfo.onclick = null; // 🧹 xoá sự kiện cũ trước khi gán mới
    pageInfo.onclick = () => showPageModal();
    updateReaderPageInfo(currentPageIndex + 1, totalPages);
  }

  function renderScrollPage(imageList) {
    wrapper.innerHTML = "";
    const imgs = [];
    for (let i = 0; i < imageList.length; i++) {
      const wrap = document.createElement("div");
      wrap.className = "scroll-img-wrapper";

      const img = document.createElement("img");
      img.dataset.src = imageList[i];
      img.className = "scroll-img loading";
      img.loading = "lazy";
      wrap.appendChild(img);

      const spinner = document.createElement("div");
      spinner.className = "spinner";
      wrap.appendChild(spinner);

      wrapper.appendChild(wrap);
      imgs.push(img);
    }
    enqueueImages(imgs);
  }

  function setupScrollLazyLoad(wrapper, imagesInPage) {
    const getLoaded = () => wrapper.querySelectorAll("img.scroll-img").length;

    window.onscroll = () => {
      const last = wrapper.lastElementChild;
      if (!last) return;
      const rect = last.getBoundingClientRect();
      if (rect.bottom < window.innerHeight + 300) {
        const loaded = getLoaded();
        const toLoad = imagesInPage.slice(loaded, loaded + lazyBatchSize);
        const imgs = [];
        for (const src of toLoad) {
          const wrap = document.createElement("div");
          wrap.className = "scroll-img-wrapper";

          const img = document.createElement("img");
          img.dataset.src = src;
          img.className = "scroll-img loading";
          img.loading = "lazy";
          wrap.appendChild(img);

          const spinner = document.createElement("div");
          spinner.className = "spinner";
          wrap.appendChild(spinner);

          wrapper.appendChild(wrap);
          imgs.push(img);
        }
        enqueueImages(imgs);
      }

      syncScrollState();
    };
  }

  function syncScrollState() {
    const imgs = wrapper.querySelectorAll(".scroll-img");
    const screenCenter = window.innerHeight / 2;

    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < imgs.length; i++) {
      const rect = imgs[i].getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - screenCenter);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const globalIndex = currentPageIndex * imagesPerPage + nearestIndex;
    const totalImages = images.length;
    const countInfo = document.getElementById("image-count-info");
    if (countInfo) {
      countInfo.textContent = `Ảnh ${globalIndex + 1} / ${totalImages} (Hiện: ${
        imgs.length
      })`;
    }

    onPageChange(globalIndex);
  }

  function switchScrollPage(index) {
    currentPageIndex = index;
    renderScrollPage(pages[currentPageIndex]);
    setupScrollLazyLoad(wrapper, pages[currentPageIndex]);
    updateReaderPageInfo(currentPageIndex + 1, totalPages);
    scrollTo(wrapper);
  }

  function scrollTo(elem) {
    const rect = elem.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    window.scrollTo({ top, behavior: "instant" });
  }

  function showPageModal() {
    const modal = document.createElement("div");
    modal.className = "scroll-page-modal";
    Object.assign(modal.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
      background: "white",
      padding: "20px",
      borderRadius: "10px",
      maxHeight: "80vh",
      overflowY: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
      gap: "10px",
      maxWidth: "400px",
    });

    for (let i = 0; i < totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}`;
      btn.onclick = () => {
        switchScrollPage(i);
        modal.remove();
      };
      box.appendChild(btn);
    }

    const wrapperDiv = document.createElement("div");
    wrapperDiv.appendChild(box);
    modal.appendChild(wrapperDiv);

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
  }

  function setCurrentPage(index) {
    const targetPage = Math.floor(index / imagesPerPage);
    currentPageIndex = targetPage; // 🛠️ cập nhật page chính xác
    switchScrollPage(targetPage);
    updateReaderPageInfo(currentPageIndex + 1, totalPages); // 🧠 cập nhật lại Trang X/Y
  }

  return { setCurrentPage };
}
