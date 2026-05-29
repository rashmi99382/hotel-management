window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.booking = (() => {
  const todayISO = new Date().toISOString().slice(0, 10);
  const adminWhatsAppNumber = "919999999999";
  const timeSlots = ["18:00-20:00", "20:00-22:00", "12:00-14:00", "14:00-16:00"];

  let root = null;
  let layoutDrag = null;

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
    { id: "table-t1", roomId: "room-ac", name: "T1", capacity: 4, shape: "rectangle", x: 24, y: 30 },
    { id: "table-t2", roomId: "room-ac", name: "T2", capacity: 2, shape: "round", x: 58, y: 28 },
    { id: "table-t3", roomId: "room-ac", name: "T3", capacity: 6, shape: "round", x: 38, y: 66 },
    { id: "table-t4", roomId: "room-vip", name: "T1", capacity: 8, shape: "banquet", x: 48, y: 46 },
    { id: "table-t5", roomId: "room-family", name: "T1", capacity: 4, shape: "square", x: 26, y: 35 },
    { id: "table-t6", roomId: "room-family", name: "T2", capacity: 8, shape: "banquet", x: 62, y: 55 },
    { id: "table-t7", roomId: "room-nonac", name: "T1", capacity: 4, shape: "rectangle", x: 44, y: 48 }
  ];

  let tablePricing = [
    { tableId: "table-t1", slot: "18:00-20:00", price: 500, festivalPrice: 700 },
    { tableId: "table-t1", slot: "20:00-22:00", price: 700, festivalPrice: 900 },
    { tableId: "table-t2", slot: "18:00-20:00", price: 350, festivalPrice: 500 },
    { tableId: "table-t3", slot: "20:00-22:00", price: 900, festivalPrice: 1200 }
  ];

  let bookings = [
    {
      id: "B001",
      name: "Rashmi",
      mobile: "9876543210",
      date: todayISO,
      slot: "18:00-20:00",
      persons: 4,
      request: "Window side if possible",
      tableId: "table-t2",
      status: "approved"
    }
  ];

  let selection = {
    floorId: "floor-1",
    roomId: "room-ac",
    tableId: null,
    date: todayISO,
    slot: "18:00-20:00",
    adminFloorId: "floor-1",
    adminRoomId: "room-ac"
  };

  function qs(selector) {
    return root?.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(root?.querySelectorAll(selector) || []);
  }

  function uniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  }

  function firstRoomForFloor(floorId) {
    return rooms.find((room) => room.floorId === floorId)?.id || rooms[0]?.id || "";
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
    if (!rooms.some((room) => room.id === selection.roomId && room.floorId === selection.floorId)) {
      selection.roomId = firstRoomForFloor(selection.floorId);
    }
    if (!rooms.some((room) => room.id === selection.adminRoomId && room.floorId === selection.adminFloorId)) {
      selection.adminRoomId = firstRoomForFloor(selection.adminFloorId);
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

  function populateBookingSelects() {
    populateSelect(qs("#customerFloor"), floors, selection.floorId);
    populateSelect(qs("#customerRoom"), rooms.filter((room) => room.floorId === selection.floorId), selection.roomId, roomLabel);
    populateSelect(qs("#adminLayoutFloor"), floors, selection.adminFloorId);
    populateSelect(qs("#adminLayoutRoom"), rooms.filter((room) => room.floorId === selection.adminFloorId), selection.adminRoomId, roomLabel);
    populateSelect(qs("#roomForm select[name='floorId']"), floors, selection.adminFloorId);
    populateSelect(qs("#tableForm select[name='roomId']"), rooms, selection.adminRoomId, (room) => `${floorName(room.floorId)} / ${room.name}`);
    populateSelect(qs("#pricingForm select[name='tableId']"), tableLayouts, tableLayouts[0]?.id || "", tableLabel);
    populateSelect(qs("#pricingForm select[name='slot']"), timeSlots, selection.slot, formatSlot);
    populateSelect(qs("#customerSlot"), availableSlotsForRoom(selection.roomId), selection.slot, formatSlot);

    const dateInput = qs("#customerDate");
    if (dateInput) dateInput.value = selection.date;
  }

  function renderFloorRoomList() {
    const list = qs("#floorRoomList");
    if (!list) return;
    list.innerHTML = "";
    floors.forEach((floor) => {
      const card = document.createElement("article");
      card.className = "floor-card";
      const floorRooms = rooms.filter((room) => room.floorId === floor.id);
      card.innerHTML = `
        <h3>${floor.name}</h3>
        <div class="room-chip-grid">
          ${floorRooms.map((room) => `
            <div class="room-chip">
              ${room.image ? `<img src="${room.image}" alt="${room.name}" />` : ""}
              <strong>${room.name}</strong>
              <span>${room.type} | ₹${room.price} room price</span>
              <span>Max ${room.maxPeople} people | ${room.openTime}-${room.closeTime}</span>
              <span>${tableLayouts.filter((table) => table.roomId === room.id).length} tables</span>
            </div>
          `).join("") || "<span>No rooms yet.</span>"}
        </div>
      `;
      list.append(card);
    });
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

  function renderLayoutStage(stageId, roomId) {
    const stage = qs(`#${stageId}`);
    if (!stage) return;
    const room = rooms.find((item) => item.id === roomId);
    const tablesForRoom = tableLayouts.filter((table) => table.roomId === roomId);
    stage.innerHTML = `
      <div class="room-watermark">
        <strong>${room?.name || "Room"}</strong>
        <span>${room?.type || ""} | ${room?.openTime || ""}-${room?.closeTime || ""}</span>
      </div>
    `;

    tablesForRoom.forEach((table) => {
      const status = getTableStatus(table.id, selection.date, selection.slot);
      const shape = table.shape || "round";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `booking-table-3d ${status} shape-${shape}`;
      button.classList.toggle("selected", selection.tableId === table.id);
      button.dataset.tableId = table.id;
      button.style.left = `${table.x}%`;
      button.style.top = `${table.y}%`;
      button.innerHTML = `
        ${renderChairs(table.capacity, shape)}
        <span class="table-top">${table.name}<small>${table.capacity} chairs</small></span>
      `;
      stage.append(button);
    });

    const legend = document.createElement("div");
    legend.className = "booking-legend";
    legend.innerHTML = `
      <span class="legend-dot available">Available</span>
      <span class="legend-dot booked">Booked</span>
      <span class="legend-dot pending">Pending</span>
    `;
    stage.append(legend);
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
    renderLayoutStage("adminLayoutStage", selection.adminRoomId);
    renderLayoutStage("customerLayoutStage", selection.roomId);
    renderAdminTableList();
    renderPricingList();
    renderBookingAdminList();
    updateSelectedBookingInfo();
  }

  function setTablePositionFromPointer(event, tableId, stage) {
    const table = tableLayouts.find((item) => item.id === tableId);
    if (!table || !stage) return;
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    table.x = Math.min(90, Math.max(10, Math.round(x)));
    table.y = Math.min(86, Math.max(14, Math.round(y)));
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
      event.currentTarget.reset();
      renderBookingModule();
    });

    qs("#tableForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const roomId = String(formData.get("roomId"));
      const count = tableLayouts.filter((table) => table.roomId === roomId).length;
      const table = {
        id: uniqueId("table"),
        roomId,
        name: String(formData.get("tableName")).trim(),
        shape: String(formData.get("shape")) || "round",
        capacity: Math.min(16, Math.max(1, Number(formData.get("capacity")) || 4)),
        x: 24 + (count % 3) * 26,
        y: 28 + Math.floor(count / 3) * 24
      };
      if (!table.name || !table.roomId) return;
      tableLayouts.push(table);
      selection.adminRoomId = roomId;
      selection.tableId = table.id;
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
      selection.roomId = firstRoomForFloor(selection.floorId);
      selection.tableId = null;
      renderBookingModule();
    });

    qs("#customerRoom")?.addEventListener("change", (event) => {
      selection.roomId = event.currentTarget.value;
      selection.tableId = null;
      renderBookingModule();
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
      renderBookingModule();
    });

    qs("#adminLayoutRoom")?.addEventListener("change", (event) => {
      selection.adminRoomId = event.currentTarget.value;
      renderBookingModule();
    });

    qs("#customerLayoutStage")?.addEventListener("click", (event) => {
      const tableButton = event.target.closest(".booking-table-3d");
      if (!tableButton) return;
      const tableId = tableButton.dataset.tableId;
      if (isTableUnavailable(tableId, selection.date, selection.slot)) {
        alert("This table is already booked for the selected time slot.");
        return;
      }
      selection.tableId = tableId;
      renderBookingModule();
    });

    qs("#adminLayoutStage")?.addEventListener("pointerdown", (event) => {
      const tableButton = event.target.closest(".booking-table-3d");
      if (!tableButton) return;
      layoutDrag = { tableId: tableButton.dataset.tableId };
      selection.tableId = tableButton.dataset.tableId;
      tableButton.setPointerCapture?.(event.pointerId);
      setTablePositionFromPointer(event, layoutDrag.tableId, event.currentTarget);
      renderBookingModule();
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
    setTablePositionFromPointer(event, layoutDrag.tableId, qs("#adminLayoutStage"));
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
