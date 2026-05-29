(() => {
  const STORAGE_KEY = "smartHotelSidebarCollapsed";
  const appView = document.querySelector("#appView");
  const toggles = Array.from(document.querySelectorAll("[data-sidebar-toggle]"));

  if (!appView || toggles.length === 0) return;

  function setCollapsed(isCollapsed) {
    appView.classList.toggle("sidebar-is-collapsed", isCollapsed);
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
      toggle.setAttribute("aria-label", isCollapsed ? "Open sidebar" : "Close sidebar");
    });
    localStorage.setItem(STORAGE_KEY, isCollapsed ? "true" : "false");
  }

  function toggleSidebar(event) {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!appView.classList.contains("sidebar-is-collapsed"));
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", toggleSidebar, { capture: true });
  });

  setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
})();
