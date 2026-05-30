window.smartHotelBookingMap = (() => {
  const minZoom = 0.55;
  const maxZoom = 1.7;
  const zoomStep = 0.15;
  const baseWidth = 1180;
  const baseHeight = 560;
  const zooms = new Map();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getZoom(stageId) {
    return zooms.get(stageId) || 1;
  }

  function setZoom(stageId, value) {
    const next = Math.round(clamp(Number(value) || 1, minZoom, maxZoom) * 100) / 100;
    zooms.set(stageId, next);
    return next;
  }

  function adjustZoom(stageId, direction) {
    return setZoom(stageId, getZoom(stageId) + (direction * zoomStep));
  }

  function resetZoom(stageId) {
    return setZoom(stageId, 1);
  }

  function canvasSize(stageId, media = null) {
    const zoom = getZoom(stageId);
    if (media?.width && media?.height) {
      const aspect = media.width / media.height;
      const maxWidth = 1180;
      const maxHeight = 720;
      let width = maxWidth;
      let height = width / aspect;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
      }

      if (height < 420) {
        height = 420;
        width = height * aspect;
      }

      return {
        width: Math.round(width * zoom),
        height: Math.round(height * zoom),
        zoom
      };
    }

    return {
      width: Math.round(baseWidth * zoom),
      height: Math.round(baseHeight * zoom),
      zoom
    };
  }

  function zoomControls(stageId) {
    const zoom = Math.round(getZoom(stageId) * 100);
    return `
      <div class="layout-zoom-controls" aria-label="Room map zoom controls">
        <button class="tiny-button" type="button" data-layout-zoom="out" data-layout-stage="${stageId}" title="Zoom out">−</button>
        <span class="layout-zoom-badge">${zoom}%</span>
        <button class="tiny-button" type="button" data-layout-zoom="in" data-layout-stage="${stageId}" title="Zoom in">+</button>
        <button class="tiny-button" type="button" data-layout-zoom="reset" data-layout-stage="${stageId}" title="Reset zoom">Reset</button>
      </div>
    `;
  }

  function typeLabel(type) {
    return {
      wall: "Thin divider line",
      road: "Thin road / corridor",
      gate: "Door / gate"
    }[type] || "Map element";
  }

  function clampWidth(type, width) {
    const fallback = type === "gate" ? 18 : type === "road" ? 48 : 34;
    return clamp(Number(width) || fallback, 8, 90);
  }

  function elementDefaults(input) {
    const type = ["wall", "road", "gate"].includes(input.type) ? input.type : "wall";
    const count = Number(input.count) || 0;
    const labels = {
      wall: "Divider",
      road: "Road",
      gate: "Door"
    };
    return {
      id: `map-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      roomId: input.roomId,
      type,
      label: String(input.label || "").trim() || labels[type],
      x: 18 + ((count * 17) % 64),
      y: 24 + ((count * 13) % 56),
      width: clampWidth(type, input.width),
      rotation: Number(input.orientation) || 0,
      image: ""
    };
  }

  return {
    adjustZoom,
    canvasSize,
    clampWidth,
    elementDefaults,
    getZoom,
    resetZoom,
    setZoom,
    typeLabel,
    zoomControls
  };
})();
