window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.overview = (() => {
  const BILL_SETTINGS_KEY = "smartBillDownloadSettings";

  let root = null;

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function defaultSettings() {
    return {
      password: "",
      passwordDate: todayKey(),
      passwordSavedAt: "",
      title: "Tax Invoice",
      accent: "#2563eb",
      layout: "classic",
      watermark: "SMART HOTEL",
      footer: "Thank you for dining with us."
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function loadSettings() {
    try {
      return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(BILL_SETTINGS_KEY) || "{}")) };
    } catch {
      return defaultSettings();
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(BILL_SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...settings }));
  }

  function hasActiveSecurityCode(settings) {
    return Boolean(settings.password && settings.passwordSavedAt);
  }

  function modal() {
    return root.querySelector("#overviewToolModal");
  }

  function closeTool() {
    const target = modal();
    if (!target) return;
    target.classList.add("is-hidden");
    target.innerHTML = "";
  }

  function openPasswordTool() {
    const settings = loadSettings();
    const current = hasActiveSecurityCode(settings);
    const activeDate = settings.passwordDate || todayKey();
    const activePassword = settings.password || "";
    const note = current
      ? "This security code stays active until the owner changes and saves a new code."
      : "No security code is active. Downloads and bill sharing are locked until the owner saves one.";
    modal().classList.remove("is-hidden");
    modal().innerHTML = `
      <section class="overview-tool-panel" role="dialog" aria-modal="true" aria-label="Bill security code">
        <div class="overview-tool-heading">
          <div>
            <h3>Bill Security Code</h3>
            <p>This owner security code protects e-bill downloads and bill sharing until the owner changes it.</p>
          </div>
          <button class="overview-tool-close" type="button" data-close-overview-tool aria-label="Close">x</button>
        </div>
        <form class="overview-tool-form" data-bill-password-form>
          <label>
            Code start date
            <input name="passwordDate" type="date" value="${escapeHtml(activeDate)}" required />
          </label>
          <label>
            Download security code
            <input name="password" type="text" value="${escapeHtml(activePassword)}" placeholder="Set owner code" required />
          </label>
          <button class="primary-button" type="submit">Save security code</button>
        </form>
        <p class="overview-tool-note">${escapeHtml(note)}</p>
      </section>
    `;
  }

  function openDesignTool() {
    const settings = loadSettings();
    modal().classList.remove("is-hidden");
    modal().innerHTML = `
      <section class="overview-tool-panel" role="dialog" aria-modal="true" aria-label="Bill PDF design">
        <div class="overview-tool-heading">
          <div>
            <h3>Bill PDF Design</h3>
            <p>Customize the printable bill design used by PDF bill and protected e-bill downloads.</p>
          </div>
          <button class="overview-tool-close" type="button" data-close-overview-tool aria-label="Close">x</button>
        </div>
        <form class="overview-tool-form" data-bill-design-form>
          <label>
            Bill title
            <input name="title" value="${escapeHtml(settings.title)}" placeholder="Tax Invoice" required />
          </label>
          <label>
            Accent color
            <input name="accent" type="color" value="${escapeHtml(settings.accent || "#2563eb")}" />
          </label>
          <label>
            Layout style
            <select name="layout">
              <option value="classic" ${settings.layout === "classic" ? "selected" : ""}>Classic</option>
              <option value="compact" ${settings.layout === "compact" ? "selected" : ""}>Compact</option>
              <option value="premium" ${settings.layout === "premium" ? "selected" : ""}>Premium</option>
            </select>
          </label>
          <label>
            Watermark text
            <input name="watermark" value="${escapeHtml(settings.watermark)}" placeholder="SMART HOTEL" />
          </label>
          <label class="full-row">
            Footer / thank you message
            <textarea name="footer" placeholder="Thank you for dining with us.">${escapeHtml(settings.footer)}</textarea>
          </label>
          <button class="primary-button" type="submit">Save bill design</button>
        </form>
      </section>
    `;
  }

  function handleClick(event) {
    const tool = event.target.closest("[data-overview-tool]");
    if (tool) {
      if (tool.dataset.overviewTool === "password") openPasswordTool();
      if (tool.dataset.overviewTool === "design") openDesignTool();
      return;
    }

    if (event.target.closest("[data-close-overview-tool]") || event.target === modal()) {
      closeTool();
    }
  }

  function handleSubmit(event) {
    const passwordForm = event.target.closest("[data-bill-password-form]");
    if (passwordForm) {
      event.preventDefault();
      const data = new FormData(passwordForm);
      saveSettings({
        passwordDate: String(data.get("passwordDate") || todayKey()),
        password: String(data.get("password") || "").trim(),
        passwordSavedAt: new Date().toISOString()
      });
      closeTool();
      alert("Daily e-bill password saved.");
      return;
    }

    const designForm = event.target.closest("[data-bill-design-form]");
    if (designForm) {
      event.preventDefault();
      const data = new FormData(designForm);
      saveSettings({
        title: String(data.get("title") || "Tax Invoice").trim(),
        accent: String(data.get("accent") || "#2563eb"),
        layout: String(data.get("layout") || "classic"),
        watermark: String(data.get("watermark") || "").trim(),
        footer: String(data.get("footer") || "").trim()
      });
      closeTool();
      alert("Bill PDF design saved.");
    }
  }

  function init(mount) {
    root = mount;
    root.removeEventListener("click", handleClick);
    root.removeEventListener("submit", handleSubmit);
    root.addEventListener("click", handleClick);
    root.addEventListener("submit", handleSubmit);
  }

  return { init };
})();
