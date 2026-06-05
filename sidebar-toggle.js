(() => {
  const STORAGE_KEY = "smartHotelSidebarCollapsed";
  const appView = document.querySelector("#appView");
  const toggles = Array.from(document.querySelectorAll("[data-sidebar-toggle]"));
  const mobileQuery = window.matchMedia("(max-width: 720px)");
  let gestureStart = null;

  if (!appView || toggles.length === 0) return;

  function isMobile() {
    return mobileQuery.matches;
  }

  function setCollapsed(isCollapsed, options = {}) {
    const persist = options.persist ?? !isMobile();
    appView.classList.toggle("sidebar-is-collapsed", isCollapsed);
    appView.classList.toggle("sidebar-mobile-open", isMobile() && !isCollapsed);
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
      toggle.setAttribute("aria-label", isCollapsed ? "Open sidebar" : "Close sidebar");
    });
    if (persist && !isMobile()) {
      localStorage.setItem(STORAGE_KEY, isCollapsed ? "true" : "false");
    }
  }

  function toggleSidebar(event) {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!appView.classList.contains("sidebar-is-collapsed"), { persist: !isMobile() });
  }

  function syncSidebarForViewport() {
    if (isMobile()) {
      setCollapsed(true, { persist: false });
      return;
    }
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true", { persist: false });
  }

  function closeMobileSidebar(event) {
    if (!isMobile() || appView.classList.contains("sidebar-is-collapsed")) return;
    if (event.target.closest(".sidebar") || event.target.closest("[data-sidebar-toggle]")) return;
    setCollapsed(true, { persist: false });
  }

  function rememberGestureStart(clientX, clientY) {
    if (!isMobile() || appView.classList.contains("is-hidden")) return;
    gestureStart = {
      x: clientX,
      y: clientY,
      width: window.innerWidth,
      sidebarOpen: !appView.classList.contains("sidebar-is-collapsed"),
    };
  }

  function finishGesture(clientX, clientY) {
    if (!gestureStart || !isMobile()) {
      gestureStart = null;
      return;
    }

    const deltaX = clientX - gestureStart.x;
    const deltaY = clientY - gestureStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const fromLeftEdge = gestureStart.x <= 36;
    const fromRightEdge = gestureStart.x >= gestureStart.width - 36;

    if (absX > 44 && absX > absY * 1.08) {
      const openFromAnyRightSwipe = deltaX > 0;
      const openFromRightEdgeLeftSwipe = fromRightEdge && deltaX < 0;
      if (!gestureStart.sidebarOpen && (openFromAnyRightSwipe || openFromRightEdgeLeftSwipe || (fromLeftEdge && deltaX > 0))) {
        setCollapsed(false, { persist: false });
      } else if (gestureStart.sidebarOpen && deltaX < 0) {
        setCollapsed(true, { persist: false });
      }
    }

    gestureStart = null;
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    rememberGestureStart(touch.clientX, touch.clientY);
  }

  function handleTouchEnd(event) {
    if (event.changedTouches.length !== 1) {
      gestureStart = null;
      return;
    }
    const touch = event.changedTouches[0];
    finishGesture(touch.clientX, touch.clientY);
  }

  function handlePointerStart(event) {
    if (event.pointerType === "touch") return;
    rememberGestureStart(event.clientX, event.clientY);
  }

  function handlePointerEnd(event) {
    if (event.pointerType === "touch") return;
    finishGesture(event.clientX, event.clientY);
  }

  function closeMobileSidebarAfterNavigation(event) {
    if (!isMobile()) return;
    if (!event.target.closest("[data-section-link]")) return;
    setCollapsed(true, { persist: false });
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", toggleSidebar, { capture: true });
  });

  document.addEventListener("click", closeMobileSidebar);
  document.addEventListener("click", closeMobileSidebarAfterNavigation);
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
  document.addEventListener("pointerdown", handlePointerStart, { passive: true });
  document.addEventListener("pointerup", handlePointerEnd, { passive: true });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncSidebarForViewport);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(syncSidebarForViewport);
  }

  syncSidebarForViewport();
})();
