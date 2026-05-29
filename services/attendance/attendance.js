window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.attendance = (() => {
  const STORAGE_KEY = "smartAttendanceSystemState";
  let root = null;
  let state = loadState();
  let activeView = "admin";
  let employeeSearch = "";
  let roleFilter = "All";
  let currentEmployeeId = "";
  let currentReviewer = { type: "admin", name: "Admin" };

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
  }

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function dateTimeNow() {
    return new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function defaultState() {
    return {
      employees: [
        makeEmployee("Amit Kumar", "Waiter", "waiter101", "Amit@123", "9AM-6PM"),
        makeEmployee("Priya Singh", "Cook", "cook201", "Priya@123", "8AM-5PM"),
        makeEmployee("Rohit Das", "Housekeeping", "house301", "Rohit@123", "10AM-7PM"),
        makeEmployee("Neha Patel", "Billing", "bill401", "Neha@123", "11AM-8PM")
      ],
      subAdmins: [
        { id: uid("sub"), name: "Floor Supervisor", userId: "supervisor1", password: "Admin@123", permission: "reports", createdAt: dateTimeNow(), lastLoginAt: "" }
      ],
      attendance: [],
      activity: []
    };
  }

  function makeEmployee(name, role, userId, password, shift) {
    return {
      id: uid("emp"),
      name,
      role,
      userId,
      password,
      shift,
      qrId: uid("qr"),
      active: true,
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
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        subAdmins: Array.isArray(parsed.subAdmins) ? parsed.subAdmins : [],
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
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

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function hash(value) {
    let output = 0;
    for (let index = 0; index < value.length; index += 1) {
      output = Math.imul(31, output) + value.charCodeAt(index) | 0;
    }
    return Math.abs(output);
  }

  function qrMarkup(employee) {
    const seed = hash(`${employee.qrId}:${employee.userId}`);
    const cells = Array.from({ length: 81 }, (_, index) => {
      const finder =
        (index % 9 < 3 && Math.floor(index / 9) < 3) ||
        (index % 9 > 5 && Math.floor(index / 9) < 3) ||
        (index % 9 < 3 && Math.floor(index / 9) > 5);
      const dark = finder || ((seed + index * 17) % 7 < 3);
      return `<span class="${dark ? "" : "light"}"></span>`;
    }).join("");
    return `<div class="qr-art" aria-label="Personal QR for ${escapeHtml(employee.name)}">${cells}</div>`;
  }

  function initials(name) {
    return String(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function employeeById(id) {
    return state.employees.find((employee) => employee.id === id);
  }

  function todayRecords() {
    return state.attendance.filter((record) => record.date === todayKey());
  }

  function recordForEmployee(employeeId) {
    return todayRecords().find((record) => record.employeeId === employeeId);
  }

  function attendancePercent() {
    if (!state.employees.length) return 0;
    return Math.round((todayRecords().filter((record) => record.status === "present").length / state.employees.length) * 100);
  }

  function pendingRecords() {
    return todayRecords().filter((record) => !record.reviewed);
  }

  function reviewedPercent() {
    const records = todayRecords();
    if (!records.length) return 0;
    return Math.round((records.filter((record) => record.reviewed).length / records.length) * 100);
  }

  function addActivity(type, name, userId, result) {
    state.activity.unshift({
      id: uid("log"),
      type,
      name,
      userId,
      result,
      time: dateTimeNow()
    });
    state.activity = state.activity.slice(0, 40);
  }

  function renderStats() {
    const present = todayRecords().filter((record) => record.status === "present").length;
    const cards = [
      ["Employees", state.employees.length],
      ["Present today", present],
      ["Pending review", pendingRecords().length],
      ["Attendance", `${attendancePercent()}%`],
      ["Sub-admins", state.subAdmins.length]
    ];
    qs("#attendanceStats").innerHTML = cards.map(([label, value]) => `
      <article class="att-stat">
        <strong>${value}</strong>
        <span>${label}</span>
      </article>
    `).join("");
  }

  function renderTabs() {
    qsa("[data-att-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.attView === activeView));
    qsa(".attendance-view").forEach((view) => view.classList.remove("is-active"));
    qs(`#att${activeView[0].toUpperCase()}${activeView.slice(1)}View`).classList.add("is-active");
  }

  function roleOptions() {
    const roles = [...new Set(state.employees.map((employee) => employee.role))].sort();
    qs("#roleFilter").innerHTML = `<option value="All">All roles</option>${roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`).join("")}`;
    qs("#roleFilter").value = roleFilter;
  }

  function filteredEmployees() {
    return state.employees.filter((employee) => {
      const haystack = `${employee.name} ${employee.role} ${employee.userId}`.toLowerCase();
      const roleMatch = roleFilter === "All" || employee.role === roleFilter;
      return roleMatch && haystack.includes(employeeSearch.toLowerCase());
    });
  }

  function renderEmployees() {
    roleOptions();
    qs("#employeeDirectory").innerHTML = filteredEmployees().map((employee) => {
      const record = recordForEmployee(employee.id);
      const status = record ? record.status : "absent";
      const reviewClass = record?.reviewed ? "present" : record ? "pending" : "absent";
      return `
        <article class="employee-card">
          <div class="employee-card-header">
            <div class="employee-avatar">${escapeHtml(initials(employee.name))}</div>
            <div>
              <h4>${escapeHtml(employee.name)}</h4>
              <p>${escapeHtml(employee.role)} | ${escapeHtml(employee.shift)}</p>
            </div>
          </div>
          <div class="employee-meta">
            <span>ID: ${escapeHtml(employee.userId)}</span>
            <span>Pass: ${escapeHtml(employee.password)}</span>
            <span>QR: ${escapeHtml(employee.qrId.slice(-6).toUpperCase())}</span>
          </div>
          <div class="personal-qr">
            ${qrMarkup(employee)}
            <div>
              <span class="status-pill ${status === "present" ? "present" : "absent"}">${status === "present" ? "Present" : "Not marked"}</span>
              <p>${record ? `Marked at ${escapeHtml(record.time)}` : "Waiting for QR scan after login."}</p>
              <span class="status-pill ${reviewClass}">${record?.reviewed ? "Reviewed" : record ? "Review pending" : "No record"}</span>
            </div>
          </div>
          <div class="employee-actions">
            <button class="tiny-button" type="button" data-login-fill="${employee.id}">Use login</button>
            <button class="tiny-button danger" type="button" data-delete-employee="${employee.id}">Remove</button>
          </div>
        </article>
      `;
    }).join("") || `<article class="review-item"><div><h4>No employee found</h4><p>Add a worker or change the filter.</p></div></article>`;
  }

  function renderSubAdmins() {
    qs("#subAdminList").innerHTML = state.subAdmins.map((subAdmin) => `
      <article class="sub-admin-card">
        <div>
          <h4>${escapeHtml(subAdmin.name)}</h4>
          <p>ID: ${escapeHtml(subAdmin.userId)} | Pass: ${escapeHtml(subAdmin.password)} | Permission: ${escapeHtml(subAdmin.permission)} | ${subAdmin.lastLoginAt ? `Last login: ${escapeHtml(subAdmin.lastLoginAt)}` : "No login yet"}</p>
        </div>
        <button class="tiny-button danger" type="button" data-delete-sub-admin="${subAdmin.id}">Remove</button>
      </article>
    `).join("") || `<article class="sub-admin-card"><div><h4>No sub-admin yet</h4><p>Create a reviewer account for attendance control.</p></div></article>`;
  }

  function renderReviewQueue() {
    const records = pendingRecords();
    qs("#reviewQueue").innerHTML = records.map((record) => {
      const employee = employeeById(record.employeeId);
      return `
        <article class="review-item">
          <div>
            <h4>${escapeHtml(employee?.name || "Unknown employee")}</h4>
            <p>${escapeHtml(employee?.role || "")} | ${escapeHtml(record.time)} | Method: ${escapeHtml(record.method)}</p>
          </div>
          <div class="review-actions">
            <button class="tiny-button" type="button" data-review-record="${record.id}">Approve</button>
            <button class="tiny-button danger" type="button" data-mark-absent="${record.id}">Reject</button>
          </div>
        </article>
      `;
    }).join("") || `<article class="review-item"><div><h4>No pending review</h4><p>All marked attendance is reviewed for today.</p></div></article>`;
  }

  function renderActivity() {
    qs("#loginActivity").innerHTML = state.activity.slice(0, 8).map((item) => `
      <article class="activity-item">
        <div>
          <h4>${escapeHtml(item.name)} <span class="status-pill ${item.result === "Success" ? "present" : "absent"}">${escapeHtml(item.result)}</span></h4>
          <p>${escapeHtml(item.type)} | ${escapeHtml(item.userId)} | ${escapeHtml(item.time)}</p>
        </div>
      </article>
    `).join("") || `<article class="activity-item"><div><h4>No login activity yet</h4><p>Employee and sub-admin logins will appear here.</p></div></article>`;
  }

  function renderEmployeePortal() {
    const portal = qs("#employeePortal");
    const employee = employeeById(currentEmployeeId);
    if (!employee) {
      portal.innerHTML = `
        <div class="empty-portal">
          <div>
            <h3>No employee logged in</h3>
            <p>Use an employee User ID and password to open the personal attendance QR.</p>
          </div>
        </div>
      `;
      return;
    }
    const record = recordForEmployee(employee.id);
    portal.innerHTML = `
      <div class="employee-portal-card">
        <div>
          <p class="eyebrow">Logged in employee</p>
          <h3>${escapeHtml(employee.name)}</h3>
          <p>${escapeHtml(employee.role)} | ${escapeHtml(employee.shift)} | User ID: ${escapeHtml(employee.userId)}</p>
          <div class="portal-actions">
            <button class="primary-button" type="button" data-scan-employee-qr="${employee.id}">${record ? "Attendance already marked" : "Scan my QR and mark attendance"}</button>
            <button class="secondary-button" type="button" data-employee-logout>Log out</button>
          </div>
          <p class="att-message">${record ? `Today marked at ${escapeHtml(record.time)}. Review status: ${record.reviewed ? "approved" : "pending"}.` : "Scan the personal QR after login to mark present."}</p>
        </div>
        <div class="personal-qr">
          ${qrMarkup(employee)}
          <div>
            <strong>Personal QR</strong>
            <p>${escapeHtml(employee.qrId)}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderReports() {
    qs("#attendanceReport").innerHTML = state.employees.map((employee) => {
      const record = recordForEmployee(employee.id);
      const status = record?.status || "absent";
      return `
        <article class="report-row">
          <div>
            <h4>${escapeHtml(employee.name)} <span class="status-pill ${status === "present" ? "present" : "absent"}">${status}</span></h4>
            <p>${escapeHtml(employee.role)} | ${escapeHtml(employee.shift)} | ${record ? `Time: ${escapeHtml(record.time)}` : "No scan yet"} | ${record?.reviewed ? `Reviewed by ${escapeHtml(record.reviewedBy)}` : "Not reviewed"}</p>
          </div>
        </article>
      `;
    }).join("");

    const progress = reviewedPercent();
    qs("#reviewCompletion").innerHTML = `
      <div class="completion-ring" style="--progress: ${progress}%">
        <strong>${progress}%</strong>
      </div>
      <p class="completion-note">${progress === 100 ? "100% attendance review complete." : `${pendingRecords().length} attendance records still need review.`}</p>
      <button class="primary-button" type="button" data-review-all ${pendingRecords().length ? "" : "disabled"}>Approve all pending</button>
    `;
  }

  function renderAll() {
    renderTabs();
    renderStats();
    renderEmployees();
    renderSubAdmins();
    renderReviewQueue();
    renderActivity();
    renderEmployeePortal();
    renderReports();
  }

  function uniqueUserId(userId, ignoreEmployeeId = "") {
    const normalized = userId.toLowerCase();
    const employeeMatch = state.employees.some((employee) => employee.id !== ignoreEmployeeId && employee.userId.toLowerCase() === normalized);
    const subAdminMatch = state.subAdmins.some((subAdmin) => subAdmin.userId.toLowerCase() === normalized);
    return !employeeMatch && !subAdminMatch;
  }

  function createEmployee(form) {
    const data = new FormData(form);
    const userId = String(data.get("userId")).trim();
    if (!uniqueUserId(userId)) {
      alert("This User ID already exists. Please create a unique User ID.");
      return;
    }
    const role = String(data.get("role")) === "Custom" ? String(data.get("customRole")).trim() || "Custom worker" : String(data.get("role"));
    state.employees.push(makeEmployee(
      String(data.get("name")).trim(),
      role,
      userId,
      String(data.get("password")).trim(),
      String(data.get("shift")).trim()
    ));
    form.reset();
    saveState();
    renderAll();
  }

  function createSubAdmin(form) {
    const data = new FormData(form);
    const userId = String(data.get("userId")).trim();
    if (!uniqueUserId(userId)) {
      alert("This User ID already exists. Please create a unique User ID.");
      return;
    }
    state.subAdmins.push({
      id: uid("sub"),
      name: String(data.get("name")).trim(),
      userId,
      password: String(data.get("password")).trim(),
      permission: String(data.get("permission")),
      createdAt: dateTimeNow(),
      lastLoginAt: ""
    });
    form.reset();
    saveState();
    renderAll();
  }

  function employeeLogin(form) {
    const data = new FormData(form);
    const userId = String(data.get("userId")).trim();
    const password = String(data.get("password"));
    const employee = state.employees.find((item) => item.userId === userId && item.password === password);
    if (!employee) {
      addActivity("Employee", "Unknown", userId, "Failed");
      qs("#employeeLoginMessage").textContent = "Invalid employee User ID or password.";
      saveState();
      renderAll();
      return;
    }
    currentEmployeeId = employee.id;
    employee.lastLoginAt = dateTimeNow();
    addActivity("Employee", employee.name, employee.userId, "Success");
    qs("#employeeLoginMessage").textContent = `${employee.name} logged in. Scan personal QR to mark attendance.`;
    form.reset();
    saveState();
    renderAll();
  }

  function subAdminLogin(form) {
    const data = new FormData(form);
    const userId = String(data.get("userId")).trim();
    const password = String(data.get("password"));
    const subAdmin = state.subAdmins.find((item) => item.userId === userId && item.password === password);
    if (!subAdmin) {
      addActivity("Sub-admin", "Unknown", userId, "Failed");
      qs("#subAdminLoginMessage").textContent = "Invalid sub-admin User ID or password.";
      saveState();
      renderAll();
      return;
    }
    currentReviewer = { type: "sub-admin", name: subAdmin.name };
    subAdmin.lastLoginAt = dateTimeNow();
    addActivity("Sub-admin", subAdmin.name, subAdmin.userId, "Success");
    qs("#subAdminLoginMessage").textContent = `${subAdmin.name} can now review attendance.`;
    form.reset();
    activeView = "admin";
    saveState();
    renderAll();
  }

  function markAttendance(employeeId) {
    const employee = employeeById(employeeId);
    if (!employee || currentEmployeeId !== employeeId) return;
    const existing = recordForEmployee(employeeId);
    if (existing) {
      renderEmployeePortal();
      return;
    }
    state.attendance.push({
      id: uid("att"),
      employeeId,
      date: todayKey(),
      time: timeNow(),
      status: "present",
      method: "Personal QR scan after login",
      reviewed: false,
      reviewedBy: "",
      reviewedAt: ""
    });
    saveState();
    renderAll();
  }

  function reviewRecord(recordId, approved) {
    const record = state.attendance.find((item) => item.id === recordId);
    if (!record) return;
    record.reviewed = true;
    record.status = approved ? "present" : "absent";
    record.reviewedBy = currentReviewer.name;
    record.reviewedAt = dateTimeNow();
    saveState();
    renderAll();
  }

  function seedTeam() {
    if (!confirm("Load sample team? This will replace current attendance prototype data.")) return;
    state = defaultState();
    currentEmployeeId = "";
    currentReviewer = { type: "admin", name: "Admin" };
    saveState();
    renderAll();
  }

  function exportReport() {
    const lines = [
      "Smart Attendance Report",
      `Date: ${todayKey()}`,
      `Attendance: ${attendancePercent()}%`,
      "",
      ...state.employees.map((employee) => {
        const record = recordForEmployee(employee.id);
        return `${employee.name}, ${employee.role}, ${employee.userId}, ${record?.status || "absent"}, ${record?.time || "-"}, ${record?.reviewed ? `Reviewed by ${record.reviewedBy}` : "Not reviewed"}`;
      })
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${todayKey()}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleRootClick(event) {
    const viewButton = event.target.closest("[data-att-view]");
    if (viewButton) {
      activeView = viewButton.dataset.attView;
      renderAll();
    }

    const fillButton = event.target.closest("[data-login-fill]");
    if (fillButton) {
      const employee = employeeById(fillButton.dataset.loginFill);
      if (!employee) return;
      activeView = "employee";
      renderAll();
      qs("#employeeLoginForm").elements.userId.value = employee.userId;
      qs("#employeeLoginForm").elements.password.value = employee.password;
    }

    const deleteEmployee = event.target.closest("[data-delete-employee]");
    if (deleteEmployee) {
      const employee = employeeById(deleteEmployee.dataset.deleteEmployee);
      if (!employee || !confirm(`Remove ${employee.name}?`)) return;
      state.employees = state.employees.filter((item) => item.id !== employee.id);
      state.attendance = state.attendance.filter((record) => record.employeeId !== employee.id);
      if (currentEmployeeId === employee.id) currentEmployeeId = "";
      saveState();
      renderAll();
    }

    const deleteSubAdmin = event.target.closest("[data-delete-sub-admin]");
    if (deleteSubAdmin) {
      const subAdmin = state.subAdmins.find((item) => item.id === deleteSubAdmin.dataset.deleteSubAdmin);
      if (!subAdmin || !confirm(`Remove ${subAdmin.name}?`)) return;
      state.subAdmins = state.subAdmins.filter((item) => item.id !== subAdmin.id);
      saveState();
      renderAll();
    }

    const scanButton = event.target.closest("[data-scan-employee-qr]");
    if (scanButton) markAttendance(scanButton.dataset.scanEmployeeQr);

    if (event.target.closest("[data-employee-logout]")) {
      currentEmployeeId = "";
      renderAll();
    }

    const reviewButton = event.target.closest("[data-review-record]");
    if (reviewButton) reviewRecord(reviewButton.dataset.reviewRecord, true);

    const absentButton = event.target.closest("[data-mark-absent]");
    if (absentButton) reviewRecord(absentButton.dataset.markAbsent, false);

    if (event.target.closest("[data-review-all]")) {
      pendingRecords().forEach((record) => {
        record.reviewed = true;
        record.reviewedBy = currentReviewer.name;
        record.reviewedAt = dateTimeNow();
      });
      saveState();
      renderAll();
    }
  }

  function bindEvents() {
    qs("#employeeForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createEmployee(event.currentTarget);
    });

    qs("#subAdminForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createSubAdmin(event.currentTarget);
    });

    qs("#employeeLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      employeeLogin(event.currentTarget);
    });

    qs("#subAdminLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      subAdminLogin(event.currentTarget);
    });

    qs("#employeeSearch").addEventListener("input", (event) => {
      employeeSearch = event.currentTarget.value;
      renderEmployees();
    });

    qs("#roleFilter").addEventListener("change", (event) => {
      roleFilter = event.currentTarget.value;
      renderEmployees();
    });

    qs("#seedAttendanceButton").addEventListener("click", seedTeam);
    qs("#exportAttendanceButton").addEventListener("click", exportReport);

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
