window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.menu = (() => {
  const STORAGE_KEY = "smartQrMenuSystemState";
  const VIDEO_LIMIT = 10 * 1024 * 1024;

  let root = null;
  let state = loadState();
  let activeCategory = "All";
  let searchText = "";
  let editingFoodId = null;
  let uploadedImage = "";
  let uploadedVideo = "";
  let uploadedHotelLogo = "";
  let uploadedHotelPhoto = "";
  let uploadedHotelVideo = "";
  let pendingVideoFile = null;
  let roomView = "3d";
  let qrDrawVersion = 0;

  function secureId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function imageSvg(label, a = "#2563eb", b = "#14b8a6") {
    const safe = String(label).replace(/[<>&"]/g, "");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="420" height="320" viewBox="0 0 420 320">
        <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <rect width="420" height="320" rx="34" fill="url(#g)"/>
        <circle cx="330" cy="70" r="58" fill="rgba(255,255,255,.18)"/>
        <circle cx="92" cy="242" r="80" fill="rgba(255,255,255,.16)"/>
        <text x="36" y="174" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="#fff">${safe}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function defaultState() {
    return {
      hotel: {
        id: "",
        registered: false,
        name: "",
        contact: "",
        address: "",
        logo: "",
        photo: "",
        video: "",
        googleReview: "",
        location: "",
        instagram: "",
        facebook: ""
      },
      settings: {
        mode: "both",
        restaurantEnabled: true,
        hotelEnabled: true,
        theme: "light",
        orderCount: 18,
        scanCount: 1240
      },
      categories: ["Veg", "Non-Veg", "Pizza", "Burger", "Drinks", "Ice Cream", "Snacks", "Special Items", "Desserts"],
      foodItems: [
        {
          id: "food-paneer",
          name: "Paneer Tikka",
          category: "Veg",
          price: 220,
          image: imageSvg("Paneer Tikka", "#16a34a", "#f59e0b"),
          video: "",
          description: "Smoky cottage cheese cubes with mint chutney.",
          available: true,
          featured: true
        },
        {
          id: "food-pizza",
          name: "Cheese Burst Pizza",
          category: "Pizza",
          price: 340,
          image: imageSvg("Pizza", "#dc2626", "#f97316"),
          video: "",
          description: "Loaded cheese pizza with fresh vegetables.",
          available: true,
          featured: false
        },
        {
          id: "food-lime",
          name: "Fresh Lime Soda",
          category: "Drinks",
          price: 90,
          image: imageSvg("Fresh Lime", "#06b6d4", "#22c55e"),
          video: "",
          description: "Cold sweet and salted lime soda.",
          available: true,
          featured: false
        }
      ],
      popups: [
        { id: "popup-combo", type: "Combo Offer", itemName: "Family Combo", image: imageSvg("Combo", "#7c3aed", "#ec4899"), offer: "Save 15% on pizza, fries and drinks combo." },
        { id: "popup-special", type: "Today Special", itemName: "Chef Special Thali", image: imageSvg("Thali", "#ea580c", "#facc15"), offer: "Today only: deluxe veg thali at ₹249." }
      ],
      floors: ["1st Floor", "2nd Floor"],
      rooms: [
        { id: "room-101", floor: "1st Floor", position: "left", type: "AC", name: "Room 101", price: 1800, image: imageSvg("Room 101", "#334155", "#2563eb"), video: "", available: "available" },
        { id: "room-102", floor: "1st Floor", position: "right", type: "Deluxe", name: "Room 102", price: 2400, image: imageSvg("Room 102", "#166534", "#14b8a6"), video: "", available: "booked" },
        { id: "room-hall", floor: "2nd Floor", position: "hall", type: "Premium", name: "Banquet Hall", price: 6000, image: imageSvg("Hall", "#7c2d12", "#f97316"), video: "", available: "available" }
      ]
    };
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? migrateState(JSON.parse(stored)) : defaultState();
    } catch {
      return defaultState();
    }
  }

  function migrateState(saved) {
    const fresh = defaultState();
    const migrated = {
      ...fresh,
      ...saved,
      hotel: {
        ...fresh.hotel,
        ...(saved.hotel || {})
      },
      settings: {
        ...fresh.settings,
        ...(saved.settings || {})
      },
      categories: Array.isArray(saved.categories) ? saved.categories : fresh.categories,
      foodItems: Array.isArray(saved.foodItems) ? saved.foodItems : fresh.foodItems,
      popups: Array.isArray(saved.popups) ? saved.popups : fresh.popups,
      floors: Array.isArray(saved.floors) ? saved.floors : fresh.floors,
      rooms: Array.isArray(saved.rooms) ? saved.rooms : fresh.rooms
    };
    if (migrated.hotel.logoUrl && !migrated.hotel.logo) {
      migrated.hotel.logo = migrated.hotel.logoUrl;
    }
    if (typeof migrated.hotel.registered !== "boolean") {
      migrated.hotel.registered = false;
      migrated.hotel.id = "";
    }
    return migrated;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Large local image data can exceed storage; the prototype still works for this session.
    }
  }

  function qs(selector) {
    return root.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function restaurantActive() {
    return state.settings.restaurantEnabled && state.settings.mode !== "hotel";
  }

  function hotelActive() {
    return state.settings.hotelEnabled && state.settings.mode !== "restaurant";
  }

  function menuUrl() {
    const basePath = location.pathname.replace(/\/?[^/]*$/, "/");
    return `${location.origin}${basePath}services/qr-menu/customer.html?hotel=${state.hotel.id}`;
  }

  function qrCodeImageUrl() {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(menuUrl())}`;
  }

  function phoneNumber() {
    const digits = String(state.hotel.contact || "").replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    return digits || "919999999999";
  }

  function orderLink(item) {
    const message = `Order request\nHotel: ${state.hotel.name}\nItem: ${item.name}\nPrice: ₹${item.price}`;
    return `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(message)}`;
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomFrom(seed) {
    let t = seed + 0x6D2B79F5;
    return () => {
      t += 0x6D2B79F5;
      let value = Math.imul(t ^ (t >>> 15), t | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawSecureQr() {
    const canvas = qs("#secureQrCanvas");
    if (!canvas) return;
    qrDrawVersion += 1;
    const version = qrDrawVersion;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    if (!state.hotel.registered || !state.hotel.id) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(22, 22, size - 44, size - 44);
      ctx.fillStyle = "#475569";
      ctx.font = "700 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Complete", size / 2, size / 2 - 8);
      ctx.fillText("registration", size / 2, size / 2 + 18);
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const download = qs("#downloadQrButton");
    if (download) download.href = qrCodeImageUrl();
    ctx.fillStyle = "#475569";
    ctx.font = "700 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Generating QR", size / 2, size / 2);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (version !== qrDrawVersion) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);
      try {
        if (download) download.href = canvas.toDataURL("image/png");
      } catch {
        if (download) download.href = qrCodeImageUrl();
      }
    };
    image.onerror = () => {
      if (version !== qrDrawVersion) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#475569";
      ctx.font = "700 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("QR image failed", size / 2, size / 2 - 8);
      ctx.fillText("Use customer link", size / 2, size / 2 + 18);
    };
    image.src = qrCodeImageUrl();
  }

  function renderAnalytics() {
    const cards = [
      ["Secure QR scans", state.settings.scanCount.toLocaleString("en-IN")],
      ["Food items", state.foodItems.length],
      ["Smart popups", `${state.popups.length}/10`],
      ["Rooms managed", state.rooms.length]
    ];
    qs("#analyticsCards").innerHTML = cards.map(([label, value]) => `
      <article class="qr-stat-card">
        <strong>${value}</strong>
        <span>${label}</span>
      </article>
    `).join("");
  }

  function renderHotel() {
    const form = qs("#hotelForm");
    form.elements.hotelName.value = state.hotel.name;
    form.elements.contact.value = state.hotel.contact;
    form.elements.address.value = state.hotel.address;
    form.elements.googleReview.value = state.hotel.googleReview;
    form.elements.location.value = state.hotel.location;
    form.elements.instagram.value = state.hotel.instagram;
    form.elements.facebook.value = state.hotel.facebook;

    const registered = Boolean(state.hotel.registered && state.hotel.id);
    qs("#secureQrId").textContent = registered ? `QR ID: ${state.hotel.id}` : "No QR ID yet";
    qs("#secureQrUrl").textContent = registered ? menuUrl() : "Fill all required hotel details, upload logo/picture, then register.";
    qs("#qrSecurityStatus").textContent = registered ? "128-bit unique QR ID active" : "Secure QR not generated";
    qs("#qrLockMessage").textContent = registered
      ? "Stable QR active. Updating hotel details, logo, photos, rooms, menu, or offers will keep this same QR link."
      : "QR code unlocks only after required hotel registration details are completed.";
    qs("#hotelSubmitButton").textContent = registered ? "Save hotel details (QR unchanged)" : "Register hotel and generate QR";
    qs("#hotelLogoRequirement").textContent = state.hotel.logo ? "Upload new logo / picture optional" : "Upload logo / picture required";
    qs("#qrStabilityNote").textContent = registered
      ? "Safe to update: your printed/scanned QR code will keep working with the same link."
      : "After QR generation, future edits keep the same QR link.";
    qs(".qr-preview-card").classList.toggle("is-locked", !registered);
    qs("#copyQrLinkButton").disabled = !registered;
    qs("#regenerateQrButton").disabled = !registered;
    qs("#regenerateQrButton").title = "Only use this when you intentionally want old printed QR codes to stop working.";
    qs("#downloadQrButton").setAttribute("aria-disabled", String(!registered));
    qs("#openCustomerPageButton").setAttribute("aria-disabled", String(!registered));
    qs("#openCustomerPageButton").href = registered ? menuUrl() : "#";
    qs("#restaurantEnabled").checked = state.settings.restaurantEnabled;
    qs("#hotelEnabled").checked = state.settings.hotelEnabled;
    qsa("[data-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === state.settings.mode);
    });

    const avatar = qs("#hotelAvatar");
    avatar.innerHTML = state.hotel.logo ? `<img src="${state.hotel.logo}" alt="${state.hotel.name} logo" />` : "QR";
    qs("#customerHotelName").textContent = state.hotel.name || "Register your hotel";
    qs("#customerHotelAddress").textContent = state.hotel.address || "Address will appear here";
    qs("#hotelInfoText").textContent = `${state.hotel.address || "Address not added"} | Contact: ${state.hotel.contact || "Not added"}`;
    qs("#socialLinks").innerHTML = [
      state.hotel.location ? `<a href="${state.hotel.location}" target="_blank" rel="noreferrer">Location</a>` : "",
      state.hotel.instagram ? `<a href="${state.hotel.instagram}" target="_blank" rel="noreferrer">Instagram</a>` : "",
      state.hotel.facebook ? `<a href="${state.hotel.facebook}" target="_blank" rel="noreferrer">Facebook</a>` : ""
    ].filter(Boolean).join("");
    qs("#hotelMediaPreview").innerHTML = [
      state.hotel.logo ? `<figure><img src="${state.hotel.logo}" alt="Hotel logo" /><figcaption>Logo / picture</figcaption></figure>` : "",
      state.hotel.photo ? `<figure><img src="${state.hotel.photo}" alt="Hotel photo" /><figcaption>Hotel photo</figcaption></figure>` : "",
      state.hotel.video ? `<figure><video src="${state.hotel.video}" controls></video><figcaption>Hotel video</figcaption></figure>` : ""
    ].filter(Boolean).join("");
    drawSecureQr();
  }

  function renderCategories() {
    qs("#categoryList").innerHTML = state.categories.map((category) => `
      <span class="tag-pill">${category}<button type="button" data-delete-category="${category}">&times;</button></span>
    `).join("");

    const foodCategory = qs("#foodForm select[name='category']");
    foodCategory.innerHTML = state.categories.map((category) => `<option value="${category}">${category}</option>`).join("");

    const categoryFilter = qs("#categoryFilter");
    categoryFilter.innerHTML = `<option value="All">All categories</option>${state.categories.map((category) => `<option value="${category}">${category}</option>`).join("")}`;
    categoryFilter.value = activeCategory;

    qs("#customerCategoryChips").innerHTML = ["All", ...state.categories].map((category) => `
      <button class="customer-chip ${category === activeCategory ? "is-active" : ""}" type="button" data-filter-category="${category}">${category}</button>
    `).join("");
  }

  function thumbMarkup(item, className = "food-thumb") {
    return `
      <button class="${className}" type="button" data-open-media="${item.id}">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : item.name.slice(0, 2).toUpperCase()}
      </button>
    `;
  }

  function renderAdminFood() {
    qs("#adminFoodList").innerHTML = state.foodItems.map((item) => `
      <article class="admin-food-card">
        ${thumbMarkup(item)}
        <div>
          <h4>${item.name} <span class="food-price">₹${item.price}</span></h4>
          <p>${item.category} | ${item.description || "No description"}</p>
          <div class="food-badges">
            <span class="badge ${item.available ? "" : "off"}">${item.available ? "Available" : "Hidden"}</span>
            ${item.featured ? `<span class="badge">Featured</span>` : ""}
            ${item.video ? `<span class="badge">Video</span>` : ""}
          </div>
        </div>
        <div class="admin-card-actions">
          <button class="secondary-button" type="button" data-edit-food="${item.id}">Edit</button>
          <button class="secondary-button" type="button" data-delete-food="${item.id}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function filteredFoodItems() {
    return state.foodItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const haystack = `${item.name} ${item.category} ${item.description}`.toLowerCase();
      return item.available && matchesCategory && haystack.includes(searchText.toLowerCase());
    });
  }

  function renderCustomerFood() {
    const section = qs("#foodCustomerPage");
    section.classList.toggle("is-hidden", !restaurantActive());
    if (!restaurantActive()) {
      qs("#customerFoodList").innerHTML = `<article class="hotel-info-card"><h3>Restaurant menu disabled</h3><p>Admin has enabled only hotel mode.</p></article>`;
      return;
    }
    const items = filteredFoodItems();
    qs("#customerFoodList").innerHTML = items.map((item) => `
      <article class="food-card ${item.featured ? "featured" : ""}">
        ${thumbMarkup(item)}
        <div>
          <h4>${item.name}</h4>
          <p>${item.description || item.category}</p>
          <div class="food-badges">
            <span class="food-price">₹${item.price}</span>
            <span class="badge">${item.category}</span>
            ${item.featured ? `<span class="badge">Featured</span>` : ""}
            ${item.video ? `<span class="badge">Tap image for video</span>` : `<span class="badge off">No video</span>`}
          </div>
          <a class="order-link" href="${orderLink(item)}" target="_blank" rel="noreferrer" data-order-food="${item.id}">WhatsApp order</a>
        </div>
      </article>
    `).join("") || `<article class="hotel-info-card"><h3>No item found</h3><p>Try another search or category.</p></article>`;
  }

  function renderPopups() {
    qs("#popupList").innerHTML = state.popups.map((popup) => `
      <span class="popup-pill">${popup.type}: ${popup.itemName}<button type="button" data-delete-popup="${popup.id}">&times;</button></span>
    `).join("");
  }

  function renderFloorsAndRooms() {
    const floorSelect = qs("#roomForm select[name='floor']");
    floorSelect.innerHTML = state.floors.map((floor) => `<option value="${floor}">${floor}</option>`).join("");
    renderRoomViews();
  }

  function roomCard(room) {
    return `
      <button class="room-card ${room.available}" type="button" data-open-room="${room.id}">
        <strong>${room.name}</strong>
        <span>${room.type} | ₹${room.price}</span>
        <span>${room.available}</span>
      </button>
    `;
  }

  function renderRoomViews() {
    const hotelPage = qs("#hotelCustomerPage");
    hotelPage.classList.toggle("is-hidden", !hotelActive());
    if (!hotelActive()) {
      qs("#room3dView").innerHTML = `<article class="hotel-info-card"><h3>Hotel room section disabled</h3><p>Admin has enabled only restaurant mode.</p></article>`;
      qs("#roomNormalView").innerHTML = "";
      return;
    }

    qs("#room3dView").innerHTML = state.floors.map((floor) => {
      const rooms = state.rooms.filter((room) => room.floor === floor);
      const left = rooms.filter((room) => room.position === "left").map(roomCard).join("");
      const right = rooms.filter((room) => room.position === "right").map(roomCard).join("");
      const hall = rooms.filter((room) => room.position === "hall").map(roomCard).join("");
      return `
        <div class="building-floor">
          <div class="room-column">${left || "<span></span>"}</div>
          <div class="floor-core">${floor}</div>
          <div class="room-column">${right || hall || "<span></span>"}</div>
        </div>
      `;
    }).join("");

    qs("#roomNormalView").innerHTML = state.rooms.map((room) => `
      <article class="room-normal-card">
        <button class="room-thumb" type="button" data-open-room="${room.id}">
          ${room.image ? `<img src="${room.image}" alt="${room.name}" />` : room.name}
        </button>
        <div>
          <h4>${room.name}</h4>
          <p>${room.floor} | ${room.position} | ${room.type}</p>
          <span>₹${room.price} | ${room.available}</span>
        </div>
        <button class="secondary-button" type="button" data-open-room="${room.id}">View</button>
      </article>
    `).join("");
  }

  function renderTheme() {
    qs(".qr-menu-system").dataset.theme = state.settings.theme;
    qs("#themeToggleButton").textContent = state.settings.theme === "dark" ? "Light theme" : "Dark theme";
  }

  function renderAll() {
    renderTheme();
    renderAnalytics();
    renderHotel();
    renderCategories();
    renderAdminFood();
    renderCustomerFood();
    renderPopups();
    renderFloorsAndRooms();
  }

  function showMedia(item) {
    const body = qs("#mediaModalBody");
    const videoBlock = item.video
      ? `<video controls src="${item.video}"></video>`
      : `<img src="${item.image || imageSvg(item.name)}" alt="${item.name}" /><p class="helper-text">No video uploaded yet. Admin can add video URL or upload a video file.</p>`;
    body.innerHTML = `
      <h3>${item.name}</h3>
      ${videoBlock}
      <p>${item.description || `${item.type || item.category} item`}</p>
    `;
    qs("#mediaModal").classList.remove("is-hidden");
  }

  function showRoom(room) {
    const body = qs("#mediaModalBody");
    body.innerHTML = `
      <h3>${room.name}</h3>
      ${room.video ? `<video controls src="${room.video}"></video>` : `<img src="${room.image || imageSvg(room.name)}" alt="${room.name}" />`}
      <p>${room.floor} | ${room.position} | ${room.type}</p>
      <strong>₹${room.price} | ${room.available}</strong>
    `;
    qs("#mediaModal").classList.remove("is-hidden");
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function readImageFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    uploadedImage = await fileToDataUrl(file);
  }

  async function readHotelImageFile(input, target) {
    const file = input.files?.[0];
    if (!file) return;
    const value = await fileToDataUrl(file);
    if (target === "logo") uploadedHotelLogo = value;
    if (target === "photo") uploadedHotelPhoto = value;
  }

  function readHotelVideoFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > VIDEO_LIMIT) {
      alert("Hotel video is larger than 10MB. Please upload a smaller video for this prototype.");
      input.value = "";
      return;
    }
    uploadedHotelVideo = URL.createObjectURL(file);
  }

  function readVideoFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    const panel = qs("#compressPanel");
    if (file.size > VIDEO_LIMIT) {
      pendingVideoFile = file;
      uploadedVideo = "";
      panel.classList.remove("is-hidden");
      return;
    }
    pendingVideoFile = null;
    uploadedVideo = URL.createObjectURL(file);
    panel.classList.add("is-hidden");
  }

  function resetFoodForm() {
    editingFoodId = null;
    uploadedImage = "";
    uploadedVideo = "";
    pendingVideoFile = null;
    qs("#foodForm").reset();
    qs("#foodForm input[name='available']").checked = true;
    qs("#compressPanel").classList.add("is-hidden");
    qs("#foodSubmitButton").textContent = "Add food item";
  }

  function bindEvents() {
    qs("#hotelLogoFile").addEventListener("change", (event) => readHotelImageFile(event.currentTarget, "logo"));
    qs("#hotelPhotoFile").addEventListener("change", (event) => readHotelImageFile(event.currentTarget, "photo"));
    qs("#hotelVideoFile").addEventListener("change", (event) => readHotelVideoFile(event.currentTarget));

    qs("#hotelForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const logo = uploadedHotelLogo || state.hotel.logo;
      if (!String(data.get("hotelName")).trim() || !String(data.get("contact")).trim() || !String(data.get("address")).trim() || !String(data.get("googleReview")).trim() || !String(data.get("location")).trim() || !logo) {
        alert("Please complete hotel name, contact, address, Google review link, location link, and upload logo/picture before generating QR.");
        return;
      }
      state.hotel = {
        ...state.hotel,
        registered: true,
        id: state.hotel.id || secureId(),
        name: String(data.get("hotelName")).trim(),
        contact: String(data.get("contact")).trim(),
        address: String(data.get("address")).trim(),
        logo,
        photo: uploadedHotelPhoto || state.hotel.photo,
        video: uploadedHotelVideo || state.hotel.video,
        googleReview: String(data.get("googleReview")).trim(),
        location: String(data.get("location")).trim(),
        instagram: String(data.get("instagram")).trim(),
        facebook: String(data.get("facebook")).trim()
      };
      saveState();
      renderAll();
    });

    qs("#copyQrLinkButton").addEventListener("click", async () => {
      if (!state.hotel.registered) return;
      try {
        await navigator.clipboard.writeText(menuUrl());
      } catch {
        window.prompt("Copy secure QR menu link", menuUrl());
      }
    });

    qs("#regenerateQrButton").addEventListener("click", () => {
      if (!state.hotel.registered) return;
      const confirmed = window.confirm("Reset QR ID? Old printed/shared QR codes will stop working. Use this only if you want a completely new QR code.");
      if (!confirmed) return;
      state.hotel.id = secureId();
      state.settings.scanCount = 0;
      saveState();
      renderAll();
    });

    qsa("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.mode = button.dataset.mode;
        state.settings.restaurantEnabled = button.dataset.mode !== "hotel";
        state.settings.hotelEnabled = button.dataset.mode !== "restaurant";
        saveState();
        renderAll();
      });
    });

    qs("#restaurantEnabled").addEventListener("change", (event) => {
      state.settings.restaurantEnabled = event.currentTarget.checked;
      state.settings.mode = state.settings.restaurantEnabled && state.settings.hotelEnabled ? "both" : state.settings.restaurantEnabled ? "restaurant" : "hotel";
      saveState();
      renderAll();
    });

    qs("#hotelEnabled").addEventListener("change", (event) => {
      state.settings.hotelEnabled = event.currentTarget.checked;
      state.settings.mode = state.settings.restaurantEnabled && state.settings.hotelEnabled ? "both" : state.settings.hotelEnabled ? "hotel" : "restaurant";
      saveState();
      renderAll();
    });

    qs("#categoryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const category = String(new FormData(event.currentTarget).get("category")).trim();
      if (category && !state.categories.includes(category)) state.categories.push(category);
      event.currentTarget.reset();
      saveState();
      renderAll();
    });

    qs("#dishImageFile").addEventListener("change", (event) => readImageFile(event.currentTarget));
    qs("#dishVideoFile").addEventListener("change", (event) => readVideoFile(event.currentTarget));

    qs("#compressVideoButton").addEventListener("click", () => {
      if (!pendingVideoFile) return;
      uploadedVideo = URL.createObjectURL(pendingVideoFile);
      qs("#compressPanel span").textContent = `Compressed preview ready at ${qs("#compressQuality").value}.`;
      pendingVideoFile = null;
    });

    qs("#foodForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const item = {
        id: editingFoodId || `food-${secureId().slice(0, 8)}`,
        name: String(data.get("name")).trim(),
        category: String(data.get("category")),
        price: Number(data.get("price")),
        image: uploadedImage || String(data.get("imageUrl")).trim() || imageSvg(String(data.get("name")).trim()),
        video: uploadedVideo || String(data.get("videoUrl")).trim(),
        description: String(data.get("description")).trim(),
        available: Boolean(data.get("available")),
        featured: Boolean(data.get("featured"))
      };
      if (editingFoodId) {
        state.foodItems = state.foodItems.map((existing) => existing.id === editingFoodId ? item : existing);
      } else {
        state.foodItems.push(item);
      }
      resetFoodForm();
      saveState();
      renderAll();
    });

    qs("#popupForm").addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.popups.length >= 10) {
        alert("Maximum 10 smart popups allowed.");
        return;
      }
      const data = new FormData(event.currentTarget);
      state.popups.push({
        id: `popup-${secureId().slice(0, 8)}`,
        itemName: String(data.get("itemName")).trim(),
        image: String(data.get("image")).trim() || imageSvg(String(data.get("itemName")).trim(), "#7c3aed", "#ec4899"),
        offer: String(data.get("offer")).trim(),
        type: String(data.get("type"))
      });
      event.currentTarget.reset();
      saveState();
      renderAll();
    });

    qs("#floorForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const floor = String(new FormData(event.currentTarget).get("floor")).trim();
      if (floor && !state.floors.includes(floor)) state.floors.push(floor);
      event.currentTarget.reset();
      saveState();
      renderAll();
    });

    qs("#roomForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.rooms.push({
        id: `room-${secureId().slice(0, 8)}`,
        floor: String(data.get("floor")),
        position: String(data.get("position")),
        type: String(data.get("type")),
        name: String(data.get("name")).trim(),
        price: Number(data.get("price")),
        image: String(data.get("image")).trim() || imageSvg(String(data.get("name")).trim(), "#334155", "#2563eb"),
        video: String(data.get("video")).trim(),
        available: String(data.get("available"))
      });
      event.currentTarget.reset();
      saveState();
      renderAll();
    });

    qs("#menuSearch").addEventListener("input", (event) => {
      searchText = event.currentTarget.value;
      renderCustomerFood();
    });

    qs("#categoryFilter").addEventListener("change", (event) => {
      activeCategory = event.currentTarget.value;
      renderCategories();
      renderCustomerFood();
    });

    qsa("[data-customer-page]").forEach((button) => {
      button.addEventListener("click", () => {
        qsa("[data-customer-page]").forEach((item) => item.classList.remove("is-active"));
        qsa(".customer-page").forEach((page) => page.classList.remove("is-active"));
        button.classList.add("is-active");
        qs(`#${button.dataset.customerPage}CustomerPage`).classList.add("is-active");
      });
    });

    qsa("[data-room-view]").forEach((button) => {
      button.addEventListener("click", () => {
        roomView = button.dataset.roomView;
        qsa("[data-room-view]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        qs("#room3dView").classList.toggle("is-hidden", roomView !== "3d");
        qs("#roomNormalView").classList.toggle("is-hidden", roomView !== "normal");
      });
    });

    qs("#themeToggleButton").addEventListener("click", () => {
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      saveState();
      renderTheme();
    });

    root.addEventListener("click", (event) => {
      const categoryButton = event.target.closest("[data-filter-category]");
      if (categoryButton) {
        activeCategory = categoryButton.dataset.filterCategory;
        renderCategories();
        renderCustomerFood();
      }

      const deleteCategory = event.target.closest("[data-delete-category]");
      if (deleteCategory) {
        state.categories = state.categories.filter((category) => category !== deleteCategory.dataset.deleteCategory);
        if (activeCategory === deleteCategory.dataset.deleteCategory) activeCategory = "All";
        saveState();
        renderAll();
      }

      const deletePopup = event.target.closest("[data-delete-popup]");
      if (deletePopup) {
        state.popups = state.popups.filter((popup) => popup.id !== deletePopup.dataset.deletePopup);
        saveState();
        renderAll();
      }

      const deleteFood = event.target.closest("[data-delete-food]");
      if (deleteFood) {
        state.foodItems = state.foodItems.filter((item) => item.id !== deleteFood.dataset.deleteFood);
        saveState();
        renderAll();
      }

      const editFood = event.target.closest("[data-edit-food]");
      if (editFood) {
        const item = state.foodItems.find((food) => food.id === editFood.dataset.editFood);
        if (!item) return;
        const form = qs("#foodForm");
        editingFoodId = item.id;
        uploadedImage = item.image;
        uploadedVideo = item.video;
        form.elements.name.value = item.name;
        form.elements.category.value = item.category;
        form.elements.price.value = item.price;
        form.elements.imageUrl.value = item.image && !item.image.startsWith("data:") ? item.image : "";
        form.elements.videoUrl.value = item.video && !item.video.startsWith("blob:") ? item.video : "";
        form.elements.description.value = item.description;
        form.elements.available.checked = item.available;
        form.elements.featured.checked = item.featured;
        qs("#foodSubmitButton").textContent = "Update food item";
      }

      const mediaButton = event.target.closest("[data-open-media]");
      if (mediaButton) {
        const item = state.foodItems.find((food) => food.id === mediaButton.dataset.openMedia);
        if (item) showMedia(item);
      }

      const roomButton = event.target.closest("[data-open-room]");
      if (roomButton) {
        const room = state.rooms.find((item) => item.id === roomButton.dataset.openRoom);
        if (room) showRoom(room);
      }

      if (event.target.closest("[data-close-modal]")) qs("#mediaModal").classList.add("is-hidden");
      const orderButton = event.target.closest("[data-order-food]");
      if (orderButton) {
        state.settings.orderCount += 1;
        saveState();
        renderAnalytics();
      }
    });
  }

  function init(mount) {
    root = mount;
    renderAll();
    bindEvents();
  }

  return { init };
})();
