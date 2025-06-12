export function createMediaLoader(options) {
  const {
    appId,
    gridClass,
    rootTitle,
    perPage = 20,
    cacheMaxAge = 6 * 60 * 60 * 1000,
    getSourceKey,
    getCache,
    setCache,
    fetchUrl,
    renderCard,
    prepareItem,
  } = options;

  let page = 0;
  let fullList = [];
  let currentPath = "";

  function paginate(list) {
    return list.slice(page * perPage, (page + 1) * perPage);
  }

  function updatePaginationUI(currentPage, totalItems) {
    const totalPages = Math.ceil(totalItems / perPage);
    const app = document.getElementById(appId);
    if (!app) return;

    const oldControls = app.querySelector(".reader-controls");
    if (oldControls) oldControls.remove();
    const oldInfo = app.querySelector(".pagination-info");
    if (oldInfo) oldInfo.remove();

    const nav = document.createElement("div");
    nav.className = "reader-controls";

    const prev = document.createElement("button");
    prev.textContent = "⬅ Trang trước";
    prev.disabled = currentPage <= 0;
    prev.onclick = () => loadFolder(currentPath, currentPage - 1);
    nav.appendChild(prev);

    const jumpForm = document.createElement("form");
    jumpForm.style.display = "inline-block";
    jumpForm.style.margin = "0 10px";
    jumpForm.onsubmit = (e) => {
      e.preventDefault();
      const p = parseInt(jumpInput.value) - 1;
      if (!isNaN(p) && p >= 0) loadFolder(currentPath, p);
    };

    const jumpInput = document.createElement("input");
    jumpInput.type = "number";
    jumpInput.min = 1;
    jumpInput.max = totalPages;
    jumpInput.placeholder = "Trang...";
    jumpInput.style.width = "60px";

    const jumpBtn = document.createElement("button");
    jumpBtn.textContent = "⏩";
    jumpForm.appendChild(jumpInput);
    jumpForm.appendChild(jumpBtn);
    nav.appendChild(jumpForm);

    const next = document.createElement("button");
    next.textContent = "Trang sau ➡";
    next.disabled = currentPage + 1 >= totalPages;
    next.onclick = () => loadFolder(currentPath, currentPage + 1);
    nav.appendChild(next);

    app.appendChild(nav);

    const info = document.createElement("div");
    info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
    info.className = "pagination-info";
    info.style.textAlign = "center";
    info.style.marginTop = "10px";
    app.appendChild(info);
  }

  function renderGrid(list) {
    const app = document.getElementById(appId);
    if (!app) return;
    app.innerHTML = "";

    const parts = currentPath ? currentPath.split("/").filter(Boolean) : [];
    const title = document.createElement("h2");
    title.className = "folder-section-title";

    if (parts.length === 0) {
      title.textContent = rootTitle;
    } else {
      const folderName = parts.at(-1);
      title.textContent = "📁 " + folderName;
      title.title = folderName;
      title.style.cursor = "pointer";
      title.onclick = () => {
        const parent = parts.slice(0, -1).join("/");
        loadFolder(parent);
      };
    }

    app.appendChild(title);

    const grid = document.createElement("div");
    grid.className = gridClass;

    list.forEach((item) => {
      const data = prepareItem ? prepareItem(item) : item;
      const card = renderCard(data);
      grid.appendChild(card);
    });

    app.appendChild(grid);
  }

  function loadFolder(path = "", newPage = 0) {
    const key = getSourceKey();
    if (!key) {
      alert("Chưa chọn nguồn dữ liệu!");
      window.location.href = "/home.html";
      return;
    }

    currentPath = path;
    page = newPage;

    const cached = getCache(key, path);
    if (cached && (!cacheMaxAge || Date.now() - cached.timestamp < cacheMaxAge)) {
      fullList = cached.data || [];
      renderGrid(paginate(fullList));
      updatePaginationUI(page, fullList.length);
      return;
    }

    fetch(fetchUrl(key, path))
      .then((res) => res.json())
      .then((data) => {
        fullList = data.folders || [];
        setCache(key, path, fullList);
        renderGrid(paginate(fullList));
        updatePaginationUI(page, fullList.length);
      })
      .catch((err) => {
        console.error("❌ Failed to load folder:", err);
      });
  }

  return {
    loadFolder,
    get currentPath() {
      return currentPath;
    },
    get page() {
      return page;
    },
  };
}
