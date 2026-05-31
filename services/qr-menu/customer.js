const STORAGE_KEY = "smartQrMenuSystemState";
const BOOKING_STORAGE_KEY = "smartTableBookingCustomerState";

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
let activeHotelFloorId = "";
let activeHotelRoomType = "all";
let activeHotelRoomId = "";
let activeHotelSearch = "";
let cart = {};
let activeBookingRoomId = "";

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

function workerAttendanceUrl() {
  return new URL("../attendance/worker.html", location.href).href;
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

function cartItems() {
  return foodItems()
    .map((item) => ({ ...item, qty: Number(cart[item.id] || 0) }))
    .filter((item) => item.qty > 0);
}

function cartTotal() {
  return cartItems().reduce((total, item) => total + (Number(item.price) || 0) * item.qty, 0);
}

function cartCount() {
  return cartItems().reduce((total, item) => total + item.qty, 0);
}

function renderBillPanel() {
  const panel = qs("#scanBillPanel");
  if (!panel) return;
  const items = cartItems();
  if (!items.length) {
    panel.innerHTML = "";
    panel.classList.add("is-hidden");
    return;
  }
  panel.classList.remove("is-hidden");
  panel.innerHTML = `
    <div>
      <span>${cartCount()} item${cartCount() === 1 ? "" : "s"} selected</span>
      <strong>Total ₹${cartTotal()}</strong>
    </div>
    <div class="scan-bill-actions">
      <button class="scan-view-button" type="button" data-download-ebill>Download e-bill</button>
      <a class="order-link" href="${escapeHtml(cartWhatsAppLink())}" target="_blank" rel="noreferrer">Send order</a>
    </div>
  `;
}

function cartWhatsAppLink() {
  const lines = [
    "Menu Order",
    `Hotel: ${state.hotel?.name || ""}`,
    ...cartItems().map((item) => `${item.name} x ${item.qty} = ₹${item.price * item.qty}`),
    `Total: ₹${cartTotal()}`
  ];
  return `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function downloadEbill() {
  const items = cartItems();
  if (!items.length) return;
  const lines = [
    "E-Bill",
    state.hotel?.name || "Restaurant",
    state.hotel?.address || "",
    `Date: ${new Date().toLocaleString("en-IN")}`,
    "",
    ...items.map((item) => `${item.name} | Qty ${item.qty} | ₹${item.price * item.qty}`),
    "",
    `Total: ₹${cartTotal()}`,
    "Thank you."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `e-bill-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
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

function bookingCustomerState() {
  try {
    const stored = JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || "{}");
    if (Array.isArray(stored.floors) && stored.floors.length) {
      return {
        floors: stored.floors,
        rooms: Array.isArray(stored.rooms) ? stored.rooms : [],
        floorPictures: stored.floorPictures && typeof stored.floorPictures === "object" ? stored.floorPictures : {},
        roomPictures: stored.roomPictures && typeof stored.roomPictures === "object" ? stored.roomPictures : {},
        roomStatus: stored.roomStatus && typeof stored.roomStatus === "object" ? stored.roomStatus : {},
        roomDayStatus: stored.roomDayStatus && typeof stored.roomDayStatus === "object" ? stored.roomDayStatus : {},
        roomBookings: Array.isArray(stored.roomBookings) ? stored.roomBookings : []
      };
    }
  } catch {
    // Fall back to QR hotel room data below.
  }

  const floorNames = Array.isArray(state.floors) && state.floors.length
    ? state.floors
    : [...new Set(rooms().map((room) => room.floor).filter(Boolean))];
  const floors = floorNames.map((name, index) => ({ id: `qr-floor-${index + 1}`, name }));
  const floorByName = new Map(floors.map((floor) => [floor.name, floor.id]));
  const mappedRooms = rooms().map((room, index) => ({
    id: room.id || `qr-room-${index + 1}`,
    floorId: floorByName.get(room.floor) || floors[0]?.id || "",
    name: room.name || `Room ${index + 1}`,
    type: room.type || "Room",
    price: room.price || 0,
    maxPeople: room.maxPeople || "",
    image: room.image || "",
    openTime: room.openTime || "",
    closeTime: room.closeTime || ""
  }));
  const roomPictures = mappedRooms.reduce((collection, room) => {
    if (room.image) collection[room.id] = [{ src: room.image, name: `${room.name} photo` }];
    return collection;
  }, {});
  return { floors, rooms: mappedRooms, floorPictures: {}, roomPictures, roomStatus: {}, roomDayStatus: {}, roomBookings: [] };
}

function saveBookingCustomerState(data) {
  try {
    const current = JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || "{}");
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({
      ...current,
      roomStatus: data.roomStatus || {},
      roomDayStatus: data.roomDayStatus || {},
      roomBookings: Array.isArray(data.roomBookings) ? data.roomBookings : []
    }));
  } catch {
    // Prototype storage can fail with large uploaded images; WhatsApp still opens for the booking request.
  }
}

function bookingFloorPhotos(data, floorId) {
  return Array.isArray(data.floorPictures?.[floorId]) ? data.floorPictures[floorId] : [];
}

function bookingRoomPhotos(data, roomId) {
  return Array.isArray(data.roomPictures?.[roomId]) ? data.roomPictures[roomId] : [];
}

function bookingRoomTypeOptions(data, floorId) {
  const types = [...new Set(data.rooms.filter((room) => room.floorId === floorId).map((room) => room.type).filter(Boolean))];
  return [{ id: "all", name: "All room types" }, ...types.map((type) => ({ id: type, name: type }))];
}

function bookingRoomsForSelection(data) {
  return data.rooms.filter((room) => room.floorId === activeHotelFloorId && (activeHotelRoomType === "all" || room.type === activeHotelRoomType));
}

function visibleBookingRooms(data) {
  const query = activeHotelSearch.trim().toLowerCase();
  return bookingRoomsForSelection(data).filter((room) => {
    if (!query) return true;
    const floor = data.floors.find((item) => item.id === room.floorId);
    return `${room.name} ${room.type} ${floor?.name || ""} ${room.price}`.toLowerCase().includes(query);
  });
}

function bookingRoomControl(data, roomId) {
  const control = data.roomStatus?.[roomId] || {};
  return {
    available: control.available !== false,
    note: control.note || ""
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateISO(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDayLabel(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function isDateInsideBooking(iso, booking) {
  const from = booking.fromDate || booking.date || "";
  const to = booking.toDate || booking.date || from;
  return iso >= from && iso <= to;
}

function bookingApproved(booking) {
  return booking.status === "approved" || booking.status === "booked";
}

function bookingForDate(data, roomId, day, status) {
  return (Array.isArray(data.roomBookings) ? data.roomBookings : []).find((booking) => {
    if (booking.roomId !== roomId || !isDateInsideBooking(day, booking)) return false;
    if (status === "approved") return bookingApproved(booking);
    if (status === "pending") return booking.status === "pending";
    return true;
  });
}

function roomBookingDayStatus(data, roomId, day) {
  const control = bookingRoomControl(data, roomId);
  const dayStatus = data.roomDayStatus?.[roomId] || {};
  if (!control.available || dayStatus[day] === "closed") return "closed";
  if (bookingForDate(data, roomId, day, "approved")) return "approved";
  if (bookingForDate(data, roomId, day, "pending")) return "pending";
  return "open";
}

function renderBookingCalendar(data, roomId) {
  const days = Array.from({ length: 28 }, (_, index) => dateISO(addDays(new Date(), index)));
  return `
    <div class="scan-room-calendar" aria-label="Room booking calendar">
      ${days.map((day) => {
        const status = roomBookingDayStatus(data, roomId, day);
        const label = status === "approved" ? "Booked" : status === "pending" ? "Pending" : status === "closed" ? "Not available" : "Open";
        return `<span class="is-${status}" title="${label} ${formatDayLabel(day)}">${formatDayLabel(day)}</span>`;
      }).join("")}
    </div>
  `;
}

function roomDateAvailable(data, roomId, day) {
  return roomBookingDayStatus(data, roomId, day) === "open";
}

function roomBookingWhatsApp(room, floor, booking) {
  const message = [
    "Room Booking Request",
    `Hotel: ${state.hotel?.name || ""}`,
    `Floor: ${floor?.name || ""}`,
    `Room: ${room.name}`,
    `Type: ${room.type}`,
    `From: ${booking.fromDate}`,
    `To: ${booking.toDate}`,
    `Name: ${booking.name}`,
    `Mobile: ${booking.mobile}`,
    `Status: Pending admin confirmation`,
    `Note: ${booking.note || "None"}`
  ].join("\n");
  return `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(message)}`;
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
  const qty = Number(cart[item.id] || 0);
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
        <div class="scan-qty-row">
          <button type="button" data-cart-minus="${escapeHtml(item.id)}">-</button>
          <strong>${qty}</strong>
          <button type="button" data-cart-plus="${escapeHtml(item.id)}">+</button>
          <span>₹${qty * Number(item.price || 0)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderOptions(items, selectedValue, labelGetter) {
  return items.map((item) => {
    const value = item.id || item;
    const label = labelGetter ? labelGetter(item) : item.name || item;
    return `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function keepBookingCustomerSelection(data) {
  if (!data.floors.some((floor) => floor.id === activeHotelFloorId)) {
    activeHotelFloorId = data.floors[0]?.id || "";
  }
  const roomTypes = bookingRoomTypeOptions(data, activeHotelFloorId).map((item) => item.id);
  if (!roomTypes.includes(activeHotelRoomType)) {
    activeHotelRoomType = "all";
  }
  const roomsForSelection = bookingRoomsForSelection(data);
  if (!roomsForSelection.some((room) => room.id === activeHotelRoomId)) {
    activeHotelRoomId = roomsForSelection[0]?.id || "";
  }
}

function renderScanBookingRoomCard(data, room) {
  const floor = data.floors.find((item) => item.id === room.floorId);
  const photos = bookingRoomPhotos(data, room.id);
  const firstPhoto = photos[0];
  const control = bookingRoomControl(data, room.id);
  const disabled = control.available ? "" : "disabled";
  return `
    <article class="scan-booking-room-card" data-scan-booking-room-card="${escapeHtml(room.id)}">
      <button class="scan-booking-room-photo" type="button" data-view-booking-room="${escapeHtml(room.id)}" data-booking-photo-index="0" ${firstPhoto ? "" : "disabled"}>
        ${firstPhoto ? `<img src="${escapeHtml(firstPhoto.src)}" alt="${escapeHtml(room.name)} room photo" />` : `<span>No photo yet</span>`}
      </button>
      <div class="scan-booking-room-body">
        <div class="scan-booking-room-title">
          <div>
            <span>${escapeHtml(floor?.name || "Floor")} | ${escapeHtml(room.type)}</span>
            <h4>${escapeHtml(room.name)}</h4>
          </div>
          <strong>₹${room.price || 0}</strong>
        </div>
        <div class="scan-room-status-line">
          <span class="${control.available ? "is-open" : "is-closed"}">${control.available ? "Available" : "Not available"}</span>
          ${control.note ? `<em>${escapeHtml(control.note)}</em>` : ""}
        </div>
        <div class="scan-room-more-row">
          <button class="scan-view-button" type="button" data-view-booking-room="${escapeHtml(room.id)}" data-booking-photo-index="0" ${firstPhoto ? "" : "disabled"}>View images</button>
          <span>${photos.length} photo${photos.length === 1 ? "" : "s"}</span>
        </div>
        <button class="order-link" type="button" data-open-room-booking="${escapeHtml(room.id)}" ${disabled}>Book now</button>
      </div>
    </article>
  `;
}

function openRoomBookingModal(roomId) {
  const data = bookingCustomerState();
  const room = data.rooms.find((item) => item.id === roomId);
  if (!room) return;
  activeBookingRoomId = roomId;
  const floor = data.floors.find((item) => item.id === room.floorId);
  const days = Array.from({ length: 183 }, (_, index) => dateISO(addDays(new Date(), index)));
  qs("#scanRoomBookingBody").innerHTML = `
    <div class="room-booking-modal-heading">
      <span class="scan-section-kicker">${escapeHtml(floor?.name || "Floor")} | ${escapeHtml(room.type)}</span>
      <h3>${escapeHtml(room.name)}</h3>
      <p>Fill your name and mobile first. Yellow dates are waiting for admin approval, green dates need the security code.</p>
    </div>
    <div class="room-booking-fields">
      <input id="roomBookingName" placeholder="Your name" />
      <input id="roomBookingMobile" placeholder="Mobile number" inputmode="tel" />
      <input id="roomBookingNote" placeholder="Request optional" />
    </div>
    <div class="room-booking-status-note">
      <span class="open">Open</span>
      <span class="pending">Pending</span>
      <span class="approved">Booked</span>
      <span class="closed">Closed</span>
    </div>
    <div class="room-booking-calendar">
      ${days.map((day) => {
        const status = roomBookingDayStatus(data, roomId, day);
        const isOpen = status === "open";
        const isApproved = status === "approved";
        const actionAttr = isOpen ? `data-book-room-date="${day}"` : isApproved ? `data-check-booked-date="${day}"` : "";
        const disabled = status === "pending" || status === "closed" ? "disabled" : "";
        const label = status === "approved" ? "Booked" : status === "pending" ? "Pending" : status === "closed" ? "Closed" : "Request";
        return `
          <button type="button" class="is-${status}" ${actionAttr} ${disabled}>
            <strong>${formatDayLabel(day)}</strong>
            <span>${label}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
  qs("#scanRoomBookingModal").classList.remove("is-hidden");
}

function submitRoomDateBooking(day) {
  const data = bookingCustomerState();
  const room = data.rooms.find((item) => item.id === activeBookingRoomId);
  const floor = data.floors.find((item) => item.id === room?.floorId);
  if (!room || !roomDateAvailable(data, room.id, day)) return;
  const name = qs("#roomBookingName")?.value.trim() || "";
  const mobile = qs("#roomBookingMobile")?.value.trim() || "";
  if (!name || !mobile) {
    alert("Please fill your name and mobile number before selecting a date.");
    return;
  }
  const booking = {
    id: `room-booking-${Date.now()}`,
    roomId: room.id,
    roomName: room.name,
    name,
    mobile,
    fromDate: day,
    toDate: day,
    note: qs("#roomBookingNote")?.value.trim() || "",
    status: "pending",
    securityCode: "",
    createdAt: new Date().toISOString()
  };
  data.roomBookings = Array.isArray(data.roomBookings) ? data.roomBookings : [];
  data.roomBookings.push(booking);
  saveBookingCustomerState(data);
  window.open(roomBookingWhatsApp(room, floor, booking), "_blank", "noopener,noreferrer");
  qs("#scanRoomBookingModal").classList.add("is-hidden");
  renderBookingCustomerView();
}

function verifyApprovedRoomBooking(day) {
  const data = bookingCustomerState();
  const booking = bookingForDate(data, activeBookingRoomId, day, "approved");
  if (!booking) return;
  const code = prompt("Enter the booking security code from admin.");
  if (!code) return;
  if (String(booking.securityCode || "").trim() !== code.trim()) {
    alert("Invalid security code. Please check the code shared by admin.");
    return;
  }
  alert(`Booking confirmed\nName: ${booking.name}\nMobile: ${booking.mobile}\nRoom: ${booking.roomName}\nDate: ${booking.fromDate || booking.date}`);
}

function renderBookingCustomerView() {
  const container = qs("#scanBookingCustomerView");
  if (!container) return;

  const data = bookingCustomerState();
  if (!hotelActive()) {
    container.innerHTML = "";
    return;
  }
  keepBookingCustomerSelection(data);

  const selectedFloor = data.floors.find((floor) => floor.id === activeHotelFloorId);
  const floorPhotos = bookingFloorPhotos(data, activeHotelFloorId);
  const firstFloorPhoto = floorPhotos[0];
  const visibleRooms = visibleBookingRooms(data);

  container.innerHTML = `
    <article class="hotel-info-card scan-booking-card">
      <div class="scan-booking-heading">
        <div>
          <span class="scan-section-kicker">Hotel View</span>
          <h3>Explore floors and rooms</h3>
          <p>Select a floor, search a room, view photos and send a booking request to admin on WhatsApp.</p>
        </div>
      </div>
      <div class="scan-booking-controls">
        <select id="scanBookingFloor" aria-label="Select floor">${renderOptions(data.floors, activeHotelFloorId)}</select>
        <select id="scanBookingRoomType" aria-label="Select room type">${renderOptions(bookingRoomTypeOptions(data, activeHotelFloorId), activeHotelRoomType)}</select>
        <select id="scanBookingRoom" aria-label="Select room">${renderOptions(bookingRoomsForSelection(data), activeHotelRoomId, (room) => `${room.name} (${room.type})`)}</select>
        <input id="scanBookingSearch" type="search" placeholder="Search room, floor, AC, VIP" value="${escapeHtml(activeHotelSearch)}" />
      </div>
      <div class="scan-booking-floor-feature">
        <button class="scan-booking-floor-photo" type="button" data-view-booking-floor="${escapeHtml(activeHotelFloorId)}" data-booking-photo-index="0" ${firstFloorPhoto ? "" : "disabled"}>
          ${firstFloorPhoto ? `<img src="${escapeHtml(firstFloorPhoto.src)}" alt="${escapeHtml(selectedFloor?.name || "Floor")} main photo" />` : `<span>Floor photo will appear here</span>`}
        </button>
        <div>
          <span class="scan-section-kicker">${escapeHtml(selectedFloor?.name || "Floor")}</span>
          <h4>Floor overview</h4>
          <p>${floorPhotos.length ? "First floor photo is visible immediately. Tap it to open fullscreen." : "Admin can upload floor photos from Booking."}</p>
        </div>
      </div>
      <section class="scan-booking-gallery">
        <div class="scan-booking-gallery-heading">
          <strong>Rooms ready for customer view</strong>
          <span>${visibleRooms.length} room${visibleRooms.length === 1 ? "" : "s"}</span>
        </div>
        <div class="scan-booking-room-grid">
          ${visibleRooms.map((room) => renderScanBookingRoomCard(data, room)).join("") || `<div class="scan-booking-empty">No room found for this search.</div>`}
        </div>
      </section>
      ${floorPhotos.length > 1 ? `
        <section class="scan-booking-gallery">
          <div class="scan-booking-gallery-heading">
            <strong>More floor photos</strong>
            <span>${floorPhotos.length} photos</span>
          </div>
          <div class="scan-booking-strip">
            ${floorPhotos.map((photo, index) => `
              <button class="scan-booking-thumb" type="button" data-view-booking-floor="${escapeHtml(activeHotelFloorId)}" data-booking-photo-index="${index}">
                <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(selectedFloor?.name || "Floor")} photo ${index + 1}" />
                <span>Floor pic ${index + 1}</span>
              </button>
            `).join("")}
          </div>
        </section>
      ` : ""}
    </article>
  `;
}

function renderMenu() {
  if (!restaurantActive()) {
    qs("#scanTools").classList.add("is-hidden");
    qs("#scanCategoryRail").classList.add("is-hidden");
    qs("#scanBillPanel")?.classList.add("is-hidden");
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
  renderBillPanel();
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
  qs("#scanMediaModal .qr-modal-card").classList.toggle("is-video-card", Boolean(item.video));
  qs("#scanMediaBody").innerHTML = `
    <h3>${escapeHtml(item.name)}</h3>
    ${item.video ? `<video controls autoplay playsinline src="${escapeHtml(item.video)}"></video>` : `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />`}
    <p>${escapeHtml(item.description || item.category)}</p>
  `;
  qs("#scanMediaModal").classList.remove("is-hidden");
}

function showImage(title, image) {
  if (!image) return;
  qs("#scanMediaModal .qr-modal-card").classList.remove("is-video-card");
  qs("#scanMediaBody").innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />
  `;
  qs("#scanMediaModal").classList.remove("is-hidden");
}

function closeMediaModal() {
  const modal = qs("#scanMediaModal");
  modal.querySelectorAll("video").forEach((video) => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  });
  qs("#scanMediaBody").innerHTML = "";
  modal.classList.add("is-hidden");
  modal.querySelector(".qr-modal-card")?.classList.remove("is-video-card");
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

function footerTile(href, icon, label) {
  if (!href) return "";
  const target = href.startsWith("tel:") ? "_self" : "_blank";
  return `
    <a class="scan-footer-link" href="${escapeHtml(href)}" target="${target}" rel="noreferrer">
      <span>${escapeHtml(icon)}</span>
      <strong>${escapeHtml(label)}</strong>
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
    <div class="scan-footer-panel">
      <span class="scan-section-kicker">Quick links</span>
      <div class="scan-footer-links">
        ${footerTile(workerAttendanceUrl(), "AT", "Attendance")}
        ${footerTile(locationHref, "LO", "Location")}
        ${footerTile(instagramHref, "IG", "Instagram")}
        ${footerTile(facebookHref, "FB", "Facebook")}
        ${footerTile(phoneHref, "PH", hotel.contact || "Call admin")}
      </div>
    </div>
  `;

  qs("#scanHotelGallery").innerHTML = "";

  if (!hotelActive()) {
    qs("#scanRoomSummary").innerHTML = "";
    qs("#scanRoomList").innerHTML = "";
    return;
  }

  qs("#scanRoomSummary").innerHTML = "";
  qs("#scanRoomList").innerHTML = "";
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
  qs("#scanMediaModal .qr-modal-card").classList.toggle("is-video-card", Boolean(room.video));
  qs("#scanMediaBody").innerHTML = `
    <h3>${escapeHtml(room.name)}</h3>
    ${room.video ? `<video controls autoplay playsinline src="${escapeHtml(room.video)}"></video>` : room.image ? `<img src="${escapeHtml(room.image)}" alt="${escapeHtml(room.name)}" />` : ""}
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
  renderBookingCustomerView();
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

  document.addEventListener("change", (event) => {
    if (event.target.matches("#scanBookingFloor")) {
      activeHotelFloorId = event.target.value;
      activeHotelRoomType = "all";
      activeHotelRoomId = "";
      renderBookingCustomerView();
    }

    if (event.target.matches("#scanBookingRoomType")) {
      activeHotelRoomType = event.target.value;
      activeHotelRoomId = "";
      renderBookingCustomerView();
    }

    if (event.target.matches("#scanBookingRoom")) {
      activeHotelRoomId = event.target.value;
      renderBookingCustomerView();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#scanBookingSearch")) {
      activeHotelSearch = event.target.value;
      renderBookingCustomerView();
      requestAnimationFrame(() => {
        const input = qs("#scanBookingSearch");
        if (!input) return;
        input.focus();
        input.setSelectionRange(activeHotelSearch.length, activeHotelSearch.length);
      });
    }
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

    const cartPlus = event.target.closest("[data-cart-plus]");
    if (cartPlus) {
      const id = cartPlus.dataset.cartPlus;
      cart[id] = Number(cart[id] || 0) + 1;
      renderBillPanel();
      renderMenu();
      return;
    }

    const cartMinus = event.target.closest("[data-cart-minus]");
    if (cartMinus) {
      const id = cartMinus.dataset.cartMinus;
      cart[id] = Math.max(0, Number(cart[id] || 0) - 1);
      if (!cart[id]) delete cart[id];
      renderBillPanel();
      renderMenu();
      return;
    }

    if (event.target.closest("[data-download-ebill]")) {
      downloadEbill();
      return;
    }

    const roomButton = event.target.closest("[data-open-scan-room]");
    if (roomButton) {
      const room = rooms().find((item) => item.id === roomButton.dataset.openScanRoom);
      if (room) showRoom(room);
    }

    const floorPhoto = event.target.closest("[data-view-booking-floor]");
    if (floorPhoto) {
      const data = bookingCustomerState();
      const floor = data.floors.find((item) => item.id === floorPhoto.dataset.viewBookingFloor);
      const photo = bookingFloorPhotos(data, floorPhoto.dataset.viewBookingFloor)[Number(floorPhoto.dataset.bookingPhotoIndex)];
      showImage(`${floor?.name || "Floor"} photo ${Number(floorPhoto.dataset.bookingPhotoIndex) + 1}`, photo?.src);
    }

    const roomPhoto = event.target.closest("[data-view-booking-room]");
    if (roomPhoto) {
      const data = bookingCustomerState();
      const room = data.rooms.find((item) => item.id === roomPhoto.dataset.viewBookingRoom);
      const photo = bookingRoomPhotos(data, roomPhoto.dataset.viewBookingRoom)[Number(roomPhoto.dataset.bookingPhotoIndex)];
      showImage(`${room?.name || "Room"} photo ${Number(roomPhoto.dataset.bookingPhotoIndex) + 1}`, photo?.src);
    }

    const openBooking = event.target.closest("[data-open-room-booking]");
    if (openBooking) {
      openRoomBookingModal(openBooking.dataset.openRoomBooking);
      return;
    }

    const dateButton = event.target.closest("[data-book-room-date]");
    if (dateButton) {
      submitRoomDateBooking(dateButton.dataset.bookRoomDate);
      return;
    }

    const bookedDateButton = event.target.closest("[data-check-booked-date]");
    if (bookedDateButton) {
      verifyApprovedRoomBooking(bookedDateButton.dataset.checkBookedDate);
      return;
    }

    const bookRoomButton = event.target.closest("[data-book-scan-room]");
    if (bookRoomButton) {
      const data = bookingCustomerState();
      const room = data.rooms.find((item) => item.id === bookRoomButton.dataset.bookScanRoom);
      const floor = data.floors.find((item) => item.id === room?.floorId);
      const card = bookRoomButton.closest("[data-scan-booking-room-card]");
      if (!room || !card) return;
      const booking = {
        id: `room-booking-${Date.now()}`,
        roomId: room.id,
        roomName: room.name,
        name: card.querySelector("[data-room-booking-name]")?.value.trim(),
        mobile: card.querySelector("[data-room-booking-mobile]")?.value.trim(),
        fromDate: card.querySelector("[data-room-booking-from]")?.value,
        toDate: card.querySelector("[data-room-booking-to]")?.value,
        note: card.querySelector("[data-room-booking-note]")?.value.trim(),
        status: "pending",
        securityCode: "",
        createdAt: new Date().toISOString()
      };
      if (!booking.name || !booking.mobile || !booking.fromDate || !booking.toDate) {
        alert("Please fill name, mobile, from date and to date.");
        return;
      }
      if (booking.toDate < booking.fromDate) {
        alert("To date must be after from date.");
        return;
      }
      data.roomBookings = Array.isArray(data.roomBookings) ? data.roomBookings : [];
      data.roomBookings.push(booking);
      saveBookingCustomerState(data);
      window.open(roomBookingWhatsApp(room, floor, booking), "_blank", "noopener,noreferrer");
      renderBookingCustomerView();
    }

    if (event.target.closest("[data-close-scan-modal]")) closeMediaModal();
    if (event.target.closest("[data-close-room-booking]")) qs("#scanRoomBookingModal").classList.add("is-hidden");
    if (event.target.closest("[data-close-scan-popup]")) qs("#scanSmartPopup").classList.add("is-hidden");
  });
}

boot();
