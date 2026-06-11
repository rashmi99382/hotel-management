(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const createLayer = (card) => {
    const grid = clamp(Number.parseInt(card.dataset.gridSize || "14", 10) || 14, 10, 20);
    const pixelColor = card.dataset.pixelColor || "#111827";
    const stepDuration = Number.parseFloat(card.dataset.animationStepDuration || "0.52") || 0.52;

    card.style.setProperty("--pixel-color", pixelColor);
    card.style.setProperty("--pixel-step", `${stepDuration}s`);

    let layer = card.querySelector(".pixel-transition-layer");
    if (layer) {
      return { layer, grid, stepDuration };
    }

    layer = document.createElement("span");
    layer.className = "pixel-transition-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.gridTemplateColumns = `repeat(${grid}, 1fr)`;
    layer.style.gridTemplateRows = `repeat(${grid}, 1fr)`;

    const center = (grid - 1) / 2;
    const maxDistance = Math.max(1, Math.hypot(center, center));

    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        const block = document.createElement("span");
        block.className = "pixel-transition-block";
        const distance = Math.hypot(x - center, y - center) / maxDistance;
        const jitter = ((x * 7 + y * 11) % 9) / 100;
        block.style.setProperty("--pixel-delay", `${distance * 0.22 + jitter}s`);
        layer.appendChild(block);
      }
    }

    card.appendChild(layer);
    return { layer, grid, stepDuration };
  };

  const triggerTransition = (card) => {
    if (card.dataset.pixelLocked === "true") {
      return;
    }

    const { stepDuration } = createLayer(card);
    card.dataset.pixelLocked = "true";
    card.classList.remove("is-pixelating");
    void card.offsetWidth;
    card.classList.add("is-pixelating");

    window.setTimeout(() => {
      card.classList.remove("is-pixelating");
      card.dataset.pixelLocked = "false";
    }, (stepDuration + 0.42) * 1000);
  };

  const initPixelTransitions = () => {
    document.querySelectorAll("[data-pixel-transition]").forEach((card) => {
      createLayer(card);

      if (!card.hasAttribute("tabindex")) {
        card.setAttribute("tabindex", "0");
      }

      card.addEventListener("pointerenter", () => triggerTransition(card));
      card.addEventListener("click", () => triggerTransition(card));
      card.addEventListener("focus", () => triggerTransition(card));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPixelTransitions, { once: true });
  } else {
    initPixelTransitions();
  }
})();
