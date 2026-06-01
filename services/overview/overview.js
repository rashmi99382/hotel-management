window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.overview = (() => {
  const BILL_SETTINGS_KEY = "smartBillDownloadSettings";
  const BOOKING_KEY = "smartTableBookingCustomerState";
  const MENU_KEY = "smartQrMenuSystemState";
  const INVENTORY_KEY = "smartInventoryCostSystemState";
  const ATTENDANCE_KEY = "smartAttendanceSystemState";
  const CAREER_KEY = "smartHotelCareerPlatformState";

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

  function readJson(key, fallback = {}) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function number(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function roomBookingApproved(booking) {
    return booking?.status === "approved" || booking?.status === "booked";
  }

  function renderSummaries() {
    const target = root.querySelector("#overviewSummaryGrid");
    if (!target) return;
    const booking = readJson(BOOKING_KEY, {});
    const menu = readJson(MENU_KEY, {});
    const inventory = readJson(INVENTORY_KEY, {});
    const attendance = readJson(ATTENDANCE_KEY, {});
    const jobs = readJson(CAREER_KEY, {});

    const roomBookings = Array.isArray(booking.roomBookings) ? booking.roomBookings : [];
    const pendingRooms = roomBookings.filter((item) => item.status === "pending").length;
    const approvedRooms = roomBookings.filter(roomBookingApproved).length;
    const foodItems = Array.isArray(menu.foodItems) ? menu.foodItems : [];
    const categories = Array.isArray(menu.categories) ? menu.categories : [];
    const products = Array.isArray(inventory.products) ? inventory.products : [];
    const entries = Array.isArray(inventory.entries) ? inventory.entries : [];
    const lowStock = products.filter((item) => Number(item.stock || 0) <= Number(item.lowAlert || 0)).length;
    const employees = Array.isArray(attendance.employees) ? attendance.employees : [];
    const todayRecords = (Array.isArray(attendance.attendance) ? attendance.attendance : []).filter((record) => record.date === todayKey());
    const jobsList = Array.isArray(jobs.jobs) ? jobs.jobs : [];
    const openJobs = jobsList.filter((job) => (job.status || "Open") === "Open").length;
    const applications = Array.isArray(jobs.applications) ? jobs.applications : [];

    const cards = [
      {
        value: number(approvedRooms),
        title: "Booking QR",
        text: `${pendingRooms} pending requests, ${(booking.rooms || []).length || 0} rooms, ${(booking.floors || []).length || 0} floors.`
      },
      {
        value: number(foodItems.length),
        title: "QR Menu",
        text: `${categories.length || 0} categories, ${menu.hotel?.registered ? "hotel registered" : "hotel not registered"}.`
      },
      {
        value: number(products.length),
        title: "Inventory",
        text: `${entries.length} stock entries, ${lowStock} low-stock alerts.`
      },
      {
        value: number(todayRecords.filter((record) => record.status === "present").length),
        title: "Attendance",
        text: `${employees.length} employees, ${todayRecords.filter((record) => !record.reviewed).length} pending approvals.`
      },
      {
        value: number(openJobs),
        title: "Jobs",
        text: `${applications.length} applications, ${jobsList.filter((job) => job.urgent).length} urgent posts.`
      }
    ];

    target.innerHTML = cards.map((card) => `
      <article class="summary-card">
        <span>${escapeHtml(card.value)}</span>
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.text)}</p>
      </article>
    `).join("");
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
    renderSummaries();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("submit", handleSubmit);
    root.addEventListener("click", handleClick);
    root.addEventListener("submit", handleSubmit);
  }

  return { init };
})();
