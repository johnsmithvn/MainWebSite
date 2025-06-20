// 📁 /src/core/events.js

export function setupGlobalClickToCloseUI() {
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar-menu");
    const toggleBtn = document.getElementById("sidebarToggle");
    const isClickInsideSidebar = sidebar?.contains(e.target);
    const isClickToggleBtn = toggleBtn?.contains(e.target);

    if (sidebar?.classList.contains("active") && !isClickInsideSidebar && !isClickToggleBtn) {
      sidebar.classList.remove("active");
    }

    const searchDropdown = document.getElementById("search-dropdown");
    const searchInput = document.getElementById("floatingSearchInput");

    if (searchDropdown && searchInput) {
      const isClickInsideSearch =
        searchDropdown.contains(e.target) || searchInput.contains(e.target);

      if (!isClickInsideSearch) {
        searchDropdown.classList.add("hidden");
      }
    }
  });
}
