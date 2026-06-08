window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.billing = (() => {
  const STORAGE_KEY = "smartBillingQrTransferState";
  const BILL_SETTINGS_KEY = "smartBillDownloadSettings";

  let root = null;
  let state = loadState();
  let activeView = "admin";
  let productSearch = "";
  let categoryFilter = "All";
  let menuSearch = "";
  let menuCategory = "All";

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function defaultBillSettings() {
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

  function loadBillSettings() {
    try {
      return { ...defaultBillSettings(), ...(JSON.parse(localStorage.getItem(BILL_SETTINGS_KEY) || "{}")) };
    } catch {
      return defaultBillSettings();
    }
  }

  function cleanAccent(value) {
    const color = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563eb";
  }

  function hasActiveSecurityCode(settings) {
    return Boolean(settings.password && settings.passwordSavedAt);
  }

  function timeNow() {
    return new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function money(value) {
    return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
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

  function initials(value) {
    return String(value || "Hotel").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function defaultState() {
    return {
      hotel: {
        hotelName: "Smart Palace Restaurant",
        gstin: "21ABCDE1234F1Z5",
        address: "Main Road, Bhubaneswar",
        contact: "9938209630",
        logo: "",
        upiQr: "",
        upiId: "smartpalace@upi",
        taxPercent: 5,
        tables: ["T1", "T2", "T3", "T4", "VIP1", "Family 1"]
      },
      staff: [
        { id: uid("staff"), name: "Rashmi Cashier", role: "Cashier", phone: "9938209630" },
        { id: uid("staff"), name: "Floor Captain", role: "Billing Support", phone: "919999999999" }
      ],
      products: [
        product("veg-biryani", "Main Course", "Veg Biryani", 180, 5, 149, "Available"),
        product("chicken-biryani", "Main Course", "Chicken Biryani", 260, 5, 229, "Available"),
        product("paneer-tikka", "Starters", "Paneer Tikka", 220, 5, 199, "Available"),
        product("fish-fry", "Starters", "Fish Fry", 280, 5, 0, "Low Stock"),
        product("pizza", "Pizza", "Cheese Pizza", 320, 12, 289, "Available"),
        product("burger", "Burger", "Crispy Burger", 140, 5, 119, "Available"),
        product("cold-coffee", "Drinks", "Cold Coffee", 120, 5, 0, "Available"),
        product("ice-cream", "Desserts", "Chocolate Ice Cream", 110, 5, 99, "Available")
      ],
      cart: [
        { productId: "chicken-biryani", qty: 2 },
        { productId: "cold-coffee", qty: 2 }
      ],
      customer: {
        customerName: "Walk-in Customer",
        whatsapp: "",
        tableNumber: "T1",
        discount: 0,
        paymentStatus: "Unpaid",
        customMessage: ""
      },
      bills: [],
      currentBillId: "",
      transfers: []
    };
  }

  function product(id, category, name, price, gstRate, offerPrice, stock) {
    return { id, category, name, price, gstRate, offerPrice, stock };
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultState();
      const parsed = JSON.parse(stored);
      return {
        ...defaultState(),
        ...parsed,
        hotel: { ...defaultState().hotel, ...(parsed.hotel || {}) },
        staff: Array.isArray(parsed.staff) ? parsed.staff : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
        transfers: Array.isArray(parsed.transfers) ? parsed.transfers : []
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

  function categories() {
    return [...new Set(state.products.map((item) => item.category))].sort();
  }

  function activePrice(item) {
    return Number(item.offerPrice || 0) > 0 ? Number(item.offerPrice) : Number(item.price || 0);
  }

  function billNo() {
    return `BILL-${todayKey().replaceAll("-", "")}-${String(state.bills.length + 1).padStart(3, "0")}`;
  }

  function calculateBill(cart = state.cart, customer = state.customer) {
    const items = cart.map((cartItem) => {
      const item = productById(cartItem.productId);
      if (!item) return null;
      const qty = Number(cartItem.qty || 0);
      const rate = activePrice(item);
      const taxable = rate * qty;
      const gst = taxable * Number(item.gstRate || 0) / 100;
      return {
        productId: item.id,
        category: item.category,
        name: item.name,
        qty,
        rate,
        gstRate: Number(item.gstRate || 0),
        taxable,
        gst,
        total: taxable + gst
      };
    }).filter(Boolean);
    const subtotal = items.reduce((sum, item) => sum + item.taxable, 0);
    const gstTotal = items.reduce((sum, item) => sum + item.gst, 0);
    const beforeDiscount = subtotal + gstTotal;
    const discount = Math.min(Number(customer.discount || 0), beforeDiscount);
    const finalTotal = Math.max(0, beforeDiscount - discount);
    return { items, subtotal, gstTotal, beforeDiscount, discount, finalTotal };
  }

  function currentBill() {
    return state.bills.find((bill) => bill.id === state.currentBillId) || null;
  }

  function currentBillOrPreview() {
    const calc = calculateBill();
    return currentBill() || {
      id: "preview",
      billNo: "PREVIEW",
      createdAt: timeNow(),
      hotel: state.hotel,
      customer: state.customer,
      ...calc
    };
  }

  function qrImage(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
  }

  function upiLink(bill) {
    const upiId = String(state.hotel.upiId || "").trim();
    if (!upiId) return "";
    const params = new URLSearchParams({
      pa: upiId,
      pn: state.hotel.hotelName || "Hotel",
      am: String(Math.round(bill.finalTotal || 0)),
      cu: "INR",
      tn: `${bill.billNo} payment`
    });
    return `upi://pay?${params.toString()}`;
  }

  function buildBillText(bill) {
    const lines = [
      `${bill.hotel.hotelName}`,
      `GSTIN: ${bill.hotel.gstin}`,
      `Bill: ${bill.billNo}`,
      `Table: ${bill.customer.tableNumber || "-"}`,
      `Customer: ${bill.customer.customerName || "Customer"}`,
      "",
      ...bill.items.map((item) => `${item.name} x ${item.qty} = ${money(item.total)}`),
      "",
      `Subtotal: ${money(bill.subtotal)}`,
      `GST: ${money(bill.gstTotal)}`,
      `Discount: ${money(bill.discount)}`,
      `Final: ${money(bill.finalTotal)}`,
      `Payment: ${bill.customer.paymentStatus}`,
      "Thank you for dining with us."
    ];
    return lines.join("\n");
  }

  function billHtml(bill, options = {}) {
    const settings = loadBillSettings();
    const accent = cleanAccent(settings.accent);
    const layout = ["classic", "compact", "premium"].includes(settings.layout) ? settings.layout : "classic";
    const logo = bill.hotel.logo
      ? `<img src="${escapeHtml(bill.hotel.logo)}" alt="${escapeHtml(bill.hotel.hotelName)} logo" />`
      : `<span>${escapeHtml(initials(bill.hotel.hotelName))}</span>`;
    const upiQr = bill.hotel.upiQr
      ? `<img src="${escapeHtml(bill.hotel.upiQr)}" alt="UPI QR Code" />`
      : "";
    const rows = bill.items.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.qty}</td>
        <td>${money(item.rate)}</td>
        <td>${item.gstRate}%</td>
        <td>${money(item.total)}</td>
      </tr>
    `).join("");
    const watermark = settings.watermark ? `<div class="watermark">${escapeHtml(settings.watermark)}</div>` : "";
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(bill.billNo)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #eef3f9; color: #111827; font-family: Arial, sans-serif; }
            h1, h2, h3, p { margin: 0; }
            .invoice-shell { position: relative; width: min(920px, calc(100vw - 28px)); margin: 22px auto; overflow: hidden; border-radius: 8px; background: #ffffff; box-shadow: 0 24px 70px rgba(15, 23, 42, .16); }
            .invoice-hero { display: grid; grid-template-columns: 1fr auto; gap: 20px; padding: 28px; background: linear-gradient(135deg, ${accent}, #111827); color: #ffffff; }
            .brand-line { display: flex; gap: 16px; align-items: center; }
            .brand-mark { display: grid; place-items: center; width: 70px; height: 70px; overflow: hidden; border-radius: 8px; background: rgba(255, 255, 255, .16); font-size: 24px; font-weight: 900; }
            .brand-mark img { width: 100%; height: 100%; object-fit: cover; }
            .invoice-title { text-align: right; }
            .invoice-title strong { display: block; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; }
            .invoice-body { position: relative; display: grid; gap: 20px; padding: 26px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
            .info-card { border: 1px solid #dbe5ef; border-radius: 8px; padding: 14px; background: #f8fafc; }
            .info-card span { display: block; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; }
            .info-card strong { display: block; margin-top: 4px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 8px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; }
            .total { width: min(380px, 100%); margin-left: auto; display: grid; gap: 8px; border: 1px solid #dbe5ef; border-radius: 8px; padding: 14px; background: #ffffff; }
            .row { display: flex; justify-content: space-between; gap: 12px; }
            .final { border-top: 1px solid #dbe5ef; padding-top: 10px; color: ${accent}; font-size: 22px; font-weight: 900; }
            .upi-box { display: flex; justify-content: space-between; gap: 16px; align-items: center; border: 1px dashed ${accent}; border-radius: 8px; padding: 14px; background: rgba(37, 99, 235, .04); }
            .upi-box img { width: 96px; height: 96px; object-fit: contain; }
            .footer { border-top: 1px solid #dbe5ef; padding: 18px 26px; color: #64748b; font-weight: 700; }
            .watermark { position: absolute; right: 34px; bottom: 44px; color: rgba(15, 23, 42, .05); font-size: 72px; font-weight: 900; transform: rotate(-10deg); pointer-events: none; }
            body.compact .invoice-hero, body.compact .invoice-body { padding: 18px; }
            body.premium .invoice-shell { border: 4px solid ${accent}; }
            @media print {
              body { background: #ffffff; }
              .invoice-shell { width: 100%; margin: 0; box-shadow: none; border-radius: 0; }
            }
            @media (max-width: 720px) {
              .invoice-hero, .info-grid { grid-template-columns: 1fr; }
              .invoice-title { text-align: left; }
              th, td { padding: 10px 8px; font-size: 13px; }
              .watermark { font-size: 42px; }
            }
          </style>
        </head>
        <body class="${escapeHtml(layout)}">
          <main class="invoice-shell">
            ${watermark}
            <section class="invoice-hero">
              <div class="brand-line">
                <div class="brand-mark">${logo}</div>
                <div>
                  <h1>${escapeHtml(bill.hotel.hotelName)}</h1>
                  <p>${escapeHtml(bill.hotel.address)}</p>
                  <p>GSTIN: ${escapeHtml(bill.hotel.gstin)} | Contact: ${escapeHtml(bill.hotel.contact)}</p>
                </div>
              </div>
            <div>
                <div class="invoice-title">
                  <strong>${escapeHtml(settings.title)}</strong>
                  <h2>${escapeHtml(bill.billNo)}</h2>
                  <p>${escapeHtml(bill.createdAt)}</p>
                </div>
            </div>
            </section>
            <section class="invoice-body">
              <div class="info-grid">
                <div class="info-card"><span>Customer</span><strong>${escapeHtml(bill.customer.customerName || "Customer")}</strong></div>
                <div class="info-card"><span>Table</span><strong>${escapeHtml(bill.customer.tableNumber || "-")}</strong></div>
                <div class="info-card"><span>Payment</span><strong>${escapeHtml(bill.customer.paymentStatus)}</strong></div>
                <div class="info-card"><span>WhatsApp</span><strong>${escapeHtml(bill.customer.whatsapp || "-")}</strong></div>
              </div>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <section class="total">
            <div class="row"><span>Subtotal</span><strong>${money(bill.subtotal)}</strong></div>
            <div class="row"><span>GST</span><strong>${money(bill.gstTotal)}</strong></div>
            <div class="row"><span>Discount</span><strong>${money(bill.discount)}</strong></div>
            <div class="row final"><span>Final</span><strong>${money(bill.finalTotal)}</strong></div>
            <div class="row"><span>Payment</span><strong>${escapeHtml(bill.customer.paymentStatus)}</strong></div>
          </section>
              <section class="upi-box">
                <div>
                  <h3>UPI / QR payment</h3>
                  <p>${escapeHtml(bill.hotel.upiId || "Add UPI ID in Billing Setup")}</p>
                </div>
                ${upiQr}
              </section>
            </section>
            <p class="footer">${escapeHtml(settings.footer || "Thank you for dining with us.")}</p>
          </main>
        </body>
      </html>`;
  }

  async function readImage(file) {
    if (file && window.smartHotelCloudStorage?.uploadFile) {
      try {
        return await window.smartHotelCloudStorage.uploadFile(file, "billing-files");
      } catch (error) {
        console.warn("Billing upload fell back to local preview.", error);
      }
    }
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(file);
    });
  }

  function renderTabs() {
    qsa("[data-billing-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.billingView === activeView);
    });
    qsa(".billing-view").forEach((view) => view.classList.remove("is-active"));
    qs(`#bill${activeView[0].toUpperCase()}${activeView.slice(1)}View`).classList.add("is-active");
  }

  function renderStats() {
    const bill = currentBillOrPreview();
    const cards = [
      ["Current bill", money(bill.finalTotal)],
      ["Cart items", state.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0)],
      ["GST", money(bill.gstTotal)],
      ["Bills generated", state.bills.length],
      ["Menu products", state.products.length]
    ];
    qs("#billingStats").innerHTML = cards.map(([label, value]) => `
      <article class="billing-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function renderAdmin() {
    const hotel = state.hotel;
    qs("#hotelProfilePreview").innerHTML = `
      <article class="profile-card">
        <div class="profile-logo">${hotel.logo ? `<img src="${hotel.logo}" alt="${escapeHtml(hotel.hotelName)} logo" />` : escapeHtml(initials(hotel.hotelName))}</div>
        <div>
          <h4>${escapeHtml(hotel.hotelName)}</h4>
          <p>${escapeHtml(hotel.address)}</p>
          <div class="profile-meta">
            <span class="status-pill">GSTIN ${escapeHtml(hotel.gstin)}</span>
            <span class="status-pill">Contact ${escapeHtml(hotel.contact)}</span>
            <span class="status-pill">${escapeHtml(hotel.taxPercent)}% default tax</span>
            <span class="status-pill">${hotel.tables.length} tables</span>
          </div>
        </div>
        <div class="upi-preview">${hotel.upiQr ? `<img src="${hotel.upiQr}" alt="UPI QR Code" />` : `<span class="status-pill warn">UPI QR empty</span>`}</div>
      </article>
    `;

    qs("#billingStaffList").innerHTML = state.staff.map((staff) => `
      <article class="billing-row">
        <div>
          <h4>${escapeHtml(staff.name)} <span class="status-pill">${escapeHtml(staff.role)}</span></h4>
          <p>${escapeHtml(staff.phone)}</p>
        </div>
        <button class="tiny-button danger" type="button" data-delete-billing-staff="${staff.id}">Remove</button>
      </article>
    `).join("") || emptyRow("No billing staff", "Add cashier or billing team member.");
  }

  function renderCategoryControls() {
    const options = `<option value="All">All categories</option>${categories().map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
    qs("#billingCategoryFilter").innerHTML = options;
    qs("#billingCategoryFilter").value = categoryFilter;
    qs("#menuCategorySelect").innerHTML = options;
    qs("#menuCategorySelect").value = menuCategory;
    qs("#billingCategoryChips").innerHTML = categories().map((category) => `<span class="billing-chip">${escapeHtml(category)}</span>`).join("");
  }

  function filteredProducts(search, category) {
    return state.products.filter((item) => {
      const haystack = `${item.name} ${item.category}`.toLowerCase();
      const categoryMatch = category === "All" || item.category === category;
      return categoryMatch && haystack.includes(search.toLowerCase());
    });
  }

  function renderProducts() {
    qs("#billingProductGrid").innerHTML = filteredProducts(productSearch, categoryFilter).map((item) => menuCard(item, false)).join("") || emptyRow("No product found", "Add a product or clear filters.");
    qs("#billingMenuPicker").innerHTML = filteredProducts(menuSearch, menuCategory).map((item) => menuCard(item, true)).join("") || emptyRow("No menu item found", "Try another category.");
  }

  function menuCard(item, canAdd) {
    const available = item.stock !== "Out of Stock";
    const offer = Number(item.offerPrice || 0) > 0;
    return `
      <article class="menu-card ${available ? "" : "is-disabled"}">
        <div class="menu-card-header">
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.category)} | GST ${escapeHtml(item.gstRate)}% | ${escapeHtml(item.stock)}</p>
          </div>
          <div class="menu-price">
            ${money(activePrice(item))}
            ${offer ? `<del>${money(item.price)}</del>` : ""}
          </div>
        </div>
        <div class="profile-meta">
          <span class="status-pill ${available ? "good" : "danger"}">${escapeHtml(item.stock)}</span>
          ${offer ? `<span class="status-pill warn">Offer</span>` : ""}
        </div>
        <div class="profile-meta">
          ${canAdd ? `<button class="tiny-button" type="button" data-add-bill-item="${item.id}" ${available ? "" : "disabled"}>Add to bill</button>` : ""}
          <button class="tiny-button danger" type="button" data-delete-bill-product="${item.id}">Remove</button>
        </div>
      </article>
    `;
  }

  function renderCustomerOptions() {
    const select = qs("#customerBillForm select[name='tableNumber']");
    select.innerHTML = state.hotel.tables.map((table) => `<option value="${escapeHtml(table)}">${escapeHtml(table)}</option>`).join("");
    select.value = state.customer.tableNumber || state.hotel.tables[0] || "";
  }

  function renderCart() {
    const bill = currentBillOrPreview();
    qs("#liveBillTotal").textContent = money(bill.finalTotal);
    const rows = bill.items.map((item) => `
      <article class="cart-row">
        <div>
          <h4>${escapeHtml(item.name)} <span class="status-pill">GST ${item.gstRate}%</span></h4>
          <p>Rate ${money(item.rate)} | Taxable ${money(item.taxable)} | GST ${money(item.gst)}</p>
        </div>
        <div class="quantity-control">
          <button type="button" data-cart-minus="${item.productId}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-cart-plus="${item.productId}">+</button>
        </div>
      </article>
    `).join("") || emptyRow("Cart is empty", "Select food items from the digital menu.");

    qs("#billingCart").innerHTML = `
      ${rows}
      <div class="bill-summary">
        <div class="bill-summary-row"><span>Subtotal</span><strong>${money(bill.subtotal)}</strong></div>
        <div class="bill-summary-row"><span>GST</span><strong>${money(bill.gstTotal)}</strong></div>
        <div class="bill-summary-row"><span>Discount</span><strong>${money(bill.discount)}</strong></div>
        <div class="bill-summary-row final"><span>Final bill</span><strong>${money(bill.finalTotal)}</strong></div>
        <div class="bill-summary-row"><span>Payment status</span><strong>${escapeHtml(bill.customer.paymentStatus)}</strong></div>
      </div>
    `;
  }

  function renderQrBill() {
    const bill = currentBillOrPreview();
    const billText = buildBillText(bill);
    const payLink = upiLink(bill);
    qs("#qrBillPanel").innerHTML = `
      <div class="qr-layout">
        <div class="real-qr">
          <img src="${qrImage(billText)}" alt="QR bill for ${escapeHtml(bill.billNo)}" />
        </div>
        <div class="bill-summary">
          <h3>${escapeHtml(bill.billNo)}</h3>
          <p class="bill-helper">Scan QR to view bill details. Protected downloads use the daily admin password.</p>
          <div class="bill-summary-row"><span>Customer</span><strong>${escapeHtml(bill.customer.customerName || "Customer")}</strong></div>
          <div class="bill-summary-row"><span>Table</span><strong>${escapeHtml(bill.customer.tableNumber || "-")}</strong></div>
          <div class="bill-summary-row"><span>GST</span><strong>${money(bill.gstTotal)}</strong></div>
          <div class="bill-summary-row final"><span>Final</span><strong>${money(bill.finalTotal)}</strong></div>
          <div class="qr-actions">
            <button class="primary-button" type="button" data-open-ebill>Open e-bill</button>
            <button class="secondary-button" type="button" data-download-ebill>Download e-bill</button>
            ${payLink ? `<a class="secondary-button" href="${payLink}">Pay UPI</a>` : `<span class="status-pill warn">Add UPI ID to enable payment</span>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderTransfers() {
    qs("#qrFileList").innerHTML = state.transfers.map((file) => `
      <article class="transfer-row">
        <div>
          <h4>${escapeHtml(file.name)} <span class="status-pill">${escapeHtml(file.type || "file")}</span></h4>
          <p>${escapeHtml(file.size)} | Ready for QR transfer</p>
        </div>
        <button class="tiny-button" type="button" data-transfer-preview="${file.id}">Show QR</button>
      </article>
    `).join("") || emptyRow("No transfer files", "Upload a PDF bill, ID proof, menu PDF or report.");

    const latest = state.transfers[0];
    qs("#fileTransferQr").innerHTML = latest ? `
      <div class="qr-layout">
        <div class="real-qr">
          <img src="${qrImage(latest.url || latest.name)}" alt="QR transfer for ${escapeHtml(latest.name)}" />
        </div>
        <div class="bill-summary">
          <h3>${escapeHtml(latest.name)}</h3>
          <p class="bill-helper">Scan QR or open this transfer file in the browser.</p>
          <a class="primary-button" href="${latest.url}" target="_blank" rel="noreferrer">Open file</a>
        </div>
      </div>
    ` : emptyRow("Transfer QR not generated", "Choose a file to create a QR transfer card.");
  }

  function emptyRow(title, detail) {
    return `
      <article class="billing-row">
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
    renderAdmin();
    renderCategoryControls();
    renderProducts();
    renderCustomerOptions();
    renderCart();
    renderQrBill();
    renderTransfers();
  }

  function populateForms() {
    const hotelForm = qs("#hotelSetupForm");
    hotelForm.elements.hotelName.value = state.hotel.hotelName || "";
    hotelForm.elements.gstin.value = state.hotel.gstin || "";
    hotelForm.elements.address.value = state.hotel.address || "";
    hotelForm.elements.contact.value = state.hotel.contact || "";
    hotelForm.elements.upiId.value = state.hotel.upiId || "";
    hotelForm.elements.taxPercent.value = state.hotel.taxPercent || "";
    hotelForm.elements.tables.value = state.hotel.tables.join(",");

    const customerForm = qs("#customerBillForm");
    customerForm.elements.customerName.value = state.customer.customerName || "";
    customerForm.elements.whatsapp.value = state.customer.whatsapp || "";
    customerForm.elements.discount.value = state.customer.discount || "";
    customerForm.elements.paymentStatus.value = state.customer.paymentStatus || "Unpaid";
    customerForm.elements.customMessage.value = state.customer.customMessage || "";
  }

  async function saveHotelSetup(form) {
    const data = new FormData(form);
    const logo = await readImage(form.elements.logo.files[0]);
    const upiQr = await readImage(form.elements.upiQr.files[0]);
    state.hotel = {
      ...state.hotel,
      hotelName: String(data.get("hotelName")).trim(),
      gstin: String(data.get("gstin")).trim(),
      address: String(data.get("address")).trim(),
      contact: String(data.get("contact")).trim(),
      upiId: String(data.get("upiId")).trim(),
      taxPercent: Number(data.get("taxPercent")),
      tables: String(data.get("tables")).split(",").map((item) => item.trim()).filter(Boolean),
      logo: logo || state.hotel.logo,
      upiQr: upiQr || state.hotel.upiQr
    };
    form.elements.logo.value = "";
    form.elements.upiQr.value = "";
    saveState();
    renderAll();
    populateForms();
  }

  function addStaff(form) {
    const data = new FormData(form);
    state.staff.push({
      id: uid("staff"),
      name: String(data.get("name")).trim(),
      role: String(data.get("role")).trim(),
      phone: String(data.get("phone")).trim()
    });
    form.reset();
    saveState();
    renderAll();
  }

  function addProduct(form) {
    const data = new FormData(form);
    const category = String(data.get("category")).trim();
    const name = String(data.get("name")).trim();
    state.products.push({
      id: uid("food"),
      category,
      name,
      price: Number(data.get("price")),
      gstRate: Number(data.get("gstRate")),
      offerPrice: Number(data.get("offerPrice") || 0),
      stock: String(data.get("stock"))
    });
    form.reset();
    saveState();
    renderAll();
  }

  function addToCart(productId) {
    const item = productById(productId);
    if (!item || item.stock === "Out of Stock") return;
    const cartItem = state.cart.find((row) => row.productId === productId);
    if (cartItem) cartItem.qty += 1;
    else state.cart.push({ productId, qty: 1 });
    saveState();
    renderAll();
  }

  function changeCart(productId, amount) {
    const cartItem = state.cart.find((row) => row.productId === productId);
    if (!cartItem) return;
    cartItem.qty += amount;
    if (cartItem.qty <= 0) state.cart = state.cart.filter((row) => row.productId !== productId);
    saveState();
    renderAll();
  }

  function generateBill(form) {
    const data = new FormData(form);
    state.customer = {
      customerName: String(data.get("customerName")).trim() || "Customer",
      whatsapp: String(data.get("whatsapp")).trim(),
      tableNumber: String(data.get("tableNumber")),
      discount: Number(data.get("discount") || 0),
      paymentStatus: String(data.get("paymentStatus")),
      customMessage: String(data.get("customMessage")).trim()
    };
    const calc = calculateBill(state.cart, state.customer);
    if (!calc.items.length) {
      alert("Add at least one item to generate a bill.");
      return;
    }
    const bill = {
      id: uid("bill"),
      billNo: billNo(),
      createdAt: timeNow(),
      hotel: { ...state.hotel },
      customer: { ...state.customer },
      ...calc
    };
    state.bills.unshift(bill);
    state.currentBillId = bill.id;
    activeView = "qr";
    saveState();
    renderAll();
    populateForms();
  }

  function verifyBillSecurityCode(action = "download") {
    const settings = loadBillSettings();
    if (!hasActiveSecurityCode(settings)) {
      alert("Owner has not set the e-bill security code yet. Open Overview > Bill Security Code first.");
      return false;
    }
    const entered = window.prompt(`Enter the owner e-bill security code to ${action}.`);
    if (entered === null) return false;
    if (entered !== String(settings.password || "")) {
      alert("Wrong e-bill security code. Please ask admin for the current code.");
      return false;
    }
    return true;
  }

  function downloadEbill() {
    if (!verifyBillSecurityCode("download")) return;
    const bill = currentBillOrPreview();
    const blob = new Blob([billHtml(bill, { protectedGate: false })], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${bill.billNo}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function openEbill() {
    const bill = currentBillOrPreview();
    const blob = new Blob([billHtml(bill, { protectedGate: false })], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function printBill() {
    const bill = currentBillOrPreview();
    const blob = new Blob([billHtml(bill, { protectedGate: false })], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      if (printWindow) printWindow.print();
      URL.revokeObjectURL(url);
    }, 600);
  }

  function shareWhatsApp(form) {
    if (!verifyBillSecurityCode("send")) return;
    const bill = currentBillOrPreview();
    const data = new FormData(form);
    const number = String(data.get("whatsapp") || bill.customer.whatsapp || "").replace(/\D/g, "");
    if (!number) {
      alert("Enter customer WhatsApp number.");
      return;
    }
    const custom = String(data.get("message") || bill.customer.customMessage || "").trim();
    const message = [
      custom || `Thank you for dining with ${bill.hotel.hotelName}.`,
      "",
      buildBillText(bill),
      "",
      `Payment Status: ${bill.customer.paymentStatus}`,
      "Your bill is ready. You can pay through UPI or download the e-bill."
    ].join("\n");
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function handleFileTransfer(file) {
    if (!file) return;
    const transfer = {
      id: uid("file"),
      name: file.name,
      type: file.type || "file",
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      url: URL.createObjectURL(file)
    };
    state.transfers.unshift(transfer);
    state.transfers = state.transfers.slice(0, 6);
    renderTransfers();
  }

  function seedData() {
    if (!confirm("Load demo billing data? This will replace current billing prototype data.")) return;
    state = defaultState();
    saveState();
    renderAll();
    populateForms();
  }

  function handleRootClick(event) {
    const viewButton = event.target.closest("[data-billing-view]");
    if (viewButton) {
      activeView = viewButton.dataset.billingView;
      renderAll();
    }

    const addButton = event.target.closest("[data-add-bill-item]");
    if (addButton) addToCart(addButton.dataset.addBillItem);

    const plusButton = event.target.closest("[data-cart-plus]");
    if (plusButton) changeCart(plusButton.dataset.cartPlus, 1);

    const minusButton = event.target.closest("[data-cart-minus]");
    if (minusButton) changeCart(minusButton.dataset.cartMinus, -1);

    const staffDelete = event.target.closest("[data-delete-billing-staff]");
    if (staffDelete) {
      state.staff = state.staff.filter((staff) => staff.id !== staffDelete.dataset.deleteBillingStaff);
      saveState();
      renderAll();
    }

    const productDelete = event.target.closest("[data-delete-bill-product]");
    if (productDelete) {
      const id = productDelete.dataset.deleteBillProduct;
      state.products = state.products.filter((item) => item.id !== id);
      state.cart = state.cart.filter((item) => item.productId !== id);
      saveState();
      renderAll();
    }

    if (event.target.closest("[data-open-ebill]")) openEbill();
    if (event.target.closest("[data-download-ebill]")) downloadEbill();
  }

  function bindEvents() {
    qs("#hotelSetupForm").addEventListener("submit", (event) => {
      event.preventDefault();
      saveHotelSetup(event.currentTarget);
    });

    qs("#billingStaffForm").addEventListener("submit", (event) => {
      event.preventDefault();
      addStaff(event.currentTarget);
    });

    qs("#billingProductForm").addEventListener("submit", (event) => {
      event.preventDefault();
      addProduct(event.currentTarget);
    });

    qs("#customerBillForm").addEventListener("submit", (event) => {
      event.preventDefault();
      generateBill(event.currentTarget);
    });

    qs("#whatsappBillForm").addEventListener("submit", (event) => {
      event.preventDefault();
      shareWhatsApp(event.currentTarget);
    });

    qs("#billingProductSearch").addEventListener("input", (event) => {
      productSearch = event.currentTarget.value;
      renderProducts();
    });

    qs("#billingCategoryFilter").addEventListener("change", (event) => {
      categoryFilter = event.currentTarget.value;
      renderProducts();
    });

    qs("#menuSearch").addEventListener("input", (event) => {
      menuSearch = event.currentTarget.value;
      renderProducts();
    });

    qs("#menuCategorySelect").addEventListener("change", (event) => {
      menuCategory = event.currentTarget.value;
      renderProducts();
    });

    qs("#qrFileInput").addEventListener("change", (event) => {
      handleFileTransfer(event.currentTarget.files[0]);
      event.currentTarget.value = "";
    });

    qs("#billingSeedButton")?.addEventListener("click", seedData);
    qs("#billingPrintButton")?.addEventListener("click", printBill);
    qs("#billingDownloadButton")?.addEventListener("click", downloadEbill);

    root.removeEventListener("click", handleRootClick);
    root.addEventListener("click", handleRootClick);
  }

  function init(mount) {
    root = mount;
    renderAll();
    populateForms();
    bindEvents();
  }

  return { init };
})();
