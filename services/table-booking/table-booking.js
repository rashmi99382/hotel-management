window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.booking = (() => {
  const PUBLIC_BOOKING_KEY = "smartTableBookingCustomerState";
  const todayISO = new Date().toISOString().slice(0, 10);
  const adminWhatsAppNumber = "919999999999";
  const timeSlots = ["18:00-20:00", "20:00-22:00", "12:00-14:00", "14:00-16:00"];
  const maxFloorPhotos = 5;
  const maxRoomPhotos = 5;

  let root = null;
  let layoutDrag = null;
  let selectedMapElementId = null;

  let floors = [
    { id: "floor-1", name: "1st Floor" },
    { id: "floor-2", name: "2nd Floor" }
  ];

  let rooms = [
    { id: "room-ac", floorId: "floor-1", name: "AC Room", type: "AC", price: 1000, maxPeople: 24, image: "", openTime: "18:00", closeTime: "22:00" },
    { id: "room-vip", floorId: "floor-1", name: "VIP Room", type: "VIP", price: 1800, maxPeople: 16, image: "", openTime: "18:00", closeTime: "22:00" },
    { id: "room-family", floorId: "floor-2", name: "Family Room", type: "Family", price: 1200, maxPeople: 30, image: "", openTime: "12:00", closeTime: "22:00" },
    { id: "room-nonac", floorId: "floor-2", name: "Non-AC Room", type: "Non-AC", price: 600, maxPeople: 20, image: "", openTime: "12:00", closeTime: "22:00" }
  ];

  let tableLayouts = [
  ];

  let floorPictures = {};
  let roomPictures = {};
  let roomStatus = {};
  let roomDayStatus = {};
  let roomBookings = [];
  let roomLayoutElements = [];
  let roomStructureImages = {};
  let pendingPoint = null;
  let pendingFloorPictureId = null;
  let pendingRoomPictureId = null;
  let lightbox = null;
  let adminCalendarModal = null;
  let adminCanvasClickTimer = null;
  let roomConfirmationOpen = false;
  let expandedRoomBookingId = "";

  let tablePricing = [
  ];

  let bookings = [
  ];

  let selection = {
    floorId: "floor-1",
    roomId: "room-ac",
    tableId: null,
    date: todayISO,
    slot: "18:00-20:00",
    roomType: "all",
    adminFloorId: "floor-1",
    adminRoomId: "room-ac",
    mediaMode: "floor",
    mediaFloorId: "floor-1",
    mediaRoomType: "all",
    mediaRoomId: "room-ac",
    customerSearch: "",
    expandedCustomerFloorId: "",
    expandedCustomerRoomId: ""
  };

  restoreCustomerSnapshot();

  function qs(selector) {
    return root?.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(root?.querySelectorAll(selector) || []);
  }

  function escapeBookingHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function uniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  }

  function restoreCustomerSnapshot() {
    try {
      const stored = JSON.parse(localStorage.getItem(PUBLIC_BOOKING_KEY) || "{}");
      if (Array.isArray(stored.floors) && stored.floors.length) {
        floors = stored.floors;
      }
      if (Array.isArray(stored.rooms) && stored.rooms.length) {
        rooms = stored.rooms;
      }
      if (stored.floorPictures && typeof stored.floorPictures === "object") {
        floorPictures = stored.floorPictures;
      }
      if (stored.roomPictures && typeof stored.roomPictures === "object") {
        roomPictures = stored.roomPictures;
      }
      if (stored.roomStatus && typeof stored.roomStatus === "object") {
        roomStatus = stored.roomStatus;
      }
      if (stored.roomDayStatus && typeof stored.roomDayStatus === "object") {
        roomDayStatus = stored.roomDayStatus;
      }
      if (Array.isArray(stored.roomBookings)) {
        roomBookings = stored.roomBookings;
      }
      pruneRoomBookings();
    } catch {
      // Keep the built-in demo data if shared customer media is unavailable.
    }
  }

  function publishCustomerSnapshot() {
    try {
      const stored = JSON.parse(localStorage.getItem(PUBLIC_BOOKING_KEY) || "{}");
      if (Array.isArray(stored.roomBookings) && stored.roomBookings.length) {
        const merged = new Map();
        [...stored.roomBookings, ...roomBookings].forEach((booking) => merged.set(booking.id, booking));
        roomBookings = Array.from(merged.values());
      }
      pruneRoomBookings();
      localStorage.setItem(PUBLIC_BOOKING_KEY, JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        floors,
        rooms,
        floorPictures,
        roomPictures,
        roomStatus,
        roomDayStatus,
        roomBookings
      }));
    } catch {
      // Large local images may exceed storage; the live admin view still keeps them for this session.
    }
  }

  function firstRoomForFloor(floorId) {
    return rooms.find((room) => room.floorId === floorId)?.id || rooms[0]?.id || "";
  }

  function floorPhotos(floorId) {
    return floorPictures[floorId] || [];
  }

  function roomPhotos(roomId) {
    return roomPictures[roomId] || [];
  }

  function roomControl(roomId) {
    if (!roomStatus[roomId]) {
      roomStatus[roomId] = { available: true, note: "" };
    }
    return roomStatus[roomId];
  }

  function bookingTime(booking) {
    const stamp = booking?.createdAt || booking?.confirmedAt || booking?.requestedAt || booking?.fromDate || booking?.date || "";
    const parsed = Date.parse(stamp);
    if (!Number.isNaN(parsed)) return parsed;
    const idTime = String(booking?.id || "").match(/\d{10,}/)?.[0];
    return idTime ? Number(idTime) : 0;
  }

  function pruneRoomBookings() {
    roomBookings = roomBookings
      .slice()
      .sort((a, b) => bookingTime(b) - bookingTime(a))
      .slice(0, 30);
  }

  function roomBookingItems(roomId) {
    return roomBookings
      .filter((booking) => booking.roomId === roomId)
      .sort((a, b) => bookingTime(b) - bookingTime(a))
      .slice(0, 30);
  }

  function pendingRoomBookings() {
    return roomBookings
      .filter((booking) => booking.status === "pending")
      .sort((a, b) => bookingTime(b) - bookingTime(a))
      .slice(0, 30);
  }

  function confirmRoomBooking(bookingId, code) {
    const booking = roomBookings.find((item) => item.id === bookingId);
    const securityCode = String(code || "").trim();
    if (!booking) return false;
    if (!securityCode) {
      alert("Write a security code before confirming this booking.");
      return false;
    }
    booking.status = "approved";
    booking.securityCode = securityCode;
    booking.confirmedAt = new Date().toISOString();
    return true;
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

  function bookingForDate(roomId, day, status) {
    return roomBookings.find((booking) => {
      if (booking.roomId !== roomId || !isDateInsideBooking(day, booking)) return false;
      if (status === "approved") return bookingApproved(booking);
      if (status === "pending") return booking.status === "pending";
      return true;
    });
  }

  function roomBookingDayStatus(roomId, day) {
    if (roomDayControl(roomId, day) === "closed") return "closed";
    if (bookingForDate(roomId, day, "approved")) return "approved";
    if (bookingForDate(roomId, day, "pending")) return "pending";
    return "open";
  }

  function renderRoomCalendar(roomId) {
    const days = Array.from({ length: 28 }, (_, index) => dateISO(addDays(new Date(), index)));
    return `
      <div class="room-calendar" aria-label="Room booking calendar">
        ${days.map((day) => {
          const status = roomBookingDayStatus(roomId, day);
          const label = status === "approved" ? "Booked" : status === "pending" ? "Pending" : status === "closed" ? "Closed" : "Open";
          return `<span class="is-${status}" title="${label} ${formatDayLabel(day)}">${formatDayLabel(day)}</span>`;
        }).join("")}
      </div>
    `;
  }

  function roomDayControl(roomId, day) {
    if (!roomDayStatus[roomId]) roomDayStatus[roomId] = {};
    return roomDayStatus[roomId][day] || "open";
  }

  function roomTypeOptions(floorId) {
    const types = Array.from(new Set(rooms.filter((room) => room.floorId === floorId).map((room) => room.type)));
    return [{ id: "all", name: "All room types" }, ...types.map((type) => ({ id: type, name: type }))];
  }

  function customerRoomsForSelection() {
    return rooms.filter((room) => room.floorId === selection.floorId && (selection.roomType === "all" || room.type === selection.roomType));
  }

  function customerVisibleRooms() {
    const query = selection.customerSearch.trim().toLowerCase();
    return customerRoomsForSelection().filter((room) => {
      if (!query) return true;
      const text = `${room.name} ${room.type} ${floorName(room.floorId)} ${room.price} ${room.maxPeople}`.toLowerCase();
      return text.includes(query);
    });
  }

  function mediaRoomsForSelection() {
    return rooms.filter((room) => room.floorId === selection.mediaFloorId && (selection.mediaRoomType === "all" || room.type === selection.mediaRoomType));
  }

  function roomLabel(room) {
    return `${room.name} (${room.type})`;
  }

  function tableLabel(table) {
    const room = rooms.find((item) => item.id === table.roomId);
    return `${room?.name || "Room"} / ${table.name} - ${table.capacity} seats`;
  }

  function shapeLabel(shape) {
    return {
      round: "Round",
      square: "Square",
      rectangle: "Rectangle",
      banquet: "Long banquet"
    }[shape] || "Round";
  }

  function bookingMap() {
    return window.smartHotelBookingMap || null;
  }

  function layoutElementTypeLabel(type) {
    return bookingMap()?.typeLabel(type) || type;
  }

  function floorName(floorId) {
    return floors.find((floor) => floor.id === floorId)?.name || "Floor";
  }

  function timeToMinutes(value) {
    const [hour, minute] = String(value).split(":").map(Number);
    return hour * 60 + minute;
  }

  function availableSlotsForRoom(roomId) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return timeSlots;
    const open = timeToMinutes(room.openTime);
    const close = timeToMinutes(room.closeTime);
    return timeSlots.filter((slot) => {
      const [start, end] = String(slot).split("-");
      return timeToMinutes(start) >= open && timeToMinutes(end) <= close;
    });
  }

  function formatSlot(slot) {
    const [start, end] = String(slot).split("-");
    return `${formatTime(start)}–${formatTime(end)}`;
  }

  function formatTime(value) {
    const [hourRaw, minute] = String(value).split(":");
    const hour = Number(hourRaw);
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalized = hour % 12 || 12;
    return minute === "00" ? `${normalized}${suffix}` : `${normalized}:${minute}${suffix}`;
  }

  function keepValidSelection() {
    if (!floors.some((floor) => floor.id === selection.floorId)) {
      selection.floorId = floors[0]?.id || "";
    }
    if (!floors.some((floor) => floor.id === selection.adminFloorId)) {
      selection.adminFloorId = selection.floorId;
    }
    if (!floors.some((floor) => floor.id === selection.mediaFloorId)) {
      selection.mediaFloorId = selection.floorId;
    }
    if (!rooms.some((room) => room.id === selection.roomId && room.floorId === selection.floorId)) {
      selection.roomId = firstRoomForFloor(selection.floorId);
    }
    if (!rooms.some((room) => room.id === selection.adminRoomId && room.floorId === selection.adminFloorId)) {
      selection.adminRoomId = firstRoomForFloor(selection.adminFloorId);
    }
    const availableRoomTypes = roomTypeOptions(selection.floorId).map((item) => item.id);
    if (!availableRoomTypes.includes(selection.roomType)) {
      selection.roomType = "all";
    }
    const customerRooms = customerRoomsForSelection();
    if (!customerRooms.some((room) => room.id === selection.roomId)) {
      selection.roomId = customerRooms[0]?.id || firstRoomForFloor(selection.floorId);
    }
    const availableMediaRoomTypes = roomTypeOptions(selection.mediaFloorId).map((item) => item.id);
    if (!availableMediaRoomTypes.includes(selection.mediaRoomType)) {
      selection.mediaRoomType = "all";
    }
    const mediaRooms = mediaRoomsForSelection();
    if (!mediaRooms.some((room) => room.id === selection.mediaRoomId)) {
      selection.mediaRoomId = mediaRooms[0]?.id || firstRoomForFloor(selection.mediaFloorId);
    }
    const validSlots = availableSlotsForRoom(selection.roomId);
    if (!validSlots.includes(selection.slot)) {
      selection.slot = validSlots[0] || timeSlots[0];
    }
  }

  function populateSelect(select, items, value, getLabel) {
    if (!select) return;
    select.innerHTML = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id || item;
      option.textContent = getLabel ? getLabel(item) : item.name || item;
      select.append(option);
    });
    select.value = value;
  }

  function selectOptions(items, value, getLabel) {
    return items.map((item) => {
      const optionValue = item.id || item;
      const label = getLabel ? getLabel(item) : item.name || item;
      return `<option value="${escapeBookingHtml(optionValue)}" ${optionValue === value ? "selected" : ""}>${escapeBookingHtml(label)}</option>`;
    }).join("");
  }

  function populateBookingSelects() {
    populateSelect(qs("#customerFloor"), floors, selection.floorId);
    populateSelect(qs("#customerRoomType"), roomTypeOptions(selection.floorId), selection.roomType);
    populateSelect(qs("#customerRoom"), customerRoomsForSelection(), selection.roomId, roomLabel);
    populateSelect(qs("#adminLayoutFloor"), floors, selection.adminFloorId);
    populateSelect(qs("#adminLayoutRoom"), rooms.filter((room) => room.floorId === selection.adminFloorId), selection.adminRoomId, roomLabel);
    populateSelect(qs("#roomForm select[name='floorId']"), floors, selection.adminFloorId);
    populateSelect(qs("#pricingForm select[name='tableId']"), tableLayouts, tableLayouts[0]?.id || "", tableLabel);
    populateSelect(qs("#pricingForm select[name='slot']"), timeSlots, selection.slot, formatSlot);
    populateSelect(qs("#customerSlot"), availableSlotsForRoom(selection.roomId), selection.slot, formatSlot);

    const dateInput = qs("#customerDate");
    if (dateInput) dateInput.value = selection.date;
    const searchInput = qs("#customerRoomSearch");
    if (searchInput) searchInput.value = selection.customerSearch;
  }

  function renderFloorRoomList() {
    const list = qs("#floorRoomList");
    if (!list) return;

    list.innerHTML = `
      <section class="admin-media-board">
        <div class="media-board-heading">
          <div>
            <span>Floor Photos</span>
            <h3>Upload floor pictures directly</h3>
          </div>
          <strong>${floors.length} floor${floors.length === 1 ? "" : "s"}</strong>
        </div>
        <div class="floor-media-grid">
          ${floors.map((floor) => {
            const photos = floorPhotos(floor.id);
            const firstPhoto = photos[0];
            return `
              <article class="admin-photo-card">
                <div class="admin-photo-card-head">
                  <div>
                    <h3>${escapeBookingHtml(floor.name)}</h3>
                    <span>${photos.length}/${maxFloorPhotos} floor photos</span>
                  </div>
                  <div class="admin-photo-actions">
                    <button class="tiny-button" type="button" data-upload-floor-picture="${floor.id}" ${photos.length >= maxFloorPhotos ? "disabled" : ""}>Upload</button>
                    <button class="tiny-button" type="button" data-view-floor-picture="${floor.id}" data-floor-picture-index="0" ${firstPhoto ? "" : "disabled"}>View img</button>
                    <button class="tiny-button reject" type="button" data-delete-floor="${floor.id}">×</button>
                  </div>
                </div>
                <button class="admin-photo-preview" type="button" data-view-floor-picture="${floor.id}" data-floor-picture-index="0" ${firstPhoto ? "" : "disabled"}>
                  ${firstPhoto ? `<img src="${firstPhoto.src}" alt="${escapeBookingHtml(floor.name)} floor photo" />` : `<span>Add ${escapeBookingHtml(floor.name)} photo</span>`}
                </button>
                <div class="room-picture-strip">
                  ${photos.map((photo, index) => `
                    <div class="room-picture-thumb-wrap">
                      <button class="room-picture-thumb" type="button" data-view-floor-picture="${floor.id}" data-floor-picture-index="${index}">
                        <img src="${photo.src}" alt="${escapeBookingHtml(floor.name)} photo ${index + 1}" />
                        <span>Floor pic ${index + 1}</span>
                      </button>
                      <button class="room-picture-delete" type="button" data-delete-floor-picture="${floor.id}" data-floor-picture-index="${index}" aria-label="Delete floor photo ${index + 1}">×</button>
                    </div>
                  `).join("") || `<div class="room-picture-empty">No floor photo yet</div>`}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>

      <section class="admin-media-board">
        <div class="media-board-heading">
          <div>
            <span>Room Photos & Booking Control</span>
            <h3>Add room pictures beside each room</h3>
          </div>
          <strong>${rooms.length} room${rooms.length === 1 ? "" : "s"}</strong>
        </div>
        <div class="admin-room-photo-grid">
          ${rooms.map((room) => {
            const photos = roomPhotos(room.id);
            const firstPhoto = photos[0];
            const control = roomControl(room.id);
            const floor = floors.find((item) => item.id === room.floorId);
            const bookingsForRoom = roomBookingItems(room.id);
            return `
              <article class="admin-photo-card room-control-card">
                <div class="admin-photo-card-head">
                  <div>
                    <h3>${escapeBookingHtml(room.name)}</h3>
                    <span>${escapeBookingHtml(floor?.name || "Floor")} | ${escapeBookingHtml(room.type)} | ₹${room.price}</span>
                  </div>
                  <div class="admin-photo-actions">
                    <button class="tiny-button" type="button" data-upload-room-picture="${room.id}" ${photos.length >= maxRoomPhotos ? "disabled" : ""}>Upload</button>
                    <button class="tiny-button" type="button" data-view-room-picture="${room.id}" data-room-picture-index="0" ${firstPhoto ? "" : "disabled"}>View img</button>
                    <button class="tiny-button" type="button" data-open-admin-room-calendar="${room.id}">Calendar</button>
                    <button class="tiny-button reject" type="button" data-delete-room="${room.id}">×</button>
                  </div>
                </div>
                <button class="admin-photo-preview" type="button" data-view-room-picture="${room.id}" data-room-picture-index="0" ${firstPhoto ? "" : "disabled"}>
                  ${firstPhoto ? `<img src="${firstPhoto.src}" alt="${escapeBookingHtml(room.name)} room photo" />` : `<span>Add ${escapeBookingHtml(room.name)} photo</span>`}
                </button>
                <div class="room-availability-bar">
                  <button class="${control.available ? "is-active" : ""}" type="button" data-room-availability="${room.id}" data-room-available="true">Available</button>
                  <button class="${!control.available ? "is-active danger" : ""}" type="button" data-room-availability="${room.id}" data-room-available="false">Not available</button>
                </div>
                <label class="room-note-label">
                  <span>Admin room note</span>
                  <textarea data-room-note="${room.id}" placeholder="Example: Room repainting today, available after 6PM">${escapeBookingHtml(control.note || "")}</textarea>
                </label>
                <div class="room-booking-live-wrap">
                  <button class="room-live-button" type="button" data-toggle-room-live="${room.id}">
                    <span>Live</span>
                    <strong>${bookingsForRoom.length}</strong>
                  </button>
                  ${expandedRoomBookingId === room.id ? `
                    <div class="room-booking-mini-list">
                      ${bookingsForRoom.map((booking) => {
                        const approved = bookingApproved(booking);
                        const statusLabel = approved ? "Booked" : "Pending";
                        return `
                        <div class="room-booking-mini-item ${approved ? "is-approved" : "is-pending"}">
                          <div>
                            <strong>${statusLabel}: ${escapeBookingHtml(booking.name || "Guest")}</strong>
                            <span>${escapeBookingHtml(booking.mobile || "No mobile")} | ${booking.fromDate || booking.date} to ${booking.toDate || booking.date}</span>
                            ${approved && booking.securityCode ? `<em>Security code: ${escapeBookingHtml(booking.securityCode)}</em>` : ""}
                          </div>
                          ${approved ? "" : `
                            <div class="room-booking-approve">
                              <input class="booking-code-input" data-booking-code-input="${escapeBookingHtml(booking.id)}" placeholder="Security code" />
                              <button class="tiny-button" type="button" data-confirm-room-booking="${escapeBookingHtml(booking.id)}">Confirm</button>
                            </div>
                          `}
                        </div>
                      `;
                      }).join("") || `<span>No room bookings yet</span>`}
                    </div>
                  ` : `<p class="room-live-note">Click Live to see the latest 30 booker details.</p>`}
                </div>
                <div class="room-picture-strip">
                  ${photos.map((photo, index) => `
                    <div class="room-picture-thumb-wrap">
                      <button class="room-picture-thumb" type="button" data-view-room-picture="${room.id}" data-room-picture-index="${index}">
                        <img src="${photo.src}" alt="${escapeBookingHtml(room.name)} photo ${index + 1}" />
                        <span>Room pic ${index + 1}</span>
                      </button>
                      <button class="room-picture-delete" type="button" data-delete-room-picture="${room.id}" data-room-picture-index="${index}" aria-label="Delete room photo ${index + 1}">×</button>
                    </div>
                  `).join("") || `<div class="room-picture-empty">No room pics yet</div>`}
                </div>
              </article>
            `;
          }).join("") || `<article class="admin-photo-card"><strong>No room yet</strong><span>Add a room first.</span></article>`}
        </div>
      </section>
    `;
  }

  function renderRoomConfirmationFloat() {
    const panel = qs("#roomConfirmationFloat");
    if (!panel) return;
    const pending = pendingRoomBookings();
    panel.classList.toggle("is-open", roomConfirmationOpen);
    panel.classList.toggle("has-pending", pending.length > 0);
    panel.innerHTML = `
      <button class="room-confirmation-toggle" type="button" data-toggle-room-confirmations>
        <span>Confirmation</span>
        <strong>${pending.length}</strong>
      </button>
      ${roomConfirmationOpen ? `
        <div class="room-confirmation-panel">
          <div class="room-confirmation-head">
            <strong>Room booking confirmation</strong>
            <span>${pending.length ? `${pending.length} pending` : "No pending request"}</span>
          </div>
          <div class="room-confirmation-list">
            ${pending.map((booking) => {
              const room = rooms.find((item) => item.id === booking.roomId);
              const floor = floors.find((item) => item.id === room?.floorId);
              return `
                <article class="room-confirmation-item">
                  <div>
                    <strong>${escapeBookingHtml(booking.name || "Guest")}</strong>
                    <span>${escapeBookingHtml(booking.mobile || "No mobile")} | ${escapeBookingHtml(floor?.name || "Floor")} | ${escapeBookingHtml(room?.name || booking.roomName || "Room")}</span>
                    <em>${booking.fromDate || booking.date} to ${booking.toDate || booking.date}</em>
                  </div>
                  <div class="room-confirmation-actions">
                    <input data-floating-booking-code="${escapeBookingHtml(booking.id)}" placeholder="Security code" />
                    <button class="tiny-button" type="button" data-floating-confirm-room-booking="${escapeBookingHtml(booking.id)}">Confirm</button>
                  </div>
                </article>
              `;
            }).join("") || `<div class="room-confirmation-empty">All room requests are confirmed.</div>`}
          </div>
        </div>
      ` : ""}
    `;
  }

  function renderChairs(capacity, shape = "round") {
    const chairCount = Math.min(Math.max(Number(capacity) || 1, 1), 16);
    const radius = shape === "banquet" ? 72 : chairCount > 8 ? 64 : 55;
    return Array.from({ length: chairCount }, (_, index) => {
      const angle = Math.round((360 / chairCount) * index);
      return `<span class="chair" style="--chair-angle: ${angle}deg; --chair-radius: ${radius}px"></span>`;
    }).join("");
  }

  function getTableStatus(tableId, date, slot) {
    const booking = bookings.find((item) => item.tableId === tableId && item.date === date && item.slot === slot && item.status !== "rejected");
    if (!booking) return "available";
    return booking.status === "pending" ? "pending" : "booked";
  }

  function isTableUnavailable(tableId, date, slot) {
    return getTableStatus(tableId, date, slot) !== "available";
  }

  function renderRoomLayoutElements(canvas, roomId, isAdmin) {
    if (!canvas) return;
    const elements = roomLayoutElements.filter((element) => element.roomId === roomId);

    elements.forEach((element) => {
      const node = document.createElement(isAdmin ? "button" : "div");
      if (isAdmin) node.type = "button";
      node.className = "room-photo-point";
      node.classList.toggle("is-selected", selectedMapElementId === element.id);
      node.dataset.layoutElementId = element.id;
      node.style.left = `${element.x}%`;
      node.style.top = `${element.y}%`;
      node.innerHTML = `
        <span class="point-eye" aria-hidden="true">View</span>
        <span class="point-label">${escapeBookingHtml(element.label)}</span>
      `;
      canvas.append(node);
    });
  }

  function renderLayoutStage(stageId, roomId) {
    const stage = qs(`#${stageId}`);
    if (!stage) return;
    const room = rooms.find((item) => item.id === roomId);
    const map = bookingMap();
    const structureImage = roomStructureImages[roomId] || null;
    const canvas = map?.canvasSize(stageId, structureImage) || { width: 1180, height: 560, zoom: 1 };
    stage.classList.toggle("has-structure-photo", Boolean(structureImage));
    if (structureImage) {
      stage.style.width = `${canvas.width}px`;
      stage.style.height = `${canvas.height}px`;
      stage.style.minHeight = "0";
    } else {
      stage.style.width = "";
      stage.style.height = "";
      stage.style.minHeight = "";
    }
    stage.innerHTML = `
      <div class="table-layout-viewport">
        <div class="layout-canvas floor-photo-canvas ${structureImage ? "has-structure-photo" : ""}" style="width: ${canvas.width}px; height: ${canvas.height}px; --stage-zoom: ${canvas.zoom};">
          <div class="room-watermark">
            <strong>${floorName(room?.floorId)} diagram / ${room?.name || "Room"}</strong>
            <span>${structureImage ? "Double-click points to add room/corner photos" : "Upload the floor structure picture"}</span>
          </div>
          ${structureImage ? "" : `<div class="floor-image-empty">Upload floor structure picture</div>`}
        </div>
      </div>
      ${map?.zoomControls(stageId) || ""}
    `;
    const canvasNode = stage.querySelector(".layout-canvas");
    if (structureImage) {
      canvasNode.style.backgroundImage = `linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02)), url("${structureImage.src}")`;
    }
    renderRoomLayoutElements(canvasNode, roomId, stageId === "adminLayoutStage");
  }

  function getTablePrice(tableId, slot, festival = false) {
    const table = tableLayouts.find((item) => item.id === tableId);
    const room = rooms.find((item) => item.id === table?.roomId);
    const pricing = tablePricing.find((item) => item.tableId === tableId && item.slot === slot);
    if (pricing) return festival && pricing.festivalPrice ? pricing.festivalPrice : pricing.price;
    return Math.round((room?.price || 500) * 0.5);
  }

  function renderPricingList() {
    const list = qs("#pricingList");
    if (!list) return;
    list.innerHTML = `<div class="data-row header"><span>Table</span><span>Time</span><span>Price</span><span>Festival</span></div>`;
    tablePricing.forEach((price) => {
      const table = tableLayouts.find((item) => item.id === price.tableId);
      const row = document.createElement("div");
      row.className = "data-row";
      row.innerHTML = `
        <span>${table ? tableLabel(table) : "Table"}</span>
        <span>${formatSlot(price.slot)}</span>
        <span>₹${price.price}</span>
        <span>₹${price.festivalPrice || price.price}</span>
      `;
      list.append(row);
    });
  }

  function renderAdminTableList() {
    const list = qs("#adminTableList");
    if (!list) return;
    const tablesForRoom = tableLayouts.filter((table) => table.roomId === selection.adminRoomId);
    list.innerHTML = tablesForRoom.map((table) => `
      <article class="admin-table-card ${selection.tableId === table.id ? "is-selected" : ""}">
        <div>
          <strong>${table.name}</strong>
          <span>${table.capacity} chairs | ${shapeLabel(table.shape)} | position ${table.x}%, ${table.y}%</span>
        </div>
        <div class="table-card-actions">
          <button class="tiny-button" type="button" data-select-table="${table.id}">Select</button>
          <button class="tiny-button" type="button" data-chair-action="minus" data-table-id="${table.id}">- chair</button>
          <button class="tiny-button" type="button" data-chair-action="plus" data-table-id="${table.id}">+ chair</button>
          <button class="tiny-button reject" type="button" data-delete-table="${table.id}">Delete</button>
        </div>
      </article>
    `).join("") || `
      <article class="admin-table-card">
        <div>
          <strong>No tables in this room yet</strong>
          <span>Add the first table using the form above.</span>
        </div>
      </article>
    `;
  }

  function renderAdminRoomMapList() {
    const list = qs("#adminRoomMapList");
    if (!list) return;
    const elementsForRoom = roomLayoutElements.filter((element) => element.roomId === selection.adminRoomId);
    list.innerHTML = `
      <h3 class="room-map-list-title">Structure photos</h3>
      ${elementsForRoom.map((element) => `
        <article class="admin-table-card ${selectedMapElementId === element.id ? "is-selected" : ""}">
          <div>
            <strong>${escapeBookingHtml(element.label)}</strong>
            <span><b class="room-map-item-type">Photo point</b> | position ${element.x}%, ${element.y}%</span>
            <input class="point-label-input" value="${escapeBookingHtml(element.label)}" data-map-label="${element.id}" placeholder="Room number / custom label" />
          </div>
          <div class="table-card-actions">
            <button class="tiny-button" type="button" data-select-map-element="${element.id}">Select</button>
            <button class="tiny-button" type="button" data-upload-door="${element.id}">Change image</button>
            <button class="tiny-button reject" type="button" data-delete-map-element="${element.id}">Delete</button>
          </div>
        </article>
      `).join("") || `
        <article class="admin-table-card">
          <div>
            <strong>No photo points yet</strong>
            <span>Double-click a point on the uploaded structure picture to add a room or corner photo.</span>
          </div>
        </article>
      `}
    `;
  }

  function renderCustomerFloorGallery() {
    const gallery = qs("#customerFloorGallery");
    if (!gallery) return;
    const photos = floorPhotos(selection.floorId);
    const firstPhoto = photos[0];
    const expanded = selection.expandedCustomerFloorId === selection.floorId;
    gallery.innerHTML = `
      <div class="customer-gallery-heading">
        <div>
          <strong>${floorName(selection.floorId)} floor pictures</strong>
          <span>${photos.length ? "First picture is shown directly. Use View all for the rest." : "No floor pictures uploaded by admin yet."}</span>
        </div>
        <button class="tiny-button" type="button" data-toggle-customer-floor-gallery="${selection.floorId}" ${photos.length > 1 ? "" : "disabled"}>${expanded ? "Hide all" : "View all"}</button>
      </div>
      ${firstPhoto ? `
        <button class="customer-feature-photo" type="button" data-view-customer-floor-picture="${selection.floorId}" data-floor-picture-index="0">
          <img src="${firstPhoto.src}" alt="${floorName(selection.floorId)} floor photo" />
          <span>${floorName(selection.floorId)} main floor photo</span>
        </button>
      ` : `<div class="floor-picture-empty">Upload floor pictures from admin to show them here.</div>`}
      ${expanded ? `
        <div class="customer-floor-strip">
          ${photos.map((photo, index) => `
            <button class="customer-floor-thumb" type="button" data-view-customer-floor-picture="${selection.floorId}" data-floor-picture-index="${index}">
              <img src="${photo.src}" alt="${floorName(selection.floorId)} floor photo ${index + 1}" />
              <span>Floor pic ${index + 1}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
    `;
  }

  function renderCustomerRoomGallery() {
    const gallery = qs("#customerRoomGallery");
    if (!gallery) return;
    const visibleRooms = customerVisibleRooms();
    gallery.innerHTML = `
      <div class="customer-gallery-heading">
        <div>
          <strong>Room photos</strong>
          <span>${visibleRooms.length ? "Every room shows the first photo directly. Open View images for more." : "No matching rooms found."}</span>
        </div>
        <strong>${visibleRooms.length} result${visibleRooms.length === 1 ? "" : "s"}</strong>
      </div>
      <div class="customer-room-card-grid">
        ${visibleRooms.map((room) => {
          const photos = roomPhotos(room.id);
          const firstPhoto = photos[0];
          const expanded = selection.expandedCustomerRoomId === room.id;
          const control = roomControl(room.id);
          return `
            <article class="customer-room-card">
              <button class="customer-room-main-photo" type="button" data-view-customer-room-picture="${room.id}" data-room-picture-index="0" ${firstPhoto ? "" : "disabled"}>
                ${firstPhoto ? `<img src="${firstPhoto.src}" alt="${escapeBookingHtml(room.name)} photo" />` : `<span>No room photo</span>`}
              </button>
              <div class="customer-room-card-body">
                <div>
                  <h3>${escapeBookingHtml(room.name)}</h3>
                  <span>${escapeBookingHtml(floorName(room.floorId))} | ${escapeBookingHtml(room.type)} | ₹${room.price}</span>
                  ${control.note ? `<p>${escapeBookingHtml(control.note)}</p>` : ""}
                </div>
                <button class="tiny-button" type="button" data-toggle-customer-room-gallery="${room.id}" ${photos.length > 1 ? "" : firstPhoto ? "" : "disabled"}>${expanded ? "Hide images" : "View images"}</button>
              </div>
              ${expanded ? `
                <div class="customer-floor-strip">
                  ${photos.map((photo, index) => `
                    <button class="customer-floor-thumb" type="button" data-view-customer-room-picture="${room.id}" data-room-picture-index="${index}">
                      <img src="${photo.src}" alt="${escapeBookingHtml(room.name)} photo ${index + 1}" />
                      <span>Room pic ${index + 1}</span>
                    </button>
                  `).join("") || `<div class="room-picture-empty">No room pics yet</div>`}
                </div>
              ` : ""}
            </article>
          `;
        }).join("") || `<div class="floor-picture-empty">Try another floor, room type or search text.</div>`}
      </div>
    `;
  }

  function buildWhatsAppUrl(booking) {
    const table = tableLayouts.find((item) => item.id === booking.tableId);
    const room = rooms.find((item) => item.id === table?.roomId);
    const message = [
      "New Booking",
      `Name: ${booking.name}`,
      `Mobile: ${booking.mobile}`,
      `Date: ${booking.date}`,
      `Time: ${formatSlot(booking.slot)}`,
      `Room: ${room?.name || "Room"}`,
      `Table: ${table?.name || "Table"}`,
      `Persons: ${booking.persons}`,
      `Request: ${booking.request || "None"}`
    ].join("\n");
    return `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(message)}`;
  }

  function renderBookingAdminList() {
    const list = qs("#bookingAdminList");
    if (!list) return;
    const availableCount = tableLayouts.filter((table) => getTableStatus(table.id, selection.date, selection.slot) === "available").length;
    const bookedCount = tableLayouts.length - availableCount;
    const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
    qs("#availableCount").textContent = availableCount;
    qs("#bookedCount").textContent = bookedCount;
    qs("#pendingCount").textContent = pendingCount;
    list.innerHTML = "";

    bookings.slice().reverse().forEach((booking) => {
      const table = tableLayouts.find((item) => item.id === booking.tableId);
      const room = rooms.find((item) => item.id === table?.roomId);
      const card = document.createElement("article");
      card.className = "booking-request-card";
      card.innerHTML = `
        <div>
          <h3>${booking.name} - ${table?.name || "Table"} (${booking.status})</h3>
          <p>${room?.name || "Room"} | ${booking.date} | ${formatSlot(booking.slot)} | ${booking.persons} persons</p>
          <p>Mobile: ${booking.mobile} | Request: ${booking.request || "None"}</p>
          <a class="whatsapp-link" href="${buildWhatsAppUrl(booking)}" target="_blank" rel="noreferrer">Open WhatsApp message</a>
        </div>
        <div class="booking-request-actions">
          <button class="tiny-button approve" type="button" data-booking-action="approved" data-booking-id="${booking.id}" ${booking.status === "approved" ? "disabled" : ""}>Approve</button>
          <button class="tiny-button reject" type="button" data-booking-action="rejected" data-booking-id="${booking.id}" ${booking.status === "rejected" ? "disabled" : ""}>Reject</button>
        </div>
      `;
      list.append(card);
    });
  }

  function updateSelectedBookingInfo() {
    const selectedInput = qs("#customerBookingForm input[name='selectedTable']");
    const info = qs("#selectedTableInfo");
    const price = qs("#selectedPrice");
    const selected = tableLayouts.find((table) => table.id === selection.tableId);
    if (!selected) {
      if (selectedInput) selectedInput.value = "";
      if (info) info.textContent = "No table selected";
      if (price) price.textContent = "₹0";
      return;
    }
    const tablePrice = getTablePrice(selected.id, selection.slot);
    if (selectedInput) selectedInput.value = `${selected.name} (${selected.capacity} seats)`;
    if (info) info.textContent = `${selected.name} | ${selected.capacity} seats | ${formatSlot(selection.slot)}`;
    if (price) price.textContent = `₹${tablePrice}`;
  }

  function renderBookingModule() {
    keepValidSelection();
    populateBookingSelects();
    renderFloorRoomList();
    renderCustomerFloorGallery();
    renderCustomerRoomGallery();
    renderLayoutStage("adminLayoutStage", selection.adminRoomId);
    renderAdminRoomMapList();
    renderAdminTableList();
    renderPricingList();
    renderBookingAdminList();
    renderRoomConfirmationFloat();
    updateSelectedBookingInfo();
    publishCustomerSnapshot();
  }

  function setTablePositionFromPointer(event, tableId, stage) {
    const table = tableLayouts.find((item) => item.id === tableId);
    if (!table || !stage) return;
    const canvas = stage.querySelector(".layout-canvas") || stage;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    table.x = Math.min(96, Math.max(4, Math.round(x)));
    table.y = Math.min(94, Math.max(6, Math.round(y)));
  }

  function setMapElementPositionFromPointer(event, elementId, stage) {
    const element = roomLayoutElements.find((item) => item.id === elementId);
    if (!element || !stage) return;
    const canvas = stage.querySelector(".layout-canvas") || stage;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    element.x = Math.min(96, Math.max(4, Math.round(x)));
    element.y = Math.min(94, Math.max(6, Math.round(y)));
  }

  function openPointImagePicker(elementId) {
    const element = roomLayoutElements.find((item) => item.id === elementId);
    const input = qs("#pointImageInput");
    if (!element || !input) return;
    selectedMapElementId = element.id;
    input.dataset.elementId = element.id;
    input.value = "";
    input.click();
  }

  function openStructureImagePicker() {
    const input = qs("#structureImageInput");
    if (!input) return;
    input.value = "";
    input.click();
  }

  function loadImageFile(file, callback) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const src = String(reader.result || "");
      const image = new Image();
      image.addEventListener("load", () => {
        callback({
          src,
          width: image.naturalWidth || 1180,
          height: image.naturalHeight || 560
        });
      });
      image.src = src;
    });
    reader.readAsDataURL(file);
  }

  function openLightbox(src, label) {
    if (!src) return;
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "photo-lightbox";
      lightbox.innerHTML = `
        <button class="photo-lightbox-close" type="button" aria-label="Close full screen image">×</button>
        <img alt="" />
        <strong></strong>
      `;
      document.body.append(lightbox);
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox || event.target.closest(".photo-lightbox-close")) {
          lightbox.classList.remove("is-open");
        }
      });
    }
    lightbox.querySelector("img").src = src;
    lightbox.querySelector("img").alt = label || "Room photo";
    lightbox.querySelector("strong").textContent = label || "Room photo";
    lightbox.classList.add("is-open");
  }

  function openAdminRoomCalendar(roomId) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;
    if (!adminCalendarModal) {
      adminCalendarModal = document.createElement("div");
      adminCalendarModal.className = "photo-lightbox admin-calendar-modal";
      adminCalendarModal.innerHTML = `
        <div class="admin-calendar-card">
          <button class="photo-lightbox-close" type="button" aria-label="Close calendar">×</button>
          <div class="admin-calendar-body"></div>
        </div>
      `;
      document.body.append(adminCalendarModal);
      adminCalendarModal.addEventListener("click", (event) => {
        if (event.target === adminCalendarModal || event.target.closest(".photo-lightbox-close")) {
          adminCalendarModal.classList.remove("is-open");
        }
        const dayButton = event.target.closest("[data-admin-calendar-day]");
        if (dayButton) {
          const day = dayButton.dataset.adminCalendarDay;
          const id = dayButton.dataset.adminCalendarRoom;
          const bookingStatus = roomBookingDayStatus(id, day);
          if (bookingStatus === "pending" || bookingStatus === "approved") {
            alert("This date has a customer booking request. Use the room booking list to review it.");
            return;
          }
          if (!roomDayStatus[id]) roomDayStatus[id] = {};
          roomDayStatus[id][day] = roomDayStatus[id][day] === "closed" ? "open" : "closed";
          publishCustomerSnapshot();
          openAdminRoomCalendar(id);
        }
      });
    }
    const days = Array.from({ length: 183 }, (_, index) => dateISO(addDays(new Date(), index)));
    adminCalendarModal.querySelector(".admin-calendar-body").innerHTML = `
      <span class="room-map-item-type">Admin calendar</span>
      <h3>${escapeBookingHtml(room.name)}</h3>
      <p>Click any open date to close it. Yellow means pending customer request, green means confirmed booking, red means admin closed.</p>
      <div class="admin-room-calendar-grid">
        ${days.map((day) => {
          const status = roomBookingDayStatus(roomId, day);
          const label = status === "approved" ? "Booked" : status === "pending" ? "Pending" : status === "closed" ? "Closed" : "Available";
          return `
            <button class="is-${status}" type="button" data-admin-calendar-room="${roomId}" data-admin-calendar-day="${day}">
              <strong>${formatDayLabel(day)}</strong>
              <span>${label}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
    adminCalendarModal.classList.add("is-open");
  }

  function createPhotoPointFromPointer(event, stage) {
    if (!stage) return;
    const canvas = stage.querySelector(".layout-canvas") || stage;
    const rect = canvas.getBoundingClientRect();
    pendingPoint = {
      roomId: selection.adminRoomId,
      x: Math.min(96, Math.max(4, Math.round(((event.clientX - rect.left) / rect.width) * 100))),
      y: Math.min(94, Math.max(6, Math.round(((event.clientY - rect.top) / rect.height) * 100)))
    };
    const input = qs("#pointImageInput");
    if (!input) return;
    input.dataset.elementId = "";
    input.value = "";
    input.click();
  }

  function bindEvents() {
    qsa("[data-booking-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewId = {
          floors: "bookingAdminFloors",
          layout: "bookingAdminLayout",
          pricing: "bookingAdminPricing",
          manage: "bookingAdminManage"
        }[button.dataset.bookingAdminTab];
        qsa("[data-booking-admin-tab]").forEach((item) => item.classList.remove("is-active"));
        qsa(".booking-admin-view").forEach((view) => view.classList.remove("is-active"));
        button.classList.add("is-active");
        qs(`#${viewId}`)?.classList.add("is-active");
      });
    });

    qs("#floorForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get("floorName")).trim();
      if (!name) return;
      const floor = { id: uniqueId("floor"), name };
      floors.push(floor);
      selection.floorId = floor.id;
      selection.adminFloorId = floor.id;
      selection.mediaFloorId = floor.id;
      selection.mediaMode = "floor";
      event.currentTarget.reset();
      renderBookingModule();
    });

    qs("#roomForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const room = {
        id: uniqueId("room"),
        floorId: String(formData.get("floorId")),
        name: String(formData.get("roomName")).trim(),
        type: String(formData.get("roomType")),
        price: Number(formData.get("price")),
        maxPeople: Number(formData.get("maxPeople")),
        image: String(formData.get("image")).trim(),
        openTime: String(formData.get("openTime")),
        closeTime: String(formData.get("closeTime"))
      };
      if (!room.name || !room.floorId) return;
      rooms.push(room);
      selection.floorId = room.floorId;
      selection.adminFloorId = room.floorId;
      selection.roomId = room.id;
      selection.adminRoomId = room.id;
      selection.mediaFloorId = room.floorId;
      selection.mediaRoomType = "all";
      selection.mediaRoomId = room.id;
      selection.mediaMode = "room";
      event.currentTarget.reset();
      renderBookingModule();
    });

    qs("#pricingForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const tableId = String(formData.get("tableId"));
      const slot = String(formData.get("slot"));
      const existing = tablePricing.find((item) => item.tableId === tableId && item.slot === slot);
      const price = Number(formData.get("price"));
      const festivalPrice = Number(formData.get("festivalPrice")) || price;
      if (existing) {
        existing.price = price;
        existing.festivalPrice = festivalPrice;
      } else {
        tablePricing.push({ tableId, slot, price, festivalPrice });
      }
      event.currentTarget.reset();
      renderBookingModule();
    });

    qs("#customerFloor")?.addEventListener("change", (event) => {
      selection.floorId = event.currentTarget.value;
      selection.roomType = "all";
      selection.roomId = customerRoomsForSelection()[0]?.id || firstRoomForFloor(selection.floorId);
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#customerRoomType")?.addEventListener("change", (event) => {
      selection.roomType = event.currentTarget.value;
      selection.roomId = customerRoomsForSelection()[0]?.id || firstRoomForFloor(selection.floorId);
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#customerRoom")?.addEventListener("change", (event) => {
      selection.roomId = event.currentTarget.value;
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#customerRoomSearch")?.addEventListener("input", (event) => {
      selection.customerSearch = event.currentTarget.value;
      renderCustomerRoomGallery();
    });

    qs("#customerDate")?.addEventListener("change", (event) => {
      selection.date = event.currentTarget.value || todayISO;
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#customerSlot")?.addEventListener("change", (event) => {
      selection.slot = event.currentTarget.value;
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#adminLayoutFloor")?.addEventListener("change", (event) => {
      selection.adminFloorId = event.currentTarget.value;
      selection.adminRoomId = firstRoomForFloor(selection.adminFloorId);
      selectedMapElementId = null;
      renderBookingModule();
    });

    qs("#adminLayoutRoom")?.addEventListener("change", (event) => {
      selection.adminRoomId = event.currentTarget.value;
      selectedMapElementId = null;
      renderBookingModule();
    });

    if (!root.dataset.bookingMapZoomBound) {
      root.dataset.bookingMapZoomBound = "true";
      root.addEventListener("click", (event) => {
        const toggleConfirmations = event.target.closest("[data-toggle-room-confirmations]");
        if (toggleConfirmations) {
          roomConfirmationOpen = !roomConfirmationOpen;
          renderRoomConfirmationFloat();
          return;
        }

        const floatingConfirm = event.target.closest("[data-floating-confirm-room-booking]");
        if (floatingConfirm) {
          const codeInput = floatingConfirm.closest(".room-confirmation-item")?.querySelector("[data-floating-booking-code]");
          if (confirmRoomBooking(floatingConfirm.dataset.floatingConfirmRoomBooking, codeInput?.value)) {
            roomConfirmationOpen = pendingRoomBookings().length > 0;
            renderBookingModule();
          }
          return;
        }

        const zoomButton = event.target.closest("[data-layout-zoom]");
        if (!zoomButton) {
          const uploadDoor = event.target.closest("[data-upload-door]");
          if (uploadDoor) openPointImagePicker(uploadDoor.dataset.uploadDoor);
          return;
        }
        const stageId = zoomButton.dataset.layoutStage;
        const action = zoomButton.dataset.layoutZoom;
        if (action === "in") bookingMap()?.adjustZoom(stageId, 1);
        if (action === "out") bookingMap()?.adjustZoom(stageId, -1);
        if (action === "reset") bookingMap()?.resetZoom(stageId);
        renderBookingModule();
      });
    }

    qs("#uploadStructureButton")?.addEventListener("click", openStructureImagePicker);

    qs("#floorRoomList")?.addEventListener("click", (event) => {
      const modeButton = event.target.closest("[data-media-mode]");
      if (modeButton) {
        selection.mediaMode = modeButton.dataset.mediaMode;
        renderBookingModule();
        return;
      }

      const liveButton = event.target.closest("[data-toggle-room-live]");
      if (liveButton) {
        expandedRoomBookingId = expandedRoomBookingId === liveButton.dataset.toggleRoomLive ? "" : liveButton.dataset.toggleRoomLive;
        renderBookingModule();
        return;
      }

      const availabilityButton = event.target.closest("[data-room-availability]");
      if (availabilityButton) {
        const control = roomControl(availabilityButton.dataset.roomAvailability);
        control.available = availabilityButton.dataset.roomAvailable === "true";
        renderBookingModule();
        return;
      }

      const adminCalendarButton = event.target.closest("[data-open-admin-room-calendar]");
      if (adminCalendarButton) {
        openAdminRoomCalendar(adminCalendarButton.dataset.openAdminRoomCalendar);
        return;
      }

      const confirmBookingButton = event.target.closest("[data-confirm-room-booking]");
      if (confirmBookingButton) {
        const booking = roomBookings.find((item) => item.id === confirmBookingButton.dataset.confirmRoomBooking);
        const input = confirmBookingButton.closest(".room-booking-approve")?.querySelector("[data-booking-code-input]");
        const code = input?.value.trim() || "";
        if (!booking) return;
        if (confirmRoomBooking(booking.id, code)) renderBookingModule();
        return;
      }

      const deleteRoomButton = event.target.closest("[data-delete-room]");
      if (deleteRoomButton) {
        const room = rooms.find((item) => item.id === deleteRoomButton.dataset.deleteRoom);
        if (!room || !confirm(`Delete ${room.name}?`)) return;
        rooms = rooms.filter((item) => item.id !== room.id);
        delete roomPictures[room.id];
        delete roomStatus[room.id];
        delete roomDayStatus[room.id];
        roomBookings = roomBookings.filter((booking) => booking.roomId !== room.id);
        if (selection.roomId === room.id) selection.roomId = firstRoomForFloor(selection.floorId);
        if (selection.adminRoomId === room.id) selection.adminRoomId = firstRoomForFloor(selection.adminFloorId);
        renderBookingModule();
        return;
      }

      const deleteFloorButton = event.target.closest("[data-delete-floor]");
      if (deleteFloorButton) {
        const floor = floors.find((item) => item.id === deleteFloorButton.dataset.deleteFloor);
        if (!floor || !confirm(`Delete ${floor.name} and its rooms?`)) return;
        const roomIds = rooms.filter((room) => room.floorId === floor.id).map((room) => room.id);
        floors = floors.filter((item) => item.id !== floor.id);
        rooms = rooms.filter((room) => room.floorId !== floor.id);
        delete floorPictures[floor.id];
        roomIds.forEach((roomId) => {
          delete roomPictures[roomId];
          delete roomStatus[roomId];
          delete roomDayStatus[roomId];
        });
        roomBookings = roomBookings.filter((booking) => !roomIds.includes(booking.roomId));
        selection.floorId = floors[0]?.id || "";
        selection.adminFloorId = selection.floorId;
        selection.mediaFloorId = selection.floorId;
        renderBookingModule();
        return;
      }

      const deleteFloorPictureButton = event.target.closest("[data-delete-floor-picture]");
      if (deleteFloorPictureButton) {
        const floorId = deleteFloorPictureButton.dataset.deleteFloorPicture;
        const index = Number(deleteFloorPictureButton.dataset.floorPictureIndex);
        const list = floorPhotos(floorId);
        if (!list[index] || !confirm(`Delete floor photo ${index + 1}?`)) return;
        floorPictures[floorId] = list.filter((_, photoIndex) => photoIndex !== index);
        renderBookingModule();
        return;
      }

      const deleteRoomPictureButton = event.target.closest("[data-delete-room-picture]");
      if (deleteRoomPictureButton) {
        const roomId = deleteRoomPictureButton.dataset.deleteRoomPicture;
        const index = Number(deleteRoomPictureButton.dataset.roomPictureIndex);
        const list = roomPhotos(roomId);
        if (!list[index] || !confirm(`Delete room photo ${index + 1}?`)) return;
        roomPictures[roomId] = list.filter((_, photoIndex) => photoIndex !== index);
        renderBookingModule();
        return;
      }

      const uploadRoomButton = event.target.closest("[data-upload-room-picture]");
      if (uploadRoomButton) {
        const roomId = uploadRoomButton.dataset.uploadRoomPicture;
        if (!roomId) return;
        if (roomPhotos(roomId).length >= maxRoomPhotos) {
          alert(`Maximum ${maxRoomPhotos} room photos allowed.`);
          return;
        }
        pendingRoomPictureId = roomId;
        const input = qs("#roomPictureInput");
        if (input) {
          input.value = "";
          input.click();
        }
        return;
      }

      const viewRoomButton = event.target.closest("[data-view-room-picture]");
      if (viewRoomButton) {
        const roomId = viewRoomButton.dataset.viewRoomPicture;
        const photo = roomPhotos(roomId)[Number(viewRoomButton.dataset.roomPictureIndex)];
        openLightbox(photo?.src, `${rooms.find((room) => room.id === roomId)?.name || "Room"} pic ${Number(viewRoomButton.dataset.roomPictureIndex) + 1}`);
        return;
      }

      const uploadButton = event.target.closest("[data-upload-floor-picture]");
      if (uploadButton) {
        pendingFloorPictureId = uploadButton.dataset.uploadFloorPicture;
        if (floorPhotos(pendingFloorPictureId).length >= maxFloorPhotos) {
          alert(`Maximum ${maxFloorPhotos} floor photos allowed.`);
          pendingFloorPictureId = null;
          return;
        }
        const input = qs("#floorPictureInput");
        if (input) {
          input.value = "";
          input.click();
        }
        return;
      }

      const viewButton = event.target.closest("[data-view-floor-picture]");
      if (viewButton) {
        const photo = floorPhotos(viewButton.dataset.viewFloorPicture)[Number(viewButton.dataset.floorPictureIndex)];
        openLightbox(photo?.src, `${floorName(viewButton.dataset.viewFloorPicture)} floor pic ${Number(viewButton.dataset.floorPictureIndex) + 1}`);
      }
    });

    qs("#floorRoomList")?.addEventListener("change", (event) => {
      if (event.target.matches("#mediaFloorSelect")) {
        selection.mediaFloorId = event.target.value;
        selection.mediaMode = "floor";
        renderBookingModule();
        return;
      }

      if (event.target.matches("#mediaRoomFloorSelect")) {
        selection.mediaFloorId = event.target.value;
        selection.mediaRoomType = "all";
        selection.mediaRoomId = mediaRoomsForSelection()[0]?.id || firstRoomForFloor(selection.mediaFloorId);
        selection.mediaMode = "room";
        renderBookingModule();
        return;
      }

      if (event.target.matches("#mediaRoomTypeSelect")) {
        selection.mediaRoomType = event.target.value;
        selection.mediaRoomId = mediaRoomsForSelection()[0]?.id || firstRoomForFloor(selection.mediaFloorId);
        selection.mediaMode = "room";
        renderBookingModule();
        return;
      }

      if (event.target.matches("#mediaRoomSelect")) {
        selection.mediaRoomId = event.target.value;
        selection.mediaMode = "room";
        renderBookingModule();
      }
    });

    qs("#floorRoomList")?.addEventListener("input", (event) => {
      const noteInput = event.target.closest("[data-room-note]");
      if (!noteInput) return;
      const control = roomControl(noteInput.dataset.roomNote);
      control.note = noteInput.value;
      publishCustomerSnapshot();
    });

    qs("#floorPictureInput")?.addEventListener("change", (event) => {
      const input = event.currentTarget;
      const files = Array.from(input.files || []);
      if (!pendingFloorPictureId || !files.length) return;
      const existing = floorPhotos(pendingFloorPictureId);
      const remainingSlots = maxFloorPhotos - existing.length;
      if (remainingSlots <= 0) {
        alert(`Maximum ${maxFloorPhotos} floor photos allowed.`);
        pendingFloorPictureId = null;
        return;
      }
      const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, remainingSlots);
      if (!imageFiles.length) {
        alert("Please upload image files for the floor pictures.");
        return;
      }
      if (files.length > remainingSlots) {
        alert(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added to this floor.`);
      }
      let remaining = imageFiles.length;
      imageFiles.forEach((file) => {
        loadImageFile(file, (image) => {
          const list = floorPictures[pendingFloorPictureId] || [];
          list.push({
            id: uniqueId("floor-pic"),
            name: file.name,
            src: image.src,
            width: image.width,
            height: image.height
          });
          floorPictures[pendingFloorPictureId] = list;
          remaining -= 1;
          if (remaining === 0) {
            pendingFloorPictureId = null;
            renderBookingModule();
          }
        });
      });
    });

    qs("#roomPictureInput")?.addEventListener("change", (event) => {
      const input = event.currentTarget;
      const files = Array.from(input.files || []);
      if (!pendingRoomPictureId || !files.length) return;
      const existing = roomPhotos(pendingRoomPictureId);
      const remainingSlots = maxRoomPhotos - existing.length;
      if (remainingSlots <= 0) {
        alert(`Maximum ${maxRoomPhotos} room photos allowed.`);
        pendingRoomPictureId = null;
        return;
      }
      const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, remainingSlots);
      if (!imageFiles.length) {
        alert("Please upload image files for the room pictures.");
        return;
      }
      if (files.length > remainingSlots) {
        alert(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added to this room.`);
      }
      let remaining = imageFiles.length;
      imageFiles.forEach((file) => {
        loadImageFile(file, (image) => {
          const list = roomPictures[pendingRoomPictureId] || [];
          list.push({
            id: uniqueId("room-pic"),
            name: file.name,
            src: image.src,
            width: image.width,
            height: image.height
          });
          roomPictures[pendingRoomPictureId] = list;
          remaining -= 1;
          if (remaining === 0) {
            pendingRoomPictureId = null;
            renderBookingModule();
          }
        });
      });
    });

    qs("#structureImageInput")?.addEventListener("change", (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file for the floor structure.");
        return;
      }
      loadImageFile(file, (image) => {
        roomStructureImages[selection.adminRoomId] = image;
        bookingMap()?.resetZoom("adminLayoutStage");
        renderBookingModule();
      });
    });

    qs("#pointImageInput")?.addEventListener("change", (event) => {
      const input = event.currentTarget;
      const element = roomLayoutElements.find((item) => item.id === input.dataset.elementId);
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file for this point.");
        return;
      }
      loadImageFile(file, (image) => {
        if (element) {
          element.image = image.src;
          selectedMapElementId = element.id;
        } else if (pendingPoint) {
          const pointCount = roomLayoutElements.filter((item) => item.roomId === pendingPoint.roomId).length + 1;
          const point = {
            id: uniqueId("photo-point"),
            roomId: pendingPoint.roomId,
            label: `Photo point ${pointCount}`,
            x: pendingPoint.x,
            y: pendingPoint.y,
            image: image.src
          };
          roomLayoutElements.push(point);
          selectedMapElementId = point.id;
          pendingPoint = null;
        }
        renderBookingModule();
      });
    });

    qs("#customerFloorGallery")?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-toggle-customer-floor-gallery]");
      if (toggleButton) {
        selection.expandedCustomerFloorId = selection.expandedCustomerFloorId === toggleButton.dataset.toggleCustomerFloorGallery ? "" : toggleButton.dataset.toggleCustomerFloorGallery;
        renderCustomerFloorGallery();
        return;
      }

      const viewButton = event.target.closest("[data-view-customer-floor-picture]");
      if (!viewButton) return;
      const photo = floorPhotos(viewButton.dataset.viewCustomerFloorPicture)[Number(viewButton.dataset.floorPictureIndex)];
      openLightbox(photo?.src, `${floorName(viewButton.dataset.viewCustomerFloorPicture)} floor pic ${Number(viewButton.dataset.floorPictureIndex) + 1}`);
    });

    qs("#customerRoomGallery")?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-toggle-customer-room-gallery]");
      if (toggleButton) {
        selection.expandedCustomerRoomId = selection.expandedCustomerRoomId === toggleButton.dataset.toggleCustomerRoomGallery ? "" : toggleButton.dataset.toggleCustomerRoomGallery;
        renderCustomerRoomGallery();
        return;
      }

      const viewButton = event.target.closest("[data-view-customer-room-picture]");
      if (!viewButton) return;
      const roomId = viewButton.dataset.viewCustomerRoomPicture;
      const photo = roomPhotos(roomId)[Number(viewButton.dataset.roomPictureIndex)];
      openLightbox(photo?.src, `${rooms.find((room) => room.id === roomId)?.name || "Room"} pic ${Number(viewButton.dataset.roomPictureIndex) + 1}`);
    });

    qs("#adminLayoutStage")?.addEventListener("pointerdown", (event) => {
      const mapElement = event.target.closest(".room-photo-point");
      if (mapElement) {
        layoutDrag = { kind: "map", elementId: mapElement.dataset.layoutElementId };
        selectedMapElementId = mapElement.dataset.layoutElementId;
        mapElement.setPointerCapture?.(event.pointerId);
        return;
      }

      const tableButton = event.target.closest(".booking-table-3d");
      if (!tableButton) return;
      layoutDrag = { kind: "table", tableId: tableButton.dataset.tableId };
      selection.tableId = tableButton.dataset.tableId;
      tableButton.setPointerCapture?.(event.pointerId);
      setTablePositionFromPointer(event, layoutDrag.tableId, event.currentTarget);
      renderBookingModule();
    });

    qs("#adminLayoutStage")?.addEventListener("dblclick", (event) => {
      clearTimeout(adminCanvasClickTimer);
      if (!event.target.closest(".layout-canvas")) return;
      if (!roomStructureImages[selection.adminRoomId]) {
        openStructureImagePicker();
        return;
      }
      createPhotoPointFromPointer(event, event.currentTarget);
    });

    qs("#adminLayoutStage")?.addEventListener("click", (event) => {
      const pointButton = event.target.closest(".room-photo-point");
      if (pointButton) {
        clearTimeout(adminCanvasClickTimer);
        const point = roomLayoutElements.find((item) => item.id === pointButton.dataset.layoutElementId);
        openLightbox(point?.image, point?.label);
        return;
      }
      const canvas = event.target.closest(".has-structure-photo");
      if (canvas && !event.target.closest(".room-photo-point")) {
        clearTimeout(adminCanvasClickTimer);
        adminCanvasClickTimer = setTimeout(() => {
          const image = roomStructureImages[selection.adminRoomId];
          openLightbox(image?.src, rooms.find((item) => item.id === selection.adminRoomId)?.name || "Structure image");
        }, 220);
      }
    });

    qs("#adminTableList")?.addEventListener("click", (event) => {
      const selectButton = event.target.closest("[data-select-table]");
      if (selectButton) {
        selection.tableId = selectButton.dataset.selectTable;
        renderBookingModule();
        return;
      }

      const chairButton = event.target.closest("[data-chair-action]");
      if (chairButton) {
        const table = tableLayouts.find((item) => item.id === chairButton.dataset.tableId);
        if (!table) return;
        const delta = chairButton.dataset.chairAction === "plus" ? 1 : -1;
        table.capacity = Math.min(16, Math.max(1, Number(table.capacity) + delta));
        selection.tableId = table.id;
        renderBookingModule();
        return;
      }

      const deleteButton = event.target.closest("[data-delete-table]");
      if (deleteButton) {
        const table = tableLayouts.find((item) => item.id === deleteButton.dataset.deleteTable);
        if (!table || !confirm(`Delete ${table.name} and its chair layout?`)) return;
        tableLayouts = tableLayouts.filter((item) => item.id !== table.id);
        tablePricing = tablePricing.filter((item) => item.tableId !== table.id);
        bookings = bookings.filter((item) => item.tableId !== table.id);
        if (selection.tableId === table.id) selection.tableId = null;
        renderBookingModule();
      }
    });

    qs("#adminRoomMapList")?.addEventListener("click", (event) => {
      if (event.target.closest("[data-map-label]")) return;

      const selectButton = event.target.closest("[data-select-map-element]");
      if (selectButton) {
        selectedMapElementId = selectButton.dataset.selectMapElement;
        renderBookingModule();
        return;
      }

      const uploadDoorButton = event.target.closest("[data-upload-door]");
      if (uploadDoorButton) {
        event.stopPropagation();
        openPointImagePicker(uploadDoorButton.dataset.uploadDoor);
        return;
      }

      const actionButton = event.target.closest("[data-map-action]");
      if (actionButton) {
        const element = roomLayoutElements.find((item) => item.id === actionButton.dataset.mapId);
        if (!element) return;
        const action = actionButton.dataset.mapAction;
        if (action === "rotate") element.rotation = ((Number(element.rotation) || 0) + 90) % 180;
        if (action === "larger") element.width = bookingMap()?.clampWidth(element.type, Number(element.width) + 6) || element.width;
        if (action === "smaller") element.width = bookingMap()?.clampWidth(element.type, Number(element.width) - 6) || element.width;
        selectedMapElementId = element.id;
        renderBookingModule();
        return;
      }

      const deleteButton = event.target.closest("[data-delete-map-element]");
      if (deleteButton) {
        const element = roomLayoutElements.find((item) => item.id === deleteButton.dataset.deleteMapElement);
        if (!element || !confirm(`Delete ${element.label}?`)) return;
        roomLayoutElements = roomLayoutElements.filter((item) => item.id !== element.id);
        if (selectedMapElementId === element.id) selectedMapElementId = null;
        renderBookingModule();
      }
    });

    qs("#adminRoomMapList")?.addEventListener("input", (event) => {
      const input = event.target.closest("[data-map-label]");
      if (!input) return;
      const element = roomLayoutElements.find((item) => item.id === input.dataset.mapLabel);
      if (!element) return;
      element.label = input.value.trim() || "Room photo";
      selectedMapElementId = element.id;
      renderLayoutStage("adminLayoutStage", selection.adminRoomId);
    });

    qs("#customerBookingForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const selectedTable = tableLayouts.find((table) => table.id === selection.tableId);
      if (!selectedTable) {
        alert("Please select an available table from the live layout.");
        return;
      }
      if (isTableUnavailable(selectedTable.id, selection.date, selection.slot)) {
        alert("This time slot is already booked. Please choose another table or slot.");
        selection.tableId = null;
        renderBookingModule();
        return;
      }
      const persons = Number(formData.get("persons"));
      if (persons > selectedTable.capacity) {
        alert(`This table supports ${selectedTable.capacity} persons. Please select a larger table.`);
        return;
      }
      const booking = {
        id: uniqueId("booking"),
        name: String(formData.get("name")).trim(),
        mobile: String(formData.get("mobile")).trim(),
        date: selection.date,
        slot: selection.slot,
        persons,
        request: String(formData.get("request")).trim(),
        tableId: selectedTable.id,
        status: "pending"
      };
      bookings.push(booking);
      window.open(buildWhatsAppUrl(booking), "_blank", "noopener,noreferrer");
      event.currentTarget.reset();
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#bookingAdminList")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-booking-action]");
      if (!button) return;
      const booking = bookings.find((item) => item.id === button.dataset.bookingId);
      if (!booking) return;
      booking.status = button.dataset.bookingAction;
      renderBookingModule();
    });
  }

  window.addEventListener("pointermove", (event) => {
    if (!layoutDrag || !root) return;
    if (layoutDrag.kind === "map") {
      setMapElementPositionFromPointer(event, layoutDrag.elementId, qs("#adminLayoutStage"));
    } else {
      setTablePositionFromPointer(event, layoutDrag.tableId, qs("#adminLayoutStage"));
    }
    renderBookingModule();
  });

  window.addEventListener("pointerup", () => {
    layoutDrag = null;
  });

  function init(mount) {
    root = mount;
    renderBookingModule();
    bindEvents();
  }

  return { init };
})();
