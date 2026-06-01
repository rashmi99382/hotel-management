window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.inventory = (() => {
  const STORAGE_KEY = "smartInventoryCostSystemState";
  const IMAGE_LIMIT = 2 * 1024 * 1024;
  const categories = ["Vegetables", "Meat", "Drinks", "Grocery", "Cleaning Items", "Other Kitchen Items"];
  const productColors = ["#dc2626", "#0f9f6e", "#2563eb", "#f59e0b", "#f97316", "#0891b2", "#7c3aed", "#be123c"];

  let root = null;
  let state = loadState();
  let activeView = "simple";
  let activeAdvanceView = "products";
  let inventorySearch = "";
  let categoryFilter = "All";
  let selectedGraphProduct = "";
  let currentStaffId = "";
  let simpleSelectedDate = todayKey();
  let simpleCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let simpleProductText = "";
  let simpleCustomUnit = "KG";
  let activeSimpleReportInsight = null;

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
  }

  function todayKey() {
    const now = new Date();
    return dateKey(now);
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function monthKey(dateString) {
    return String(dateString || todayKey()).slice(0, 7);
  }

  function monthLabel(key) {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString([], { month: "short" });
  }

  function shiftedDate(monthOffset, day = 12) {
    const now = new Date();
    return dateKey(new Date(now.getFullYear(), now.getMonth() + monthOffset, day));
  }

  function money(value) {
    return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
  }

  function qty(value, unit = "") {
    const clean = Number(value || 0);
    return `${clean % 1 === 0 ? clean : clean.toFixed(2)}${unit ? ` ${unit}` : ""}`;
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

  function initials(name) {
    return String(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function defaultProducts() {
    return [
      product("chicken", "Chicken", "Meat", "KG", "Fresh Farm Meats", 220, 18, 6, "#dc2626", shiftedDate(0, 29)),
      product("vegetables", "Mixed Vegetables", "Vegetables", "KG", "Green Basket Supplier", 48, 34, 10, "#0f9f6e", shiftedDate(0, 31)),
      product("fish", "Fish", "Meat", "KG", "Coastal Fresh", 260, 12, 4, "#0891b2", shiftedDate(0, 28)),
      product("rice", "Basmati Rice", "Grocery", "KG", "Royal Grain Traders", 95, 52, 15, "#f59e0b", shiftedDate(2, 20)),
      product("oil", "Cooking Oil", "Grocery", "Liter", "Kitchen Oils Co.", 140, 16, 5, "#f97316", shiftedDate(3, 12)),
      product("drinks", "Cold Drinks", "Drinks", "Piece", "Blue Drop Beverages", 35, 72, 24, "#2563eb", shiftedDate(5, 16)),
      product("cleaner", "Floor Cleaner", "Cleaning Items", "Liter", "Hygiene Hub", 80, 10, 3, "#7c3aed", shiftedDate(8, 8))
    ];
  }

  function product(id, name, category, unit, supplier, price, stock, lowAlert, color, expiryDate) {
    return {
      id,
      name,
      category,
      unit,
      supplier,
      price,
      stock,
      lowAlert,
      color,
      expiryDate,
      image: "",
      createdAt: dateTimeNow()
    };
  }

  function defaultState() {
    const products = defaultProducts();
    return {
      products,
      employees: [
        employee("Inventory Lead", "invmanager", "Inv@123", "Inventory Manager", "All"),
        employee("Kitchen Counter", "kitchen101", "Kitchen@123", "Kitchen Staff", "Meat"),
        employee("Store Keeper", "store201", "Store@123", "Store Keeper", "Grocery")
      ],
      suppliers: [
        { id: uid("sup"), name: "Fresh Farm Meats", contact: "919999990001", products: "Chicken, fish", createdAt: dateTimeNow() },
        { id: uid("sup"), name: "Green Basket Supplier", contact: "919999990002", products: "Vegetables", createdAt: dateTimeNow() },
        { id: uid("sup"), name: "Blue Drop Beverages", contact: "919999990003", products: "Drinks", createdAt: dateTimeNow() }
      ],
      entries: demoEntries(products),
      expenses: [
        { id: uid("exp"), type: "Daily operations", amount: 3200, note: "Gas and cleaning support", date: shiftedDate(0, 11) },
        { id: uid("exp"), type: "Staff expenses", amount: 8200, note: "Weekly helper payment", date: shiftedDate(0, 12) }
      ],
      activity: [
        { id: uid("act"), type: "System", name: "Admin", detail: "Inventory dashboard ready", time: dateTimeNow() }
      ]
    };
  }

  function demoEntries(products) {
    const names = Object.fromEntries(products.map((item) => [item.id, item]));
    const rows = [];
    [-5, -4, -3, -2, -1, 0].forEach((offset, index) => {
      rows.push(morningEntry("chicken", 18 + index, 3600 + index * 180, shiftedDate(offset, 5), names.chicken.supplier, true));
      rows.push(nightEntry("chicken", 4 + index, 13 + index, 1, shiftedDate(offset, 5), true));
      rows.push(morningEntry("vegetables", 30 + index * 2, 1400 + index * 80, shiftedDate(offset, 6), names.vegetables.supplier, true));
      rows.push(nightEntry("vegetables", 7 + index, 22 + index, 2, shiftedDate(offset, 6), true));
      rows.push(morningEntry("drinks", 48 + index * 4, 1700 + index * 110, shiftedDate(offset, 8), names.drinks.supplier, true));
      rows.push(nightEntry("drinks", 18 + index * 2, 28 + index * 2, 1, shiftedDate(offset, 8), true));
    });
    return rows;
  }

  function morningEntry(productId, quantityReceived, purchasePrice, date, supplier, approved) {
    return {
      id: uid("ent"),
      productId,
      entryType: "morning",
      date,
      quantityReceived,
      purchasePrice,
      unitCost: quantityReceived ? purchasePrice / quantityReceived : 0,
      remainingQty: 0,
      usedQty: 0,
      wasteQty: 0,
      totalCost: purchasePrice,
      profitLoss: 0,
      supplier,
      photoName: "",
      photo: "",
      note: "Morning purchase",
      submittedBy: "Admin",
      approved,
      approvedBy: approved ? "Admin" : "",
      createdAt: dateTimeNow()
    };
  }

  function nightEntry(productId, remainingQty, usedQty, wasteQty, date, approved) {
    return {
      id: uid("ent"),
      productId,
      entryType: "night",
      date,
      quantityReceived: 0,
      purchasePrice: 0,
      unitCost: 0,
      remainingQty,
      usedQty,
      wasteQty,
      totalCost: 0,
      profitLoss: 0,
      supplier: "",
      photoName: "",
      photo: "",
      note: "Night closing",
      submittedBy: "Admin",
      approved,
      approvedBy: approved ? "Admin" : "",
      createdAt: dateTimeNow()
    };
  }

  function employee(name, userId, password, role, category) {
    return {
      id: uid("emp"),
      name,
      userId,
      password,
      role,
      category,
      createdAt: dateTimeNow(),
      lastLoginAt: ""
    };
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultState();
      const parsed = JSON.parse(stored);
      return {
        ...defaultState(),
        ...parsed,
        products: Array.isArray(parsed.products) ? parsed.products : [],
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        activity: Array.isArray(parsed.activity) ? parsed.activity : []
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function qs(selector) {
    return root.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function productById(id) {
    return state.products.find((item) => item.id === id);
  }

  function currentStaff() {
    return state.employees.find((item) => item.id === currentStaffId);
  }

  function dateTimeNow() {
    return new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function titleCase(value) {
    return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
  }

  function addActivity(type, name, detail) {
    state.activity.unshift({ id: uid("act"), type, name, detail, time: dateTimeNow() });
    state.activity = state.activity.slice(0, 60);
  }

  function totalStockCost() {
    return state.products.reduce((sum, item) => sum + item.stock * item.price, 0);
  }

  function monthlyPurchaseCost(key = monthKey(todayKey())) {
    return state.entries
      .filter((entry) => ["morning", "simple-buy"].includes(entry.entryType) && monthKey(entry.date) === key)
      .reduce((sum, entry) => sum + Number(entry.purchasePrice || 0), 0);
  }

  function monthlyUsageCost(key = monthKey(todayKey())) {
    return state.entries
      .filter((entry) => entry.entryType === "night" && monthKey(entry.date) === key)
      .reduce((sum, entry) => {
        const productItem = productById(entry.productId);
        return sum + Number(entry.usedQty || 0) * Number(productItem?.price || 0);
      }, 0);
  }

  function totalExpenses() {
    return state.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }

  function todayUsage() {
    return state.entries
      .filter((entry) => ["night", "simple-sell"].includes(entry.entryType) && entry.date === todayKey())
      .reduce((sum, entry) => sum + Number(entry.usedQty || 0), 0);
  }

  function lowAlerts() {
    return state.products.filter((item) => Number(item.stock || 0) <= Number(item.lowAlert || 0));
  }

  function expiryAlerts() {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 7);
    return state.products.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      return expiry >= now && expiry <= soon;
    });
  }

  function costIncreaseAlerts() {
    return state.products.filter((item) => {
      const purchases = state.entries
        .filter((entry) => entry.productId === item.id && entry.entryType === "morning" && entry.unitCost)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));
      if (purchases.length < 2) return false;
      const previous = purchases[purchases.length - 2].unitCost;
      const latest = purchases[purchases.length - 1].unitCost;
      return previous > 0 && latest > previous * 1.15;
    });
  }

  function allAlerts() {
    return [
      ...lowAlerts().map((item) => ({ product: item, type: "Low stock", level: "danger", detail: `${qty(item.stock, item.unit)} left. Custom alert: ${qty(item.lowAlert, item.unit)}.` })),
      ...expiryAlerts().map((item) => ({ product: item, type: "Expiry soon", level: "warn", detail: `Expires on ${item.expiryDate}.` })),
      ...costIncreaseAlerts().map((item) => ({ product: item, type: "Cost increase", level: "warn", detail: "Latest purchase cost increased by more than 15%." }))
    ];
  }

  function renderTabs() {
    if (!["simple", "advance"].includes(activeView)) {
      activeAdvanceView = activeView;
      activeView = "advance";
    }
    qsa("[data-inventory-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.inventoryView === activeView);
    });
    qsa(".inventory-view").forEach((view) => view.classList.remove("is-active"));
    qsa("[data-inventory-advance-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.inventoryAdvanceView === activeAdvanceView);
    });
    const mainView = qs(`#inv${titleCase(activeView)}View`);
    if (mainView) mainView.classList.add("is-active");
    if (activeView === "advance") {
      const advanceView = qs(`#inv${titleCase(activeAdvanceView)}View`);
      if (advanceView) advanceView.classList.add("is-active");
    }
  }

  function renderStats() {
    const cards = [
      ["Stock value", money(totalStockCost())],
      ["Monthly purchases", money(monthlyPurchaseCost())],
      ["Daily consumption", qty(todayUsage())],
      ["Total expenses", money(totalExpenses())],
      ["Smart alerts", allAlerts().length]
    ];
    qs("#inventoryStats").innerHTML = cards.map(([label, value]) => `
      <article class="inventory-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function renderSelects() {
    const productOptions = state.products.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(item.unit)})</option>`).join("");
    const simpleOptions = state.products.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.category)} | ${escapeHtml(item.unit)}</option>`).join("");
    const stockProductSelect = qs("#stockEntryForm select[name='productId']");
    const graphSelect = qs("#productGraphSelect");
    const simpleProductInput = qs("#simpleProductInput");
    const simpleUnitInput = qs("#simpleUnitInput");
    stockProductSelect.innerHTML = productOptions;
    graphSelect.innerHTML = productOptions;
    qs("#simpleProductOptions").innerHTML = simpleOptions;
    if (!simpleProductText) simpleProductText = state.products[0]?.name || "";
    simpleProductInput.value = simpleProductText;
    simpleUnitInput.value = simpleCustomUnit;
    if (!selectedGraphProduct || !productById(selectedGraphProduct)) selectedGraphProduct = state.products[0]?.id || "";
    graphSelect.value = selectedGraphProduct;

    const categoryOptions = `<option value="All">All categories</option>${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}`;
    qs("#inventoryCategoryFilter").innerHTML = categoryOptions;
    qs("#inventoryCategoryFilter").value = categoryFilter;
  }

  function dateFromKey(key) {
    const [year, month, day] = String(key || todayKey()).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function shortDate(key) {
    return dateFromKey(key).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  }

  function normalizeSimpleProductName(value) {
    return String(value || "").replace(/\s+\([^)]*\)$/g, "").trim();
  }

  function productByName(name) {
    const normalized = normalizeSimpleProductName(name).toLowerCase();
    return state.products.find((item) => item.name.toLowerCase() === normalized);
  }

  function ensureSimpleCustomProduct(name) {
    const cleanName = normalizeSimpleProductName(name);
    const existing = productByName(cleanName);
    if (existing) return existing;
    const index = state.products.length % productColors.length;
    const unit = String(qs("#simpleUnitInput")?.value || simpleCustomUnit || "Piece").trim() || "Piece";
    const item = {
      id: uid("prod"),
      name: cleanName,
      category: "Other Kitchen Items",
      unit,
      supplier: "Simple custom item",
      price: 0,
      stock: 0,
      lowAlert: 0,
      expiryDate: "",
      image: "",
      color: productColors[index],
      createdAt: dateTimeNow()
    };
    state.products.push(item);
    simpleProductText = item.name;
    simpleCustomUnit = item.unit;
    addActivity("Product", "Admin", `Created custom simple item: ${item.name}`);
    return item;
  }

  function simpleEntries() {
    return state.entries.filter((entry) => ["simple-buy", "simple-sell"].includes(entry.entryType));
  }

  function simpleTotals(filterFn) {
    return simpleEntries().filter(filterFn).reduce((totals, entry) => {
      if (entry.entryType === "simple-buy") {
        totals.buy += Number(entry.purchasePrice || 0);
        totals.buyQty += Number(entry.quantityReceived || 0);
      } else {
        totals.sell += Number(entry.saleAmount || 0);
        totals.sellQty += Number(entry.usedQty || 0);
      }
      return totals;
    }, { buy: 0, sell: 0, buyQty: 0, sellQty: 0 });
  }

  function simpleTotalsForDate(key) {
    return simpleTotals((entry) => entry.date === key);
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function renderSimpleCalendar() {
    const monthStart = new Date(simpleCalendarMonth.getFullYear(), simpleCalendarMonth.getMonth(), 1);
    const firstCell = addDays(monthStart, -monthStart.getDay());
    qs("#simpleCalendarLabel").textContent = monthStart.toLocaleDateString([], { month: "long", year: "numeric" });

    const selectedMonth = simpleCalendarMonth.getMonth();
    qs("#simpleInventoryCalendar").innerHTML = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(firstCell, index);
      const key = dateKey(date);
      const totals = simpleTotalsForDate(key);
      const classes = [
        "simple-day",
        date.getMonth() !== selectedMonth ? "is-outside" : "",
        key === simpleSelectedDate ? "is-selected" : "",
        key === todayKey() ? "is-today" : "",
        totals.buy || totals.sell ? "has-entry" : ""
      ].filter(Boolean).join(" ");
      return `
        <button class="${classes}" type="button" data-simple-date="${key}">
          <span class="simple-day-number">${date.getDate()}</span>
          <span class="simple-day-bars">
            <i class="buy" style="--bar-size: ${Math.min(100, totals.buy / 50)}%"></i>
            <i class="sell" style="--bar-size: ${Math.min(100, totals.sell / 50)}%"></i>
          </span>
          <small>${totals.buy ? `Buy ${money(totals.buy)}` : ""}</small>
          <small class="sell-text">${totals.sell ? `Sell ${money(totals.sell)}` : ""}</small>
        </button>
      `;
    }).join("");
  }

  function renderSimpleDayEntries() {
    qs("#simpleSelectedDateLabel").textContent = `${shortDate(simpleSelectedDate)} entry`;
    const entries = simpleEntries().filter((entry) => entry.date === simpleSelectedDate).slice().reverse();
    const totals = simpleTotalsForDate(simpleSelectedDate);
    const summary = `
      <article class="simple-total-row">
        <strong class="buy">Buy ${money(totals.buy)}</strong>
        <strong class="sell">Sell ${money(totals.sell)}</strong>
      </article>
    `;
    qs("#simpleDayEntries").innerHTML = summary + (entries.map((entry) => {
      const item = productById(entry.productId);
      const isBuy = entry.entryType === "simple-buy";
      const amount = isBuy ? entry.purchasePrice : entry.saleAmount;
      const quantity = isBuy ? entry.quantityReceived : entry.usedQty;
      return `
        <article class="mini-row simple-entry-row ${isBuy ? "buy" : "sell"}">
          <div>
            <h4>${isBuy ? "Buy" : "Sell"} ${escapeHtml(item?.name || "Product")} <span class="status-pill ${isBuy ? "good" : "danger"}">${money(amount)}</span></h4>
            <p>${qty(quantity, item?.unit)} | ${escapeHtml(entry.note || entry.supplier || "Simple entry")} | ${escapeHtml(entry.createdAt)}</p>
          </div>
        </article>
      `;
    }).join("") || emptyRow("No buy or sell on this date", "Choose Buy or Sell above to add a simple entry."));
  }

  function currentMonthBuckets() {
    const year = simpleCalendarMonth.getFullYear();
    const month = simpleCalendarMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: 5 }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, lastDay);
      if (startDay > lastDay) return null;
      const totals = simpleTotals((entry) => {
        const date = dateFromKey(entry.date);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() >= startDay && date.getDate() <= endDay;
      });
      return { label: `${startDay}-${endDay}`, ...totals };
    }).filter(Boolean);
  }

  function yearlyBuckets() {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const totals = simpleTotals((entry) => {
        const date = dateFromKey(entry.date);
        return date.getFullYear() === year && date.getMonth() === monthIndex;
      });
      return {
        label: new Date(year, monthIndex, 1).toLocaleDateString([], { month: "short" }),
        ...totals
      };
    });
  }

  function weeklyBuckets() {
    const selected = dateFromKey(simpleSelectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selected, index - 6);
      const key = dateKey(date);
      return {
        label: date.toLocaleDateString([], { weekday: "short" }),
        ...simpleTotalsForDate(key)
      };
    });
  }

  function combinedReportTotals(data) {
    return data.reduce((totals, item) => {
      totals.buy += Number(item.buy || 0);
      totals.sell += Number(item.sell || 0);
      totals.buyQty += Number(item.buyQty || 0);
      totals.sellQty += Number(item.sellQty || 0);
      return totals;
    }, { buy: 0, sell: 0, buyQty: 0, sellQty: 0 });
  }

  function reportPeriodPayload(title, period, totals) {
    const net = Number(totals.sell || 0) - Number(totals.buy || 0);
    return {
      mode: "net",
      title,
      period,
      status: net >= 0 ? "profit" : "loss",
      kind: net >= 0 ? "Profit" : "Loss",
      amount: Math.abs(net),
      net,
      buy: Number(totals.buy || 0),
      sell: Number(totals.sell || 0),
      buyQty: Number(totals.buyQty || 0),
      sellQty: Number(totals.sellQty || 0)
    };
  }

  function reportDataByType(type) {
    const titleMap = {
      weekly: "Weekly graph",
      monthly: "Monthly graph",
      yearly: "Yearly graph"
    };
    if (type === "monthly") {
      return {
        title: titleMap.monthly,
        period: simpleCalendarMonth.toLocaleDateString([], { month: "long", year: "numeric" }),
        data: currentMonthBuckets()
      };
    }
    if (type === "yearly") {
      const year = new Date().getFullYear();
      return { title: titleMap.yearly, period: String(year), data: yearlyBuckets() };
    }
    return { title: titleMap.weekly, period: "Selected 7 days", data: weeklyBuckets() };
  }

  function encodedReportPayload(title, period, totals) {
    return encodeURIComponent(JSON.stringify(reportPeriodPayload(title, period, totals)));
  }

  function decodedReportPayload(rawPayload) {
    try {
      return JSON.parse(decodeURIComponent(rawPayload || ""));
    } catch (error) {
      return null;
    }
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function inlineReportCard(payload, x, y) {
    const isProfit = payload.status === "profit";
    const tone = isProfit ? "profit" : "loss";
    return `
      <g class="simple-report-inline-card ${tone}" transform="translate(${x} ${y})">
        <rect width="132" height="86" rx="12"></rect>
        <text class="period" x="14" y="24">${escapeHtml(payload.period)}</text>
        <text class="result ${tone}" x="14" y="46">${escapeHtml(payload.kind)} ${money(payload.amount)}</text>
        <text class="buy" x="14" y="64">Buy ${money(payload.buy)}</text>
        <text class="sell" x="14" y="78">Sell ${money(payload.sell)}</text>
      </g>
    `;
  }

  function renderSimpleDualChart(data, label) {
    const max = Math.max(...data.flatMap((item) => [item.buy, item.sell]), 1);
    const step = 640 / Math.max(data.length, 1);
    const selected = activeSimpleReportInsight?.mode === "net" && activeSimpleReportInsight.title === label
      ? activeSimpleReportInsight
      : null;
    const bars = data.map((item, index) => {
      const groupX = 44 + index * step;
      const buyHeight = item.buy ? Math.max(8, (item.buy / max) * 160) : 0;
      const sellHeight = item.sell ? Math.max(8, (item.sell / max) * 160) : 0;
      const buyTextY = Math.max(20, 210 - buyHeight);
      const sellTextY = Math.max(20, 210 - sellHeight);
      const buyLabel = `${label} ${item.label} buy ${money(item.buy)}, quantity ${qty(item.buyQty)}`;
      const sellLabel = `${label} ${item.label} sell ${money(item.sell)}, quantity ${qty(item.sellQty)}`;
      const payload = encodedReportPayload(label, item.label, item);
      const card = selected?.period === item.label
        ? inlineReportCard(selected, clampNumber(groupX - 46, 4, 584), 238)
        : `<text class="chart-label simple-report-label" tabindex="0" role="button" aria-label="${escapeHtml(label)} ${escapeHtml(item.label)} profit or loss" data-simple-report-period="${payload}" x="${groupX + 20}" y="244" text-anchor="middle">${escapeHtml(item.label)}</text>`;
      return `
        <rect class="simple-report-period" tabindex="0" role="button" aria-label="${escapeHtml(label)} ${escapeHtml(item.label)} profit or loss" data-simple-report-period="${payload}" x="${groupX - 10}" y="32" width="72" height="216" rx="12"></rect>
        <rect class="simple-report-bar buy" tabindex="0" role="button" aria-label="${escapeHtml(buyLabel)}" data-simple-report-period="${payload}" data-simple-report-bar data-report-title="${escapeHtml(label)}" data-report-period="${escapeHtml(item.label)}" data-report-kind="Buy" data-report-amount="${Number(item.buy || 0)}" data-report-qty="${Number(item.buyQty || 0)}" x="${groupX}" y="${218 - buyHeight}" width="18" height="${buyHeight}" rx="6" fill="#0f9f6e"><title>${escapeHtml(buyLabel)}</title></rect>
        <rect class="simple-report-bar sell" tabindex="0" role="button" aria-label="${escapeHtml(sellLabel)}" data-simple-report-period="${payload}" data-simple-report-bar data-report-title="${escapeHtml(label)}" data-report-period="${escapeHtml(item.label)}" data-report-kind="Sell" data-report-amount="${Number(item.sell || 0)}" data-report-qty="${Number(item.sellQty || 0)}" x="${groupX + 22}" y="${218 - sellHeight}" width="18" height="${sellHeight}" rx="6" fill="#dc2626"><title>${escapeHtml(sellLabel)}</title></rect>
        ${item.buy ? `<text x="${groupX + 9}" y="${buyTextY}" text-anchor="middle" class="chart-value">${money(item.buy).replace("₹", "")}</text>` : ""}
        ${item.sell ? `<text x="${groupX + 31}" y="${sellTextY}" text-anchor="middle" class="chart-value">${money(item.sell).replace("₹", "")}</text>` : ""}
        ${card}
      `;
    }).join("");
    const totalCard = selected?.period === "Total" ? inlineReportCard(selected, 292, 238) : "";
    return `
      <svg viewBox="0 0 720 340" role="img" aria-label="${escapeHtml(label)}">
        <line x1="34" y1="218" x2="690" y2="218" stroke="#dbe5ef" stroke-width="2"></line>
        ${bars}
        ${totalCard}
      </svg>
    `;
  }

  function renderSimpleReports() {
    const currentMonth = monthKey(simpleSelectedDate);
    const monthTotals = simpleTotals((entry) => monthKey(entry.date) === currentMonth);
    const year = new Date().getFullYear();
    const yearTotals = simpleTotals((entry) => dateFromKey(entry.date).getFullYear() === year);
    qs("#simpleReportKpis").innerHTML = [
      ["Selected date buy", money(simpleTotalsForDate(simpleSelectedDate).buy)],
      ["Selected date sell", money(simpleTotalsForDate(simpleSelectedDate).sell)],
      ["This month buy", money(monthTotals.buy)],
      ["This month sell", money(monthTotals.sell)],
      ["This year net", money(yearTotals.sell - yearTotals.buy)]
    ].map(([label, value]) => `
      <article class="budget-card">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
    renderSimpleReportInsight();
    qs("#simpleWeeklyGraph").innerHTML = renderSimpleDualChart(weeklyBuckets(), "Weekly graph");
    qs("#simpleMonthlyGraph").innerHTML = renderSimpleDualChart(currentMonthBuckets(), "Monthly graph");
    qs("#simpleYearlyGraph").innerHTML = renderSimpleDualChart(yearlyBuckets(), "Yearly graph");
  }

  function renderSimpleReportInsight() {
    const panel = qs("#simpleReportInsight");
    if (!panel) return;
    panel.className = "simple-report-insight is-hidden";
    panel.innerHTML = "";
  }

  function renderSimpleInventory() {
    renderSimpleCalendar();
    renderSimpleDayEntries();
    renderSimpleReports();
  }

  function filteredProducts() {
    return state.products.filter((item) => {
      const haystack = `${item.name} ${item.category} ${item.supplier}`.toLowerCase();
      const categoryMatch = categoryFilter === "All" || item.category === categoryFilter;
      return categoryMatch && haystack.includes(inventorySearch.toLowerCase());
    });
  }

  function stockStatus(item) {
    if (Number(item.stock) <= Number(item.lowAlert)) return { text: "Low stock", className: "danger", color: "var(--inv-red)" };
    if (Number(item.stock) <= Number(item.lowAlert) * 1.8) return { text: "Watch", className: "warn", color: "var(--inv-amber)" };
    return { text: "Healthy", className: "good", color: "var(--inv-green)" };
  }

  function productCard(item, showFinance = true) {
    const status = stockStatus(item);
    const width = Math.min(100, Math.round((Number(item.stock || 0) / Math.max(Number(item.lowAlert || 1) * 3, 1)) * 100));
    return `
      <article class="product-card" style="--product-color: ${item.color || "#2563eb"}">
        <div class="product-media">
          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" />` : `<span>${escapeHtml(initials(item.name))}</span>`}
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span class="status-pill ${status.className}">${status.text}</span>
            <span class="status-pill">${escapeHtml(item.category)}</span>
          </div>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.supplier)} | ${escapeHtml(item.unit)} | Alert at ${qty(item.lowAlert, item.unit)}</p>
          <div class="stock-meter" style="--stock-width: ${width}%; --stock-color: ${status.color}"><span></span></div>
          <div class="product-meta">
            <span>${qty(item.stock, item.unit)} in stock</span>
            ${showFinance ? `<span>${money(item.price)} / ${escapeHtml(item.unit)}</span><span>${money(item.stock * item.price)} value</span>` : ""}
          </div>
          <div class="product-actions">
            <button class="tiny-button" type="button" data-quick-entry="${item.id}">Entry</button>
            <button class="tiny-button" type="button" data-set-product-alert="${item.id}">Set alert</button>
            <button class="tiny-button danger" type="button" data-delete-product="${item.id}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProductBoards() {
    qs("#inventoryProductBoard").innerHTML = filteredProducts().map((item) => productCard(item, true)).join("") || emptyRow("No product found", "Change the search or add a product.");
    qs("#productGrid").innerHTML = state.products.map((item) => productCard(item, true)).join("") || emptyRow("No products yet", "Add products to begin stock tracking.");
  }

  function renderEmployees() {
    qs("#inventoryEmployees").innerHTML = state.employees.map((item) => `
      <article class="mini-row">
        <div>
          <h4>${escapeHtml(item.name)} <span class="status-pill">${escapeHtml(item.role)}</span></h4>
          <p>ID: ${escapeHtml(item.userId)} | Pass: ${escapeHtml(item.password)} | Access: ${escapeHtml(item.category)} | ${item.lastLoginAt ? `Last login: ${escapeHtml(item.lastLoginAt)}` : "No login yet"}</p>
        </div>
        <div class="product-actions">
          <button class="tiny-button" type="button" data-inv-login-fill="${item.id}">Use login</button>
          <button class="tiny-button danger" type="button" data-delete-inv-employee="${item.id}">Remove</button>
        </div>
      </article>
    `).join("") || emptyRow("No employee accounts", "Admin can create inventory staff accounts.");
  }

  function renderExpenses() {
    qs("#inventoryExpenseList").innerHTML = state.expenses.slice(0, 6).map((expense) => `
      <article class="mini-row">
        <div>
          <h4>${escapeHtml(expense.type)} <span class="status-pill warn">${money(expense.amount)}</span></h4>
          <p>${escapeHtml(expense.note)} | ${escapeHtml(expense.date)}</p>
        </div>
        <button class="tiny-button danger" type="button" data-delete-expense="${expense.id}">Remove</button>
      </article>
    `).join("") || emptyRow("No expenses yet", "Add staff, kitchen or daily operating costs.");
  }

  function renderAlerts() {
    const alerts = allAlerts();
    qs("#inventoryAlerts").innerHTML = alerts.map((alert) => `
      <article class="alert-row">
        <div>
          <h4>${escapeHtml(alert.product.name)} <span class="status-pill ${alert.level}">${escapeHtml(alert.type)}</span></h4>
          <p>${escapeHtml(alert.detail)}</p>
        </div>
      </article>
    `).join("") || emptyRow("No smart alerts", "All products are inside admin alert settings.");
  }

  function renderActivity() {
    qs("#inventoryActivity").innerHTML = state.activity.slice(0, 10).map((item) => `
      <article class="mini-row">
        <div>
          <h4>${escapeHtml(item.type)} | ${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.detail)} | ${escapeHtml(item.time)}</p>
        </div>
      </article>
    `).join("") || emptyRow("No activity yet", "Employee login and stock updates appear here.");
  }

  function renderPurchaseApprovals() {
    const pending = state.entries.filter((entry) => entry.entryType === "morning" && !entry.approved);
    qs("#purchaseApprovalList").innerHTML = pending.map((entry) => {
      const item = productById(entry.productId);
      return `
        <article class="mini-row">
          <div>
            <h4>${escapeHtml(item?.name || "Unknown product")} <span class="status-pill warn">Approval pending</span></h4>
            <p>${qty(entry.quantityReceived, item?.unit)} purchased for ${money(entry.purchasePrice)} | By ${escapeHtml(entry.submittedBy)} | ${escapeHtml(entry.date)}</p>
          </div>
          <button class="tiny-button" type="button" data-approve-entry="${entry.id}">Approve purchase</button>
        </article>
      `;
    }).join("") || emptyRow("No pending purchases", "All staff purchase entries are approved.");
  }

  function renderStaffPortal() {
    const portal = qs("#inventoryStaffPortal");
    const staff = currentStaff();
    if (!staff) {
      portal.innerHTML = `
        <div class="empty-state">
          <div>
            <h3>No staff logged in</h3>
            <p>Use an inventory employee account to add purchases or night closing stock.</p>
          </div>
        </div>
      `;
      return;
    }
    portal.innerHTML = `
      <div class="staff-profile">
        <div class="staff-badge">
          <div class="staff-avatar">${escapeHtml(initials(staff.name))}</div>
          <div>
            <p class="eyebrow">Logged in inventory staff</p>
            <h3>${escapeHtml(staff.name)}</h3>
            <p>${escapeHtml(staff.role)} | Access: ${escapeHtml(staff.category)} | Sensitive finance hidden.</p>
          </div>
        </div>
        <button class="secondary-button" type="button" data-inventory-logout>Log out</button>
      </div>
    `;
  }

  function visibleProductsForStaff() {
    const staff = currentStaff();
    if (!staff || staff.category === "All") return state.products;
    return state.products.filter((item) => item.category === staff.category);
  }

  function renderStaffInventory() {
    const staff = currentStaff();
    if (!staff) {
      qs("#staffAssignedInventory").innerHTML = emptyRow("Login required", "Assigned inventory appears after employee login.");
      return;
    }
    qs("#staffAssignedInventory").innerHTML = visibleProductsForStaff().map((item) => {
      const status = stockStatus(item);
      return `
        <article class="staff-stock-row">
          <div>
            <h4>${escapeHtml(item.name)} <span class="status-pill ${status.className}">${status.text}</span></h4>
            <p>${escapeHtml(item.category)} | ${qty(item.stock, item.unit)} available | Alert at ${qty(item.lowAlert, item.unit)}</p>
          </div>
          <button class="tiny-button" type="button" data-quick-entry="${item.id}">Add entry</button>
        </article>
      `;
    }).join("") || emptyRow("No assigned items", "Ask admin to update this employee role access.");
  }

  function renderSuppliers() {
    qs("#supplierList").innerHTML = state.suppliers.map((supplier) => `
      <article class="mini-row">
        <div>
          <h4>${escapeHtml(supplier.name)}</h4>
          <p>${escapeHtml(supplier.contact)} | ${escapeHtml(supplier.products)}</p>
        </div>
        <button class="tiny-button danger" type="button" data-delete-supplier="${supplier.id}">Remove</button>
      </article>
    `).join("") || emptyRow("No suppliers", "Add supplier details and product history.");
  }

  function lastSixMonths() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return dateKey(date).slice(0, 7);
    });
  }

  function productMonthData(productId) {
    return lastSixMonths().map((key) => {
      const entries = state.entries.filter((entry) => entry.productId === productId && monthKey(entry.date) === key);
      const purchase = entries.filter((entry) => ["morning", "simple-buy"].includes(entry.entryType)).reduce((sum, entry) => sum + Number(entry.purchasePrice || 0), 0);
      const usage = entries.filter((entry) => ["night", "simple-sell"].includes(entry.entryType)).reduce((sum, entry) => sum + Number(entry.usedQty || 0), 0);
      const waste = entries.filter((entry) => entry.entryType === "night").reduce((sum, entry) => sum + Number(entry.wasteQty || 0), 0);
      return { key, label: monthLabel(key), purchase, usage, waste };
    });
  }

  function renderBarChart(data, color, valueKey, label) {
    const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);
    const bars = data.map((item, index) => {
      const x = 56 + index * 92;
      const height = Math.max(8, (Number(item[valueKey] || 0) / max) * 170);
      const y = 218 - height;
      return `
        <rect x="${x}" y="${y}" width="42" height="${height}" rx="8" fill="${color}" opacity=".88"></rect>
        <text x="${x + 21}" y="244" text-anchor="middle" class="chart-label">${item.label}</text>
        <text x="${x + 21}" y="${y - 8}" text-anchor="middle" class="chart-value">${valueKey === "purchase" ? money(item[valueKey]).replace("₹", "") : Math.round(item[valueKey])}</text>
      `;
    }).join("");
    return `
      <svg viewBox="0 0 640 280" role="img" aria-label="${escapeHtml(label)}">
        <line x1="44" y1="218" x2="610" y2="218" stroke="#dbe5ef" stroke-width="2"></line>
        ${bars}
      </svg>
    `;
  }

  function renderGroupedChart(data) {
    const max = Math.max(...data.flatMap((item) => [item.purchase, item.usage * 100, item.waste * 100]), 1);
    const rows = data.map((item, index) => {
      const x = 48 + index * 96;
      const purchaseHeight = Math.max(8, (item.purchase / max) * 160);
      const usageHeight = Math.max(8, ((item.usage * 100) / max) * 160);
      const wasteHeight = Math.max(8, ((item.waste * 100) / max) * 160);
      return `
        <rect x="${x}" y="${218 - purchaseHeight}" width="20" height="${purchaseHeight}" rx="6" fill="#2563eb"></rect>
        <rect x="${x + 24}" y="${218 - usageHeight}" width="20" height="${usageHeight}" rx="6" fill="#0f9f6e"></rect>
        <rect x="${x + 48}" y="${218 - wasteHeight}" width="20" height="${wasteHeight}" rx="6" fill="#f97316"></rect>
        <text x="${x + 34}" y="244" text-anchor="middle" class="chart-label">${item.label}</text>
      `;
    }).join("");
    return `
      <svg viewBox="0 0 640 280" role="img" aria-label="Product purchase, usage and waste graph">
        <line x1="40" y1="218" x2="610" y2="218" stroke="#dbe5ef" stroke-width="2"></line>
        ${rows}
      </svg>
      <div class="legend-list">
        <span class="legend-chip"><i class="legend-dot" style="--dot-color: #2563eb"></i>Purchase cost</span>
        <span class="legend-chip"><i class="legend-dot" style="--dot-color: #0f9f6e"></i>Usage quantity</span>
        <span class="legend-chip"><i class="legend-dot" style="--dot-color: #f97316"></i>Waste quantity</span>
      </div>
    `;
  }

  function renderAnalytics() {
    const selectedProduct = productById(selectedGraphProduct) || state.products[0];
    if (!selectedProduct) {
      qs("#individualProductGraph").innerHTML = emptyRow("No graph data", "Add products first.");
      qs("#combinedInventoryGraph").innerHTML = emptyRow("No graph data", "Add stock entries first.");
      return;
    }
    const individualData = productMonthData(selectedProduct.id);
    qs("#individualProductGraph").innerHTML = `
      <h4>${escapeHtml(selectedProduct.name)} monthly analysis</h4>
      ${renderGroupedChart(individualData)}
    `;

    const combinedData = lastSixMonths().map((key) => ({
      key,
      label: monthLabel(key),
      purchase: monthlyPurchaseCost(key),
      usageCost: monthlyUsageCost(key)
    }));
    qs("#combinedInventoryGraph").innerHTML = `
      <h4>All products purchase trend</h4>
      ${renderBarChart(combinedData, "#2563eb", "purchase", "Combined monthly purchases")}
      <div class="legend-list">
        <span class="legend-chip"><i class="legend-dot" style="--dot-color: #2563eb"></i>Monthly purchases</span>
        <span class="legend-chip"><i class="legend-dot" style="--dot-color: #0f9f6e"></i>Usage cost tracked in report</span>
      </div>
    `;
    renderBudget();
  }

  function renderBudget() {
    const mostExpensive = state.products.slice().sort((a, b) => b.price - a.price)[0];
    const wasteCost = state.entries
      .filter((entry) => entry.entryType === "night")
      .reduce((sum, entry) => {
        const productItem = productById(entry.productId);
        return sum + Number(entry.wasteQty || 0) * Number(productItem?.price || 0);
      }, 0);
    const cards = [
      ["Monthly hotel cost", money(monthlyPurchaseCost() + totalExpenses())],
      ["Most expensive item", mostExpensive ? `${mostExpensive.name} ${money(mostExpensive.price)}` : "No item"],
      ["Waste cost", money(wasteCost)],
      ["Cost risk alerts", costIncreaseAlerts().length]
    ];
    qs("#budgetAnalysis").innerHTML = cards.map(([label, value]) => `
      <article class="budget-card">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function renderReports() {
    const usageCost = monthlyUsageCost();
    const revenueEstimate = usageCost * 1.35;
    const profitLoss = revenueEstimate - usageCost - totalExpenses();
    qs("#adminFinanceReport").innerHTML = [
      reportRow("Total stock cost", money(totalStockCost()), "Current live value of stock inside hotel inventory."),
      reportRow("Monthly purchases", money(monthlyPurchaseCost()), "Morning purchase entries for this month."),
      reportRow("Monthly usage cost", money(usageCost), "Night closing usage multiplied by product cost."),
      reportRow("Business expenses", money(totalExpenses()), "Kitchen, staff, purchase and daily operation expenses."),
      reportRow("Profit / Loss estimate", money(profitLoss), "Estimated from usage revenue minus cost and expenses.")
    ].join("");

    const latestEntries = state.entries.slice(-10).reverse();
    qs("#monthlyInventoryReport").innerHTML = latestEntries.map((entry) => {
      const item = productById(entry.productId);
      const entryTypeLabel = {
        morning: "Morning purchase",
        night: "Night closing",
        "simple-buy": "Simple buy",
        "simple-sell": "Simple sell"
      };
      const title = entryTypeLabel[entry.entryType] || "Stock entry";
      let detail = `${qty(entry.usedQty, item?.unit)} used | ${qty(entry.wasteQty, item?.unit)} waste | ${qty(entry.remainingQty, item?.unit)} remaining`;
      if (["morning", "simple-buy"].includes(entry.entryType)) {
        detail = `${qty(entry.quantityReceived, item?.unit)} received | ${money(entry.purchasePrice)} | ${entry.approved ? "Approved" : "Approval pending"}`;
      }
      if (entry.entryType === "simple-sell") {
        detail = `${qty(entry.usedQty, item?.unit)} sold | Sell ${money(entry.saleAmount)} | Profit ${money(entry.profitLoss)}`;
      }
      return reportRow(`${title}: ${item?.name || "Unknown"}`, detail, `${entry.date} | By ${entry.submittedBy}`);
    }).join("") || emptyRow("No monthly entries", "Daily stock entries will appear here.");
  }

  function reportRow(title, value, detail) {
    return `
      <article class="report-row">
        <div>
          <h4>${escapeHtml(title)} <span class="status-pill">${escapeHtml(value)}</span></h4>
          <p>${escapeHtml(detail)}</p>
        </div>
      </article>
    `;
  }

  function emptyRow(title, detail) {
    return `
      <article class="mini-row">
        <div>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(detail)}</p>
        </div>
      </article>
    `;
  }

  function renderAll() {
    renderTabs();
    renderStats();
    renderSelects();
    renderSimpleInventory();
    renderEmployees();
    renderExpenses();
    renderProductBoards();
    renderAlerts();
    renderActivity();
    renderPurchaseApprovals();
    renderStaffPortal();
    renderStaffInventory();
    renderSuppliers();
    renderAnalytics();
    renderReports();
  }

  function isUniqueUserId(userId) {
    return !state.employees.some((item) => item.userId.toLowerCase() === userId.toLowerCase());
  }

  function validateImage(file) {
    if (!file) return true;
    if (file.size <= IMAGE_LIMIT) return true;
    alert("Image size must be 2MB or less.");
    return false;
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      if (!validateImage(file)) {
        reject(new Error("Image too large"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(file);
    });
  }

  function createEmployee(form) {
    const data = new FormData(form);
    const userId = String(data.get("userId")).trim();
    if (!isUniqueUserId(userId)) {
      alert("This User ID already exists. Give a unique User ID.");
      return;
    }
    const item = employee(
      String(data.get("name")).trim(),
      userId,
      String(data.get("password")).trim(),
      String(data.get("role")),
      String(data.get("category"))
    );
    state.employees.push(item);
    addActivity("Employee", "Admin", `Created ${item.role} account for ${item.name}`);
    form.reset();
    saveState();
    renderAll();
  }

  function createExpense(form) {
    const data = new FormData(form);
    const expense = {
      id: uid("exp"),
      type: String(data.get("type")),
      amount: Number(data.get("amount")),
      note: String(data.get("note")).trim(),
      date: todayKey()
    };
    state.expenses.unshift(expense);
    addActivity("Expense", "Admin", `${expense.type} added: ${money(expense.amount)}`);
    form.reset();
    saveState();
    renderAll();
  }

  async function createProduct(form) {
    const data = new FormData(form);
    const imageFile = form.elements.image.files[0];
    let image = "";
    try {
      image = await readImage(imageFile);
    } catch {
      return;
    }
    const index = state.products.length % productColors.length;
    const item = {
      id: uid("prod"),
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      unit: String(data.get("unit")),
      supplier: String(data.get("supplier")).trim(),
      price: Number(data.get("price")),
      stock: 0,
      lowAlert: Number(data.get("lowAlert")),
      expiryDate: String(data.get("expiryDate") || ""),
      image,
      color: productColors[index],
      createdAt: dateTimeNow()
    };
    state.products.push(item);
    addActivity("Product", "Admin", `Added ${item.name} with ${qty(item.lowAlert, item.unit)} custom alert`);
    form.reset();
    saveState();
    renderAll();
  }

  function createSupplier(form) {
    const data = new FormData(form);
    const supplier = {
      id: uid("sup"),
      name: String(data.get("name")).trim(),
      contact: String(data.get("contact")).trim(),
      products: String(data.get("products")).trim(),
      createdAt: dateTimeNow()
    };
    state.suppliers.push(supplier);
    addActivity("Supplier", "Admin", `Added ${supplier.name}`);
    form.reset();
    saveState();
    renderAll();
  }

  function selectedSimpleProduct() {
    const typedName = normalizeSimpleProductName(qs("#simpleProductInput")?.value || simpleProductText);
    if (!typedName) return null;
    const existing = productByName(typedName);
    if (existing) {
      simpleProductText = existing.name;
      simpleCustomUnit = existing.unit;
      return existing;
    }
    return ensureSimpleCustomProduct(typedName);
  }

  function saveSimpleBuy(form) {
    const item = selectedSimpleProduct();
    if (!item) {
      alert("Type or select an item name first.");
      return;
    }
    const data = new FormData(form);
    const quantity = Number(data.get("quantity"));
    const amount = Number(data.get("amount"));
    if (!quantity || !amount) {
      alert("Type buy quantity and buy amount.");
      return;
    }
    const supplier = String(data.get("supplier") || "").trim();
    const entry = {
      id: uid("ent"),
      productId: item.id,
      entryType: "simple-buy",
      date: simpleSelectedDate,
      quantityReceived: quantity,
      purchasePrice: amount,
      unitCost: amount / quantity,
      remainingQty: 0,
      usedQty: 0,
      wasteQty: 0,
      totalCost: amount,
      profitLoss: 0,
      supplier,
      photoName: "",
      photo: "",
      note: supplier ? `Bought from ${supplier}` : "Simple buy entry",
      submittedBy: "Simple",
      approved: true,
      approvedBy: "Admin",
      createdAt: dateTimeNow()
    };
    item.stock = Number(item.stock || 0) + quantity;
    item.price = entry.unitCost;
    if (supplier) item.supplier = supplier;
    simpleProductText = item.name;
    simpleCustomUnit = item.unit;
    state.entries.push(entry);
    addActivity("Simple buy", "Admin", `${item.name}: ${qty(quantity, item.unit)} bought for ${money(amount)} on ${simpleSelectedDate}`);
    form.reset();
    saveState();
    renderAll();
  }

  function saveSimpleSell(form) {
    const item = selectedSimpleProduct();
    if (!item) {
      alert("Type or select an item name first.");
      return;
    }
    const data = new FormData(form);
    const quantity = Number(data.get("quantity"));
    const amount = Number(data.get("amount"));
    if (!quantity || !amount) {
      alert("Type sell quantity and sell amount.");
      return;
    }
    const note = String(data.get("note") || "").trim();
    const cost = quantity * Number(item.price || 0);
    const entry = {
      id: uid("ent"),
      productId: item.id,
      entryType: "simple-sell",
      date: simpleSelectedDate,
      quantityReceived: 0,
      purchasePrice: 0,
      unitCost: Number(item.price || 0),
      remainingQty: Math.max(0, Number(item.stock || 0) - quantity),
      usedQty: quantity,
      wasteQty: 0,
      totalCost: cost,
      saleAmount: amount,
      profitLoss: amount - cost,
      supplier: "",
      photoName: "",
      photo: "",
      note: note || "Simple sell entry",
      submittedBy: "Simple",
      approved: true,
      approvedBy: "Admin",
      createdAt: dateTimeNow()
    };
    item.stock = entry.remainingQty;
    simpleProductText = item.name;
    simpleCustomUnit = item.unit;
    state.entries.push(entry);
    addActivity("Simple sell", "Admin", `${item.name}: ${qty(quantity, item.unit)} sold for ${money(amount)} on ${simpleSelectedDate}`);
    form.reset();
    saveState();
    renderAll();
  }

  async function saveStockEntry(form) {
    const staff = currentStaff();
    if (!staff) {
      alert("Please login as inventory staff before saving stock entry.");
      activeView = "advance";
      activeAdvanceView = "staff";
      renderAll();
      return;
    }
    const data = new FormData(form);
    const item = productById(String(data.get("productId")));
    if (!item) return;
    if (staff.category !== "All" && staff.category !== item.category) {
      alert("This product is outside this employee role access.");
      return;
    }

    const imageFile = form.elements.photo.files[0];
    let photo = "";
    try {
      photo = await readImage(imageFile);
    } catch {
      return;
    }

    const entryType = String(data.get("entryType"));
    const entry = {
      id: uid("ent"),
      productId: item.id,
      entryType,
      date: todayKey(),
      quantityReceived: 0,
      purchasePrice: 0,
      unitCost: 0,
      remainingQty: 0,
      usedQty: 0,
      wasteQty: 0,
      totalCost: 0,
      profitLoss: 0,
      supplier: String(data.get("supplier")).trim(),
      photoName: imageFile?.name || "",
      photo,
      note: String(data.get("note")).trim(),
      submittedBy: staff.name,
      approved: false,
      approvedBy: "",
      createdAt: dateTimeNow()
    };

    if (entryType === "morning") {
      entry.quantityReceived = Number(data.get("quantityReceived"));
      entry.purchasePrice = Number(data.get("purchasePrice"));
      if (!entry.quantityReceived || !entry.purchasePrice) {
        alert("Morning entry needs quantity received and purchase price.");
        return;
      }
      entry.unitCost = entry.purchasePrice / entry.quantityReceived;
      entry.totalCost = entry.purchasePrice;
      item.stock = Number(item.stock || 0) + entry.quantityReceived;
      item.price = entry.unitCost;
      if (entry.supplier) item.supplier = entry.supplier;
      addActivity("Purchase", staff.name, `${item.name}: ${qty(entry.quantityReceived, item.unit)} received for ${money(entry.purchasePrice)}`);
    } else {
      const currentStock = Number(item.stock || 0);
      entry.remainingQty = Number(data.get("remainingQty"));
      entry.wasteQty = Number(data.get("wasteQty") || 0);
      entry.usedQty = Number(data.get("usedQty")) || Math.max(currentStock - entry.remainingQty - entry.wasteQty, 0);
      entry.totalCost = entry.usedQty * Number(item.price || 0);
      const wasteCost = entry.wasteQty * Number(item.price || 0);
      const revenueEstimate = entry.totalCost * 1.35;
      entry.profitLoss = revenueEstimate - entry.totalCost - wasteCost;
      item.stock = entry.remainingQty;
      addActivity("Night closing", staff.name, `${item.name}: ${qty(entry.usedQty, item.unit)} used, ${qty(entry.wasteQty, item.unit)} waste`);
    }

    state.entries.push(entry);
    form.reset();
    saveState();
    renderAll();
  }

  function approveEntry(entryId) {
    const entry = state.entries.find((item) => item.id === entryId);
    if (!entry) return;
    entry.approved = true;
    entry.approvedBy = "Admin";
    addActivity("Approval", "Admin", `Approved ${entry.entryType} entry for ${productById(entry.productId)?.name || "product"}`);
    saveState();
    renderAll();
  }

  function exportCsv() {
    const lines = [
      ["Section", "Name", "Category/Type", "Quantity", "Cost", "Date", "Note"].join(","),
      ...state.products.map((item) => ["Product", item.name, item.category, qty(item.stock, item.unit), item.stock * item.price, "", item.supplier].join(",")),
      ...state.entries.map((entry) => {
        const item = productById(entry.productId);
        const isBuyEntry = ["morning", "simple-buy"].includes(entry.entryType);
        const amount = isBuyEntry ? entry.purchasePrice : (entry.saleAmount || entry.totalCost);
        const quantity = isBuyEntry ? qty(entry.quantityReceived, item?.unit) : `${qty(entry.usedQty, item?.unit)} ${entry.entryType === "simple-sell" ? "sold" : "used"}`;
        return ["Entry", item?.name || "Unknown", entry.entryType, quantity, amount, entry.date, entry.note].join(",");
      }),
      ...state.expenses.map((expense) => ["Expense", expense.note, expense.type, "", expense.amount, expense.date, ""].join(","))
    ];
    downloadBlob(lines.join("\n"), `inventory-report-${todayKey()}.csv`, "text/csv");
  }

  function downloadBlob(content, fileName, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function printReport() {
    activeView = "advance";
    activeAdvanceView = "reports";
    renderAll();
    setTimeout(() => window.print(), 100);
  }

  function seedDemoData() {
    if (!confirm("Load demo inventory data? This will replace the current inventory prototype data.")) return;
    state = defaultState();
    currentStaffId = "";
    selectedGraphProduct = "";
    simpleSelectedDate = todayKey();
    simpleCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    saveState();
    renderAll();
  }

  function handleRootClick(event) {
    const viewButton = event.target.closest("[data-inventory-view]");
    if (viewButton) {
      activeView = viewButton.dataset.inventoryView;
      renderAll();
    }

    const advanceButton = event.target.closest("[data-inventory-advance-view]");
    if (advanceButton) {
      activeView = "advance";
      activeAdvanceView = advanceButton.dataset.inventoryAdvanceView;
      renderAll();
    }

    const monthButton = event.target.closest("[data-simple-month]");
    if (monthButton) {
      const direction = monthButton.dataset.simpleMonth === "next" ? 1 : -1;
      simpleCalendarMonth = new Date(simpleCalendarMonth.getFullYear(), simpleCalendarMonth.getMonth() + direction, 1);
      renderAll();
    }

    const simpleDateButton = event.target.closest("[data-simple-date]");
    if (simpleDateButton) {
      simpleSelectedDate = simpleDateButton.dataset.simpleDate;
      simpleCalendarMonth = new Date(dateFromKey(simpleSelectedDate).getFullYear(), dateFromKey(simpleSelectedDate).getMonth(), 1);
      renderAll();
    }

    if (event.target.closest("#simpleReportsButton")) {
      qs("#simpleReportsPanel").classList.remove("is-hidden");
      qs("#simpleReportsPanel").setAttribute("aria-hidden", "false");
    }

    if (event.target.closest("[data-close-simple-reports]")) {
      qs("#simpleReportsPanel").classList.add("is-hidden");
      qs("#simpleReportsPanel").setAttribute("aria-hidden", "true");
    }

    const reportTotalButton = event.target.closest("[data-simple-report-total]");
    if (reportTotalButton) {
      const report = reportDataByType(reportTotalButton.dataset.simpleReportTotal);
      activeSimpleReportInsight = reportPeriodPayload(report.title, "Total", combinedReportTotals(report.data));
      renderSimpleReports();
      return;
    }

    const reportPeriod = event.target.closest("[data-simple-report-period]");
    if (reportPeriod) {
      const payload = decodedReportPayload(reportPeriod.dataset.simpleReportPeriod);
      if (!payload) return;
      activeSimpleReportInsight = payload;
      renderSimpleReports();
      return;
    }

    const reportBar = event.target.closest("[data-simple-report-bar]");
    if (reportBar) {
      const payload = decodedReportPayload(reportBar.dataset.simpleReportPeriod);
      if (payload) {
        activeSimpleReportInsight = payload;
        renderSimpleReports();
      }
      return;
    }

    const fillButton = event.target.closest("[data-inv-login-fill]");
    if (fillButton) {
      const staff = state.employees.find((item) => item.id === fillButton.dataset.invLoginFill);
      if (!staff) return;
      activeView = "advance";
      activeAdvanceView = "staff";
      renderAll();
      qs("#inventoryStaffLoginForm").elements.userId.value = staff.userId;
      qs("#inventoryStaffLoginForm").elements.password.value = staff.password;
    }

    const quickEntry = event.target.closest("[data-quick-entry]");
    if (quickEntry) {
      activeView = "advance";
      activeAdvanceView = "staff";
      renderAll();
      qs("#stockEntryForm").elements.productId.value = quickEntry.dataset.quickEntry;
    }

    const employeeDelete = event.target.closest("[data-delete-inv-employee]");
    if (employeeDelete) {
      const staff = state.employees.find((item) => item.id === employeeDelete.dataset.deleteInvEmployee);
      if (!staff || !confirm(`Remove ${staff.name}?`)) return;
      state.employees = state.employees.filter((item) => item.id !== staff.id);
      if (currentStaffId === staff.id) currentStaffId = "";
      addActivity("Employee", "Admin", `Removed ${staff.name}`);
      saveState();
      renderAll();
    }

    const productDelete = event.target.closest("[data-delete-product]");
    if (productDelete) {
      const item = productById(productDelete.dataset.deleteProduct);
      if (!item || !confirm(`Remove ${item.name}?`)) return;
      state.products = state.products.filter((productItem) => productItem.id !== item.id);
      state.entries = state.entries.filter((entry) => entry.productId !== item.id);
      addActivity("Product", "Admin", `Removed ${item.name}`);
      saveState();
      renderAll();
    }

    const alertButton = event.target.closest("[data-set-product-alert]");
    if (alertButton) {
      const item = productById(alertButton.dataset.setProductAlert);
      if (!item) return;
      const nextAlert = prompt(`Set low-stock alert for ${item.name} (${item.unit})`, item.lowAlert);
      if (nextAlert === null) return;
      const value = Number(nextAlert);
      if (Number.isNaN(value) || value < 0) {
        alert("Please enter a valid alert quantity.");
        return;
      }
      item.lowAlert = value;
      addActivity("Alert", "Admin", `Updated ${item.name} alert to ${qty(value, item.unit)}`);
      saveState();
      renderAll();
    }

    const expenseDelete = event.target.closest("[data-delete-expense]");
    if (expenseDelete) {
      state.expenses = state.expenses.filter((expense) => expense.id !== expenseDelete.dataset.deleteExpense);
      saveState();
      renderAll();
    }

    const supplierDelete = event.target.closest("[data-delete-supplier]");
    if (supplierDelete) {
      state.suppliers = state.suppliers.filter((supplier) => supplier.id !== supplierDelete.dataset.deleteSupplier);
      saveState();
      renderAll();
    }

    const approveButton = event.target.closest("[data-approve-entry]");
    if (approveButton) approveEntry(approveButton.dataset.approveEntry);

    if (event.target.closest("[data-inventory-logout]")) {
      currentStaffId = "";
      renderAll();
    }
  }

  function bindEvents() {
    qs("#inventoryEmployeeForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createEmployee(event.currentTarget);
    });

    qs("#inventoryExpenseForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createExpense(event.currentTarget);
    });

    qs("#inventoryProductForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createProduct(event.currentTarget);
    });

    qs("#supplierForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createSupplier(event.currentTarget);
    });

    qs("#stockEntryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      saveStockEntry(event.currentTarget);
    });

    qs("#inventoryStaffLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const userId = String(data.get("userId")).trim();
      const password = String(data.get("password"));
      const staff = state.employees.find((item) => item.userId === userId && item.password === password);
      if (!staff) {
        qs("#inventoryStaffMessage").textContent = "Invalid inventory User ID or password.";
        addActivity("Login failed", "Unknown", userId);
        saveState();
        renderAll();
        return;
      }
      currentStaffId = staff.id;
      staff.lastLoginAt = dateTimeNow();
      qs("#inventoryStaffMessage").textContent = `${staff.name} logged in.`;
      addActivity("Login", staff.name, `${staff.role} entered inventory system`);
      event.currentTarget.reset();
      saveState();
      renderAll();
    });

    qs("#simpleBuyForm").addEventListener("submit", (event) => {
      event.preventDefault();
      saveSimpleBuy(event.currentTarget);
    });

    qs("#simpleSellForm").addEventListener("submit", (event) => {
      event.preventDefault();
      saveSimpleSell(event.currentTarget);
    });

    qs("#simpleProductInput").addEventListener("input", (event) => {
      simpleProductText = event.currentTarget.value;
      const existing = productByName(simpleProductText);
      if (existing) {
        simpleCustomUnit = existing.unit;
        qs("#simpleUnitInput").value = existing.unit;
      }
    });

    qs("#simpleUnitInput").addEventListener("input", (event) => {
      simpleCustomUnit = event.currentTarget.value;
    });

    qs("#inventorySearch").addEventListener("input", (event) => {
      inventorySearch = event.currentTarget.value;
      renderProductBoards();
    });

    qs("#inventoryCategoryFilter").addEventListener("change", (event) => {
      categoryFilter = event.currentTarget.value;
      renderProductBoards();
    });

    qs("#productGraphSelect").addEventListener("change", (event) => {
      selectedGraphProduct = event.currentTarget.value;
      renderAnalytics();
    });

    qs("#inventoryCsvButton")?.addEventListener("click", exportCsv);
    qs("#inventoryPrintButton")?.addEventListener("click", printReport);
    qs("#inventorySeedButton")?.addEventListener("click", seedDemoData);

    root.removeEventListener("click", handleRootClick);
    root.addEventListener("click", handleRootClick);
  }

  function init(mount) {
    root = mount;
    renderAll();
    bindEvents();
  }

  return { init };
})();
