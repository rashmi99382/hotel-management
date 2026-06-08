const authCanvas = document.querySelector("#authLaserCanvas");
const authCard = document.querySelector(".auth-card");

if (authCanvas) {
  const ctx = authCanvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointerX = 0.5;
  let pointerY = 0.5;
  const wisps = Array.from({ length: 26 }, (_, index) => ({
    lane: (index % 13) - 6,
    phase: Math.random() * Math.PI * 2,
    speed: 0.22 + Math.random() * 0.42,
    length: 0.08 + Math.random() * 0.18,
    alpha: 0.25 + Math.random() * 0.55
  }));

  function resizeAuthLaser() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = authCanvas.clientWidth || window.innerWidth;
    height = authCanvas.clientHeight || window.innerHeight;
    authCanvas.width = Math.max(1, Math.floor(width * dpr));
    authCanvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lineGradient(x0, y0, x1, y1, stops) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    return gradient;
  }

  function roundedRectPath(x, y, rectWidth, rectHeight, radius) {
    const safeRadius = Math.min(radius, rectWidth / 2, rectHeight / 2);
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + rectWidth - safeRadius, y);
    ctx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + safeRadius);
    ctx.lineTo(x + rectWidth, y + rectHeight - safeRadius);
    ctx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - safeRadius, y + rectHeight);
    ctx.lineTo(x + safeRadius, y + rectHeight);
    ctx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  }

  function drawFog(time) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 9; i += 1) {
      const x = width * (0.14 + i * 0.11) + Math.sin(time * 0.0004 + i) * 80;
      const y = height * (0.56 + Math.sin(time * 0.00031 + i * 0.7) * 0.08);
      const radius = Math.max(width, height) * (0.12 + i * 0.008);
      const fog = ctx.createRadialGradient(x, y, 0, x, y, radius);
      fog.addColorStop(0, "rgba(207,158,255,0.12)");
      fog.addColorStop(0.44, "rgba(255,121,198,0.045)");
      fog.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPanelGrid() {
    const panelWidth = Math.min(width * 0.84, 1120);
    const panelHeight = 300;
    const panelX = (width - panelWidth) / 2;
    const panelY = height - panelHeight + 78;

    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = "rgba(207,158,255,0.56)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundedRectPath(panelX, panelY, panelWidth, panelHeight, 28);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(207,158,255,0.65)";
    for (let y = panelY + 34; y < height; y += 22) {
      for (let x = panelX + 34; x < panelX + panelWidth - 20; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawLaser(time) {
    const centerX = width * (0.5 + (pointerX - 0.5) * 0.03);
    const floorY = height * 0.64;
    const beamTop = -20;
    const pulse = 0.78 + Math.sin(time * 0.0022) * 0.22;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const vertical = lineGradient(centerX, beamTop, centerX, floorY, [
      [0, "rgba(141,92,255,0)"],
      [0.56, "rgba(207,158,255,0.3)"],
      [0.86, `rgba(255,255,255,${0.82 * pulse})`],
      [1, "rgba(207,158,255,0.08)"]
    ]);
    ctx.strokeStyle = vertical;
    ctx.lineCap = "round";

    [3, 12, 34, 82].forEach((lineWidth, index) => {
      ctx.globalAlpha = [1, 0.34, 0.16, 0.08][index];
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(centerX, beamTop);
      ctx.bezierCurveTo(centerX - 6, height * 0.34, centerX + 7, height * 0.52, centerX, floorY);
      ctx.stroke();
    });

    const horizontal = lineGradient(width * 0.06, floorY, width * 0.94, floorY, [
      [0, "rgba(141,92,255,0)"],
      [0.38, "rgba(207,158,255,0.22)"],
      [0.5, "rgba(255,255,255,0.9)"],
      [0.62, "rgba(207,158,255,0.22)"],
      [1, "rgba(141,92,255,0)"]
    ]);
    ctx.strokeStyle = horizontal;
    [2, 14, 46].forEach((lineWidth, index) => {
      ctx.globalAlpha = [1, 0.22, 0.08][index];
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(width * 0.07, floorY);
      ctx.lineTo(width * 0.93, floorY);
      ctx.stroke();
    });

    wisps.forEach((wisp) => {
      const progress = (time * 0.00016 * wisp.speed + wisp.phase) % 1;
      const y = beamTop + (floorY - beamTop) * progress;
      const flare = Math.max(0, 1 - Math.abs(floorY - y) / 120);
      const x = centerX + wisp.lane * (2.4 + flare * 12);
      ctx.globalAlpha = wisp.alpha * (0.15 + flare * 0.85);
      ctx.lineWidth = 1 + flare * 2;
      ctx.strokeStyle = "rgba(255,255,255,0.86)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height * wisp.length);
      ctx.stroke();
    });
    ctx.restore();
  }

  function renderAuthLaser(time) {
    ctx.clearRect(0, 0, width, height);
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#080711");
    base.addColorStop(0.52, "#120f17");
    base.addColorStop(1, "#090812");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    drawFog(time);
    drawPanelGrid();
    drawLaser(time);
    requestAnimationFrame(renderAuthLaser);
  }

  function movePointer(event) {
    pointerX = event.clientX / Math.max(window.innerWidth, 1);
    pointerY = event.clientY / Math.max(window.innerHeight, 1);
    if (authCard) {
      const rect = authCard.getBoundingClientRect();
      authCard.style.setProperty("--auth-mx", `${event.clientX - rect.left}px`);
      authCard.style.setProperty("--auth-my", `${event.clientY - rect.top}px`);
    }
  }

  window.addEventListener("resize", resizeAuthLaser);
  window.addEventListener("pointermove", movePointer, { passive: true });
  resizeAuthLaser();
  requestAnimationFrame(renderAuthLaser);
}
