const STORAGE_KEY = "smartAttendanceSystemState";
const SIX_MONTH_DAYS = 183;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * SIX_MONTH_DAYS;

let state = loadState();
let activeEmployeeId = "";

function qs(selector) {
  return document.querySelector(selector);
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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

function formatDay(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const cutoff = Date.now() - SIX_MONTHS_MS;
    stored.attendance = Array.isArray(stored.attendance)
      ? stored.attendance.filter((record) => new Date(`${record.date}T00:00:00`).getTime() >= cutoff)
      : [];
    stored.employees = Array.isArray(stored.employees)
      ? stored.employees.map((employee) => ({
        ...employee,
        joiningDate: employee.joiningDate || today(),
        salaryMonths: employee.salaryMonths && typeof employee.salaryMonths === "object" ? employee.salaryMonths : {}
      }))
      : [];
    stored.activity = Array.isArray(stored.activity) ? stored.activity : [];
    stored.subAdmins = Array.isArray(stored.subAdmins) ? stored.subAdmins : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return { employees: [], subAdmins: [], attendance: [], activity: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function employee() {
  return state.employees.find((item) => item.id === activeEmployeeId);
}

function recordFor(day) {
  return state.attendance.find((record) => record.employeeId === activeEmployeeId && record.date === day);
}

function monthTitle(monthStart) {
  return monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function monthStarts(count = 6) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(start);
    month.setMonth(start.getMonth() - index);
    return month;
  });
}

function monthNumber(monthStart) {
  return monthStart.getFullYear() * 12 + monthStart.getMonth();
}

function monthStartFromIso(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!match) return null;
  const monthStart = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  return Number.isNaN(monthStart.getTime()) ? null : monthStart;
}

function monthStartsForEmployee(person, count = 6) {
  const joiningMonth = monthStartFromIso(person?.joiningDate) || monthStartFromIso(today());
  return monthStarts(count).filter((month) => monthNumber(month) >= monthNumber(joiningMonth));
}

function monthDays(monthStart) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) => dateISO(new Date(year, month, index + 1)));
}

function dayState(day) {
  const person = employee();
  const record = recordFor(day);
  if (day > today()) return { className: "is-future", label: "Future", disabled: true };
  if (person?.joiningDate && day < person.joiningDate) return { className: "is-not-started", label: "Before join", disabled: true };
  if (record) {
    if (!record.reviewed) return { className: "is-pending", label: "Pending", disabled: true };
    return record.status === "present"
      ? { className: "is-approved", label: "Approved", disabled: true }
      : { className: "is-absent", label: "Rejected", disabled: true };
  }
  if (day === today()) return { className: "", label: "Mark", disabled: false };
  return { className: "is-absent", label: "Absent", disabled: true };
}

function renderWorkerMonth(monthStart) {
  const days = monthDays(monthStart);
  const blanks = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay();
  return `
    <section class="worker-month-card">
      <div class="employee-month-head">
        <strong>${monthTitle(monthStart)}</strong>
        <span>${days.length} days</span>
      </div>
      <div class="worker-calendar-grid">
        ${Array.from({ length: blanks }, () => `<span class="calendar-blank"></span>`).join("")}
        ${days.map((day) => {
          const isPastStoredLimit = new Date(`${day}T00:00:00`).getTime() < Date.now() - SIX_MONTHS_MS;
          const state = dayState(day);
          const hardDisabled = isPastStoredLimit
            || state.className === "is-future"
            || state.className === "is-not-started"
            || (state.className === "is-absent" && state.label === "Absent");
          const softLocked = state.disabled && !hardDisabled;
          return `
            <button type="button" class="${state.className}" data-worker-date="${day}" ${softLocked ? `aria-disabled="true"` : ""} ${hardDisabled ? "disabled" : ""}>
              <strong>${formatDay(day)}</strong>
              <span>${state.label}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderCalendar() {
  const person = employee();
  const panel = qs("#workerCalendarPanel");
  if (!person) {
    panel.innerHTML = `<div class="empty-portal"><h3>No employee logged in</h3><p>Login to open your calendar.</p></div>`;
    return;
  }
  panel.innerHTML = `
    <div class="att-card-heading">
      <div>
        <h3>${person.name}</h3>
        <span>${person.role} | ${person.shift}</span>
      </div>
      <button class="secondary-button" type="button" data-worker-logout>Log out</button>
    </div>
    <div class="worker-calendar-legend">
      <span class="pending">Pending</span>
      <span class="approved">Approved</span>
      <span class="absent">Absent / rejected</span>
      <span>Today only</span>
    </div>
    <div class="worker-months">
      ${monthStartsForEmployee(person, 6).map(renderWorkerMonth).join("")}
    </div>
  `;
}

function refreshFromStorage() {
  state = loadState();
  renderCalendar();
}

function markDate(day) {
  const person = employee();
  if (!person || recordFor(day)) return;
  if (day !== today()) {
    qs("#workerMessage").textContent = "Only today's date can be marked for attendance.";
    return;
  }
  if (person.joiningDate && day < person.joiningDate) {
    qs("#workerMessage").textContent = "Attendance starts from your joining date.";
    return;
  }
  state.attendance.push({
    id: uid("att"),
    employeeId: activeEmployeeId,
    date: day,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "present",
    method: "Worker QR footer calendar",
    reviewed: false,
    reviewedBy: "",
    reviewedAt: ""
  });
  saveState();
  qs("#workerMessage").textContent = `${formatDay(day)} marked. Admin approval pending.`;
  renderCalendar();
}

qs("#workerLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state = loadState();
  const data = new FormData(event.currentTarget);
  const userId = String(data.get("userId")).trim();
  const password = String(data.get("password"));
  const person = state.employees.find((item) => item.userId === userId && item.password === password);
  if (!person) {
    qs("#workerMessage").textContent = "Invalid employee ID or password.";
    return;
  }
  activeEmployeeId = person.id;
  qs("#workerMessage").textContent = `Welcome ${person.name}. Tap today to mark attendance.`;
  event.currentTarget.reset();
  renderCalendar();
});

document.addEventListener("click", (event) => {
  const dateButton = event.target.closest("[data-worker-date]");
  if (dateButton) {
    if (dateButton.getAttribute("aria-disabled") === "true" || dateButton.disabled) return;
    markDate(dateButton.dataset.workerDate);
  }
  if (event.target.closest("[data-worker-logout]")) {
    activeEmployeeId = "";
    qs("#workerMessage").textContent = "";
    renderCalendar();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) refreshFromStorage();
});

window.addEventListener("focus", refreshFromStorage);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshFromStorage();
});

renderCalendar();
