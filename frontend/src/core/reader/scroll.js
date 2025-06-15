import { toggleReaderUI, updateReaderPageInfo } from "./utils.js";

const imagesPerPage = 200;

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

  setupScrollLazyLoad(wrapper);
  syncScrollState();

  wrapper.addEventListener("click", toggleReaderUI);
  window.onscroll = syncScrollState;

  const pageInfo = document.getElementById("page-info");
  const prevPageBtn = document.getElementById("prev-page-btn");
  const nextPageBtn = document.getElementById("next-page-btn");
  if (pageInfo) {
    pageInfo.style.cursor = "pointer";
    pageInfo.onclick = null; // 🧹 xoá sự kiện cũ trước khi gán mới
    pageInfo.onclick = () => showPageModal();
    updateReaderPageInfo(currentPageIndex + 1, totalPages);
  }

  if (prevPageBtn && nextPageBtn) {
    if (totalPages > 1) {
      prevPageBtn.classList.remove("hidden");
      nextPageBtn.classList.remove("hidden");
    }
    prevPageBtn.onclick = () => {
      if (currentPageIndex > 0) switchScrollPage(currentPageIndex - 1);
    };
    nextPageBtn.onclick = () => {
      if (currentPageIndex < totalPages - 1)
        switchScrollPage(currentPageIndex + 1);
    };
    updateNavButtons();
  }

  function renderScrollPage(imageList) {
    wrapper.innerHTML = "";

    let index = 0;

    function loadNext() {
      if (index >= imageList.length) return;

      const img = document.createElement("img");
      img.className = "scroll-img loading";
      img.loading = "lazy";
      img.onload = () => {
        img.classList.remove("loading");
        index++;
        loadNext();
      };
      img.src = imageList[index];
      wrapper.appendChild(img);
    }

    loadNext();
  }

  function setupScrollLazyLoad(wrapper) {
    window.onscroll = () => {
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
    setupScrollLazyLoad(wrapper);
    updateReaderPageInfo(currentPageIndex + 1, totalPages);
    updateNavButtons();
    scrollTo(wrapper);
  }

  function updateNavButtons() {
    if (!prevPageBtn || !nextPageBtn) return;
    prevPageBtn.disabled = currentPageIndex === 0;
    nextPageBtn.disabled = currentPageIndex >= totalPages - 1;
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

    const nav = document.createElement("div");
    nav.style.textAlign = "center";
    nav.style.marginTop = "12px";

    const prev = document.createElement("button");
    const next = document.createElement("button");
    prev.textContent = "⬅ Prev";
    next.textContent = "Next ➡";
    prev.onclick = () => {
      if (currentPageIndex > 0) switchScrollPage(currentPageIndex - 1);
    };
    next.onclick = () => {
      if (currentPageIndex < totalPages - 1)
        switchScrollPage(currentPageIndex + 1);
    };

    nav.appendChild(prev);
    nav.appendChild(next);

    const wrapperDiv = document.createElement("div");
    wrapperDiv.appendChild(box);
    wrapperDiv.appendChild(nav);
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
