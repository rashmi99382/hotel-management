const STORAGE_KEY = "smartQrMenuSystemState";

const state = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
})();

let activeCategory = "All";
let searchText = "";
let popupIndex = 0;
let popupElapsed = 0;

function qs(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function requestedHotelId() {
  return new URLSearchParams(location.search).get("hotel");
}

function phoneNumber() {
  const digits = String(state.hotel?.contact || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits || "919999999999";
}

function orderLink(item) {
  const message = `Order request\nHotel: ${state.hotel?.name || ""}\nItem: ${item.name}\nPrice: ₹${item.price}`;
  return `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(message)}`;
}

function categories() {
  return Array.isArray(state.categories) ? state.categories : [];
}

function foodItems() {
  return Array.isArray(state.foodItems) ? state.foodItems.filter((item) => item.available) : [];
}

function featuredItems() {
  const items = foodItems();
  return items.filter((item) => item.featured).length ? items.filter((item) => item.featured) : items.slice(0, 3);
}

function rooms() {
  return Array.isArray(state.rooms) ? state.rooms : [];
}

function restaurantActive() {
  const settings = state.settings || {};
  return settings.restaurantEnabled !== false && settings.mode !== "hotel";
}

function hotelActive() {
  const settings = state.settings || {};
  return settings.hotelEnabled !== false && settings.mode !== "restaurant";
}

function isValidQr() {
  return Boolean(state.hotel?.registered && state.hotel?.id && requestedHotelId() === state.hotel.id);
}

function renderInvalid() {
  qs("#scanHotelName").textContent = "Invalid or inactive QR";
  qs("#scanHotelAddress").textContent = "Ask the restaurant admin for the latest QR code.";
  qs("#scanHeroMedia").innerHTML = "";
  qs("#scanHeroStats").innerHTML = "";
  qs("#scanTabs").classList.add("is-hidden");
  qs("#scanTools").classList.add("is-hidden");
  qs("#scanCategoryRail").classList.add("is-hidden");
  qs("#scanCategorySections").innerHTML = `
    <article class="hotel-info-card">
      <h3>Menu not available</h3>
      <p>This QR code is not active, or it does not match the registered hotel.</p>
    </article>
  `;
  qs("#scanHotelInfo").innerHTML = "";
  qs("#scanHotelGallery").innerHTML = "";
  qs("#scanRoomSummary").innerHTML = "";
  qs("#scanRoomList").innerHTML = "";
}

function renderHeader() {
  const hotel = state.hotel || {};
  const availableRooms = rooms().filter((room) => room.available === "available").length;
  const heroImage = hotel.photo || featuredItems().find((item) => item.image)?.image || hotel.logo;
  qs("#scanHotelAvatar").innerHTML = hotel.logo ? `<img src="${escapeHtml(hotel.logo)}" alt="${escapeHtml(hotel.name)} logo" />` : "QR";
  qs("#scanHotelName").textContent = hotel.name;
  qs("#scanHotelAddress").textContent = hotel.address;
  qs("#scanHeroMedia").innerHTML = hotel.video
    ? `<video src="${escapeHtml(hotel.video)}" autoplay muted loop playsinline></video>`
    : heroImage ? `<img src="${escapeHtml(heroImage)}" alt="${escapeHtml(hotel.name || "Restaurant")} preview" />` : "";
  qs("#scanHeroStats").innerHTML = [
    `<span><strong>${foodItems().length}</strong> dishes</span>`,
    `<span><strong>${categories().length}</strong> categories</span>`,
    hotelActive() ? `<span><strong>${availableRooms}</strong> rooms</span>` : "",
    restaurantActive() ? `<span>WhatsApp orders</span>` : ""
  ].filter(Boolean).join("");
}

function renderFilters() {
  qs("#scanCategory").innerHTML = `<option value="All">All categories</option>${categories().map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
  qs("#scanCategory").value = activeCategory;
  qs("#scanCategoryRail").innerHTML = ["All", ...categories()].map((category) => `
    <button class="${category === activeCategory ? "is-active" : ""}" type="button" data-scan-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");
}

function filteredItems(category) {
  return foodItems().filter((item) => {
    const categoryMatch = category === "All" || item.category === category;
    const activeMatch = activeCategory === "All" || item.category === activeCategory;
    const text = `${item.name} ${item.category} ${item.description}`.toLowerCase();
    return categoryMatch && activeMatch && text.includes(searchText.toLowerCase());
  });
}

function renderFoodCard(item) {
  return `
    <article class="food-card scan-food-card ${item.featured ? "featured" : ""}">
      <button class="food-thumb scan-food-thumb" type="button" data-open-scan-media="${escapeHtml(item.id)}" aria-label="View ${escapeHtml(item.name)} media">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />` : escapeHtml(item.name.slice(0, 2).toUpperCase())}
      </button>
      <div class="scan-food-body">
        <div class="scan-food-topline">
          <span>${escapeHtml(item.category)}</span>
          <strong>₹${item.price}</strong>
        </div>
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.description || item.category)}</p>
        <div class="food-badges">
          <span class="badge">${item.featured ? "Chef pick" : "Fresh"}</span>
          ${item.featured ? `<span class="badge">Featured</span>` : ""}
          ${item.video ? `<span class="badge">Tap image for video</span>` : ""}
        </div>
        <div class="scan-food-actions">
          <a class="order-link" href="${escapeHtml(orderLink(item))}" target="_blank" rel="noreferrer">Order on WhatsApp</a>
          <button class="scan-view-button" type="button" data-open-scan-media="${escapeHtml(item.id)}">View</button>
        </div>
      </div>
    </article>
  `;
}

function renderMenu() {
  if (!restaurantActive()) {
    qs("#scanTools").classList.add("is-hidden");
    qs("#scanCategoryRail").classList.add("is-hidden");
    qs("#scanCategorySections").innerHTML = `
      <article class="hotel-info-card">
        <h3>Restaurant menu disabled</h3>
        <p>The admin has enabled hotel information only for this QR.</p>
      </article>
    `;
    return;
  }
  qs("#scanTools").classList.remove("is-hidden");
  qs("#scanCategoryRail").classList.remove("is-hidden");
  const visibleCategories = activeCategory === "All" ? categories() : [activeCategory];
  const sections = visibleCategories.map((category) => {
    const items = filteredItems(category);
    if (!items.length) return "";
    return `
      <section class="scan-category-block">
        <div class="scan-section-heading">
          <div>
            <span>Fresh from kitchen</span>
            <h2>${escapeHtml(category)}</h2>
          </div>
          <strong>${items.length} item${items.length === 1 ? "" : "s"}</strong>
        </div>
        <div class="customer-food-list">${items.map(renderFoodCard).join("")}</div>
      </section>
    `;
  }).filter(Boolean);

  qs("#scanCategorySections").innerHTML = sections.join("") || `
    <article class="hotel-info-card">
      <h3>No item found</h3>
      <p>Try a different category or search.</p>
    </article>
  `;
}

function showMedia(item) {
  qs("#scanMediaBody").innerHTML = `
    <h3>${escapeHtml(item.name)}</h3>
    ${item.video ? `<video controls src="${escapeHtml(item.video)}"></video>` : `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />`}
    <p>${escapeHtml(item.description || item.category)}</p>
  `;
  qs("#scanMediaModal").classList.remove("is-hidden");
}

function renderTabs() {
  const foodButton = qs("[data-scan-page='food']");
  const hotelButton = qs("[data-scan-page='hotel']");
  foodButton.disabled = !restaurantActive();
  hotelButton.disabled = !hotelActive();
  setScanPage(restaurantActive() ? "food" : "hotel");
}

function setScanPage(page) {
  const targetPage = page === "hotel" && hotelActive() ? "hotel" : "food";
  document.querySelectorAll("[data-scan-page]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.scanPage === targetPage);
  });
  qs("#scanFoodPage").classList.toggle("is-active", targetPage === "food");
  qs("#scanHotelPage").classList.toggle("is-active", targetPage === "hotel");
}

function actionTile(href, label, value) {
  if (!href) return "";
  return `
    <a class="scan-hotel-action" href="${escapeHtml(href)}" target="${href.startsWith("tel:") ? "_self" : "_blank"}" rel="noreferrer">
      <span>${label}</span>
      <strong>${value}</strong>
    </a>
  `;
}

function renderHotelInfo() {
  const hotel = state.hotel || {};
  const roomTotal = rooms().length;
  const allRooms = rooms();
  const available = allRooms.filter((room) => room.available === "available");
  const availableRooms = available.length;
  const availableLabel = `${availableRooms} ${availableRooms === 1 ? "room" : "rooms"}`;
  const roomPrices = allRooms.map((room) => Number(room.price)).filter(Boolean);
  const bestPrice = roomPrices.length ? Math.min(...roomPrices) : 0;
  const roomTypes = [...new Set(allRooms.map((room) => room.type).filter(Boolean))].slice(0, 3).join(" / ");
  const phoneHref = hotel.contact ? `tel:${phoneNumber()}` : "";
  const locationHref = safeUrl(hotel.location);
  const reviewHref = safeUrl(hotel.googleReview);
  const instagramHref = safeUrl(hotel.instagram);
  const facebookHref = safeUrl(hotel.facebook);
  qs("#scanHotelInfo").innerHTML = `
    <div class="scan-hotel-overview">
      <div>
        <span class="scan-section-kicker">Hotel Information</span>
        <h3>${escapeHtml(hotel.name || "Hotel Information")}</h3>
        <p>${escapeHtml(hotel.address || "Address not available")}</p>
      </div>
      <div class="scan-hotel-metrics">
        <span><strong>${availableRooms}</strong>Available rooms</span>
        <span><strong>${roomTotal}</strong>Total rooms</span>
        ${bestPrice ? `<span><strong>₹${bestPrice}</strong>Starting price</span>` : ""}
        ${roomTypes ? `<span><strong>${escapeHtml(roomTypes)}</strong>Room types</span>` : ""}
      </div>
      <div class="scan-hotel-actions">
        ${actionTile(locationHref, "Find us", "Location")}
        ${actionTile(phoneHref, "Talk to us", hotel.contact || "Call")}
        ${actionTile(reviewHref, "Experience", "Review")}
        ${actionTile(instagramHref, "Social", "Instagram")}
        ${actionTile(facebookHref, "Social", "Facebook")}
      </div>
    </div>
  `;

  qs("#scanHotelGallery").innerHTML = [
    hotel.photo ? `<figure class="feature"><img src="${escapeHtml(hotel.photo)}" alt="${escapeHtml(hotel.name || "Hotel")} photo" /><figcaption>Hotel photo</figcaption></figure>` : "",
    hotel.video ? `<figure class="feature"><video src="${escapeHtml(hotel.video)}" controls></video><figcaption>Hotel video</figcaption></figure>` : "",
    hotel.logo ? `<figure><img src="${escapeHtml(hotel.logo)}" alt="${escapeHtml(hotel.name || "Hotel")} logo" /><figcaption>Logo / picture</figcaption></figure>` : ""
  ].filter(Boolean).join("");

  if (!hotelActive()) {
    qs("#scanRoomSummary").innerHTML = "<h3>Hotel section disabled</h3><p>The admin has enabled restaurant menu only for this QR.</p>";
    qs("#scanRoomList").innerHTML = "";
    return;
  }

  qs("#scanRoomSummary").innerHTML = `
    <div class="scan-room-summary">
      <div>
        <span class="scan-section-kicker">Stay with us</span>
        <h3>Rooms & availability</h3>
        <p>${availableLabel} available now. Choose a room to view photo, video, floor, type and price.</p>
      </div>
      ${bestPrice ? `<strong>From ₹${bestPrice}</strong>` : ""}
    </div>
  `;
  qs("#scanRoomList").innerHTML = rooms().map(renderRoomCard).join("") || `
    <article class="hotel-info-card">
      <h3>No rooms added</h3>
      <p>Admin can add floors and rooms from the QR Menu dashboard.</p>
    </article>
  `;
}

function renderRoomCard(room) {
  const available = room.available === "available";
  return `
    <article class="room-normal-card scan-room-card ${escapeHtml(room.available)}">
      <button class="room-thumb" type="button" data-open-scan-room="${escapeHtml(room.id)}">
        ${room.image ? `<img src="${escapeHtml(room.image)}" alt="${escapeHtml(room.name)}" />` : escapeHtml(room.name)}
      </button>
      <div class="scan-room-content">
        <div class="scan-room-topline">
          <span>${escapeHtml(room.floor)} | ${escapeHtml(room.type)}</span>
          <strong>₹${room.price}</strong>
        </div>
        <h4>${escapeHtml(room.name)}</h4>
        <p>${escapeHtml(room.position)} room</p>
        <div class="scan-room-footer">
          <span class="scan-room-status">${available ? "Available now" : escapeHtml(room.available)}</span>
          <button class="secondary-button" type="button" data-open-scan-room="${escapeHtml(room.id)}">View room</button>
        </div>
      </div>
    </article>
  `;
}

function showRoom(room) {
  qs("#scanMediaBody").innerHTML = `
    <h3>${escapeHtml(room.name)}</h3>
    ${room.video ? `<video controls src="${escapeHtml(room.video)}"></video>` : room.image ? `<img src="${escapeHtml(room.image)}" alt="${escapeHtml(room.name)}" />` : ""}
    <p>${escapeHtml(room.floor)} | ${escapeHtml(room.position)} | ${escapeHtml(room.type)}</p>
    <strong>₹${room.price} | ${escapeHtml(room.available)}</strong>
  `;
  qs("#scanMediaModal").classList.remove("is-hidden");
}

function showPopup(forceReview = false) {
  if (forceReview) {
    qs("#scanPopupType").textContent = "Google Review";
    qs("#scanPopupTitle").textContent = "Rate your experience";
    qs("#scanPopupImage").innerHTML = "";
    qs("#scanPopupOffer").textContent = "One click opens Google review.";
    qs("#scanPopupAction").textContent = "Review on Google";
    qs("#scanPopupAction").href = safeUrl(state.hotel.googleReview) || "https://www.google.com/search?q=review";
    qs("#scanSmartPopup").classList.remove("is-hidden");
    return;
  }

  const popups = Array.isArray(state.popups) ? state.popups : [];
  if (!popups.length) return;
  const popup = popups[popupIndex % popups.length];
  popupIndex += 1;
  qs("#scanPopupType").textContent = popup.type;
  qs("#scanPopupTitle").textContent = popup.itemName;
  qs("#scanPopupImage").innerHTML = popup.image ? `<img src="${escapeHtml(popup.image)}" alt="${escapeHtml(popup.itemName)}" />` : escapeHtml(popup.itemName);
  qs("#scanPopupOffer").textContent = popup.offer;
  qs("#scanPopupAction").textContent = "Order on WhatsApp";
  qs("#scanPopupAction").href = `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(`Offer order\n${popup.itemName}\n${popup.offer}`)}`;
  qs("#scanSmartPopup").classList.remove("is-hidden");
}

function startPopupTimer() {
  setInterval(() => {
    popupElapsed += 30;
    if (popupElapsed >= 90) {
      showPopup(true);
      popupElapsed = 0;
    } else {
      showPopup();
    }
  }, 30000);
}

function boot() {
  if (!isValidQr()) {
    renderInvalid();
    return;
  }

  state.settings.scanCount = Number(state.settings.scanCount || 0) + 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}

  renderHeader();
  renderFilters();
  renderTabs();
  renderMenu();
  renderHotelInfo();
  startPopupTimer();

  qs("#scanSearch").addEventListener("input", (event) => {
    searchText = event.currentTarget.value;
    renderMenu();
  });

  qs("#scanCategory").addEventListener("change", (event) => {
    activeCategory = event.currentTarget.value;
    renderFilters();
    renderMenu();
  });

  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-scan-page]");
    if (tab && !tab.disabled) {
      setScanPage(tab.dataset.scanPage);
    }

    const categoryButton = event.target.closest("[data-scan-category]");
    if (categoryButton) {
      activeCategory = categoryButton.dataset.scanCategory;
      qs("#scanCategory").value = activeCategory;
      renderFilters();
      renderMenu();
    }

    const media = event.target.closest("[data-open-scan-media]");
    if (media) {
      const item = foodItems().find((food) => food.id === media.dataset.openScanMedia);
      if (item) showMedia(item);
    }

    const roomButton = event.target.closest("[data-open-scan-room]");
    if (roomButton) {
      const room = rooms().find((item) => item.id === roomButton.dataset.openScanRoom);
      if (room) showRoom(room);
    }

    if (event.target.closest("[data-close-scan-modal]")) qs("#scanMediaModal").classList.add("is-hidden");
    if (event.target.closest("[data-close-scan-popup]")) qs("#scanSmartPopup").classList.add("is-hidden");
  });
}

boot();
