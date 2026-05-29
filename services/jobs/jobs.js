window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.jobs = (() => {
  const STORAGE_KEY = "smartHotelCareerPlatformState";
  const DEFAULT_COUNTRY = "India";
  const LOCATION_API = window.smartHotelLocationDirectory || {
    load: () => Promise.resolve(),
    countries: () => ["India", "United States", "United Kingdom", "United Arab Emirates", "Canada", "Australia", "Singapore", "Qatar", "Saudi Arabia", "Nepal", "Bangladesh", "Sri Lanka"],
    statesFor: (country) => country === "India" ? ["Odisha", "West Bengal", "Jharkhand", "Bihar", "Telangana", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Kerala"] : [],
    districtsFor: (country, state) => {
      const districts = {
        Odisha: ["Khordha", "Cuttack", "Puri", "Ganjam", "Sambalpur", "Sundargarh", "Balasore", "Bhadrak"],
        "West Bengal": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas"],
        Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
        Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
        Telangana: ["Hyderabad", "Rangareddy", "Warangal"],
        Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane"]
      };
      return country === "India" ? districts[state] || [] : [];
    }
  };

  let root = null;
  let state = loadState();
  let activeView = "post";
  let adminSearch = "";
  let adminCountryFilter = "All";
  let adminStateFilter = "All";
  let adminDistrictFilter = "All";

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
  }

  function nowText() {
    return new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
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
    return String(value || "Company").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function sortUnique(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function mergeLocationValues(primary, secondary) {
    return sortUnique([...(primary || []), ...(secondary || [])]);
  }

  function normalizeJobLocation(item) {
    return {
      ...item,
      country: item.country || DEFAULT_COUNTRY,
      state: item.state || "",
      district: item.district || "",
      block: item.block || "",
      status: item.status || "Open"
    };
  }

  function optionHtml(value, label, selectedValue) {
    const selected = value === selectedValue ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
  }

  function setOptions(select, values, placeholder, selectedValue, includeAll = false) {
    const options = sortUnique(values);
    const fallbackValue = includeAll ? "All" : "";
    const safeSelected = selectedValue && options.includes(selectedValue) ? selectedValue : fallbackValue;
    const firstOption = optionHtml(fallbackValue, placeholder, safeSelected);
    select.innerHTML = [firstOption, ...options.map((value) => optionHtml(value, value, safeSelected))].join("");
    select.value = safeSelected;
  }

  function defaultState() {
    return {
      jobs: [
        job({
          companyName: "Smart Palace Hotel",
          jobRole: "Waiter, Room Service Staff",
          country: "India",
          state: "Odisha",
          district: "Khordha",
          block: "Bhubaneswar",
          salary: "₹14,000 - ₹20,000",
          experience: "6 months preferred",
          contactName: "Rashmi",
          contactPhone: "9938209630",
          contactEmail: "jobs@smartpalace.in",
          description: "Premium hotel hiring waiters and room service staff for morning and evening shifts.",
          urgent: true,
          layout: "premium"
        }),
        job({
          companyName: "Coastal Food Court",
          jobRole: "Cook, Kitchen Helper",
          country: "India",
          state: "Odisha",
          district: "Cuttack",
          block: "Cuttack Sadar",
          salary: "₹16,000 - ₹28,000",
          experience: "1 year cooking experience",
          contactName: "Manager",
          contactPhone: "919999999999",
          contactEmail: "hr@coastalfood.in",
          description: "Restaurant kitchen team opening for Indian, Chinese and snacks counter roles.",
          urgent: false,
          layout: "professional"
        }),
        job({
          companyName: "Metro Stay",
          jobRole: "Front Desk Executive",
          country: "India",
          state: "West Bengal",
          district: "Kolkata",
          block: "Salt Lake",
          salary: "₹18,000 - ₹30,000",
          experience: "Freshers can apply",
          contactName: "HR Team",
          contactPhone: "918888888888",
          contactEmail: "career@metrostay.in",
          description: "Front office hiring with customer support, check-in, booking coordination and guest handling.",
          urgent: false,
          layout: "compact"
        })
      ],
      applications: []
    };
  }

  function job(input) {
    return {
      id: uid("job"),
      companyName: input.companyName,
      country: input.country || DEFAULT_COUNTRY,
      state: input.state,
      district: input.district,
      block: input.block,
      jobRole: input.jobRole,
      salary: input.salary,
      experience: input.experience,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      description: input.description,
      logo: input.logo || "",
      banner: input.banner || "",
      urgent: Boolean(input.urgent),
      layout: input.layout || "professional",
      status: input.status || "Open",
      createdAt: input.createdAt || nowText()
    };
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultState();
      const parsed = JSON.parse(stored);
      const fallback = defaultState();
      return {
        ...fallback,
        ...parsed,
        jobs: Array.isArray(parsed.jobs) ? parsed.jobs.map(normalizeJobLocation) : fallback.jobs,
        applications: Array.isArray(parsed.applications) ? parsed.applications : []
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("smartHotelJobsUpdated"));
  }

  function qs(selector) {
    return root.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function readImage(file) {
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

  function jobCountries() {
    return sortUnique(state.jobs.map((item) => item.country));
  }

  function jobStates(country) {
    return sortUnique(state.jobs
      .filter((item) => country === "All" || item.country === country)
      .map((item) => item.state));
  }

  function jobDistricts(country, stateName) {
    return sortUnique(state.jobs
      .filter((item) => country === "All" || item.country === country)
      .filter((item) => stateName === "All" || item.state === stateName)
      .map((item) => item.district));
  }

  function filteredJobs() {
    return state.jobs.filter((item) => {
      const haystack = `${item.companyName} ${item.jobRole} ${item.country} ${item.state} ${item.district} ${item.block}`.toLowerCase();
      const countryMatch = adminCountryFilter === "All" || item.country === adminCountryFilter;
      const stateMatch = adminStateFilter === "All" || item.state === adminStateFilter;
      const districtMatch = adminDistrictFilter === "All" || item.district === adminDistrictFilter;
      return countryMatch && stateMatch && districtMatch && haystack.includes(adminSearch.toLowerCase());
    });
  }

  function applicantsForJob(jobId) {
    return state.applications.filter((item) => item.jobId === jobId);
  }

  function renderTabs() {
    qsa("[data-jobs-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.jobsView === activeView));
    qsa(".jobs-view").forEach((view) => view.classList.remove("is-active"));
    qs(`#job${activeView[0].toUpperCase()}${activeView.slice(1)}View`).classList.add("is-active");
  }

  function renderStats() {
    const open = state.jobs.filter((item) => item.status === "Open").length;
    const urgent = state.jobs.filter((item) => item.urgent).length;
    const cards = [
      ["Published jobs", state.jobs.length],
      ["Open jobs", open],
      ["Urgent hiring", urgent],
      ["Applications", state.applications.length]
    ];
    qs("#jobStats").innerHTML = cards.map(([label, value]) => `
      <article class="job-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function renderPostLocationControls() {
    const countrySelect = qs("#jobCountrySelect");
    const stateSelect = qs("#jobStateSelect");
    const districtSelect = qs("#jobDistrictSelect");
    if (!countrySelect || !stateSelect || !districtSelect) return;

    const selectedCountry = countrySelect.value || DEFAULT_COUNTRY;
    const countries = mergeLocationValues(LOCATION_API.countries(), jobCountries());
    setOptions(countrySelect, countries, "Select country", selectedCountry);
    if (!countrySelect.value && countries.includes(DEFAULT_COUNTRY)) countrySelect.value = DEFAULT_COUNTRY;

    const country = countrySelect.value || DEFAULT_COUNTRY;
    const selectedState = stateSelect.value || "Odisha";
    const states = mergeLocationValues(LOCATION_API.statesFor(country), jobStates(country));
    setOptions(stateSelect, states, "Select state", selectedState);
    if (!stateSelect.value && states.length) stateSelect.value = states[0];

    const stateName = stateSelect.value;
    const selectedDistrict = districtSelect.value || "Khordha";
    const districts = mergeLocationValues(LOCATION_API.districtsFor(country, stateName), jobDistricts(country, stateName));
    setOptions(districtSelect, districts, "Select district", selectedDistrict);
    if (!districtSelect.value && districts.length) districtSelect.value = districts[0];
  }

  function renderFilters() {
    const countrySelect = qs("#adminJobCountryFilter");
    const stateSelect = qs("#adminJobStateFilter");
    const districtSelect = qs("#adminJobDistrictFilter");
    const countries = mergeLocationValues(LOCATION_API.countries(), jobCountries());
    setOptions(countrySelect, countries, "All countries", adminCountryFilter, true);
    adminCountryFilter = countrySelect.value;

    const states = mergeLocationValues(adminCountryFilter === "All" ? [] : LOCATION_API.statesFor(adminCountryFilter), jobStates(adminCountryFilter));
    setOptions(stateSelect, states, "All states", adminStateFilter, true);
    adminStateFilter = stateSelect.value;

    const districts = mergeLocationValues(
      adminCountryFilter === "All" || adminStateFilter === "All" ? [] : LOCATION_API.districtsFor(adminCountryFilter, adminStateFilter),
      jobDistricts(adminCountryFilter, adminStateFilter)
    );
    setOptions(districtSelect, districts, "All districts", adminDistrictFilter, true);
    adminDistrictFilter = districtSelect.value;
  }

  function renderJobs() {
    qs("#adminJobList").innerHTML = filteredJobs().map((item) => adminJobCard(item)).join("") || emptyCard("No job found", "Post a job or change the filters.");
  }

  function adminJobCard(item) {
    const applicants = applicantsForJob(item.id).length;
    const bannerStyle = item.banner ? `url('${item.banner}')` : "linear-gradient(135deg, rgba(37, 99, 235, .9), rgba(15, 159, 110, .8))";
    return `
      <article class="admin-job-card">
        <div class="admin-job-banner" style="--job-banner: ${bannerStyle}">
          <div class="admin-job-logo">${item.logo ? `<img src="${item.logo}" alt="${escapeHtml(item.companyName)} logo" />` : escapeHtml(initials(item.companyName))}</div>
          <div>
            <h4>${escapeHtml(item.jobRole)}</h4>
            <p>${escapeHtml(item.companyName)} | ${escapeHtml(item.block)}, ${escapeHtml(item.district)}, ${escapeHtml(item.state)}, ${escapeHtml(item.country)}</p>
          </div>
          <span class="job-pill ${item.status === "Open" ? "open" : "closed"}">${escapeHtml(item.status)}</span>
        </div>
        <div class="admin-job-body">
          <div class="job-meta">
            ${item.urgent ? `<span class="job-pill urgent">Urgent hiring</span>` : ""}
            <span class="job-pill">${escapeHtml(item.salary)}</span>
            <span class="job-pill">${escapeHtml(item.experience)}</span>
            <span class="job-pill">${applicants} applicants</span>
            <span class="job-pill">${escapeHtml(item.layout)} layout</span>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <p>Contact: ${escapeHtml(item.contactName)} | ${escapeHtml(item.contactPhone)}${item.contactEmail ? ` | ${escapeHtml(item.contactEmail)}` : ""}</p>
          <div class="job-actions">
            <button class="tiny-button" type="button" data-toggle-urgent="${item.id}">${item.urgent ? "Remove urgent" : "Mark urgent"}</button>
            <button class="tiny-button" type="button" data-toggle-status="${item.id}">${item.status === "Open" ? "Close job" : "Reopen job"}</button>
            <button class="tiny-button danger" type="button" data-delete-job="${item.id}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderApplications() {
    qs("#jobApplicationList").innerHTML = state.applications.map((application) => {
      const jobItem = state.jobs.find((item) => item.id === application.jobId);
      return `
        <article class="application-card">
          <div>
            <h4>${escapeHtml(application.name)} <span class="job-pill">${escapeHtml(application.status || "New")}</span></h4>
            <p>${escapeHtml(jobItem?.jobRole || "Unknown job")} at ${escapeHtml(jobItem?.companyName || "Company")}</p>
            <p>${escapeHtml(application.phone)} | ${escapeHtml(application.location)} | Resume: ${escapeHtml(application.resumeName || "Not uploaded")}</p>
          </div>
          <div class="job-actions">
            <button class="tiny-button" type="button" data-mark-application="${application.id}">Reviewed</button>
            <button class="tiny-button danger" type="button" data-delete-application="${application.id}">Remove</button>
          </div>
        </article>
      `;
    }).join("") || emptyCard("No applications yet", "Public website applications will appear here.");
  }

  function emptyCard(title, detail) {
    return `
      <article class="application-card">
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
    renderPostLocationControls();
    renderFilters();
    renderJobs();
    renderApplications();
  }

  async function createJob(form) {
    const data = new FormData(form);
    const logo = await readImage(form.elements.logo.files[0]);
    const banner = await readImage(form.elements.banner.files[0]);
    const item = job({
      companyName: String(data.get("companyName")).trim(),
      country: String(data.get("country")).trim(),
      state: String(data.get("state")),
      district: String(data.get("district")).trim(),
      block: String(data.get("block")).trim(),
      jobRole: String(data.get("jobRole")).trim(),
      salary: String(data.get("salary")).trim(),
      experience: String(data.get("experience")).trim(),
      contactName: String(data.get("contactName")).trim(),
      contactPhone: String(data.get("contactPhone")).trim(),
      contactEmail: String(data.get("contactEmail")).trim(),
      description: String(data.get("description")).trim(),
      urgent: Boolean(data.get("urgent")),
      layout: String(data.get("layout")),
      logo,
      banner
    });
    state.jobs.unshift(item);
    form.reset();
    activeView = "manage";
    saveState();
    renderAll();
  }

  function seedJobs() {
    if (!confirm("Load demo career jobs? This will replace current job prototype data.")) return;
    state = defaultState();
    adminSearch = "";
    adminCountryFilter = "All";
    adminStateFilter = "All";
    adminDistrictFilter = "All";
    activeView = "manage";
    saveState();
    renderAll();
  }

  function handleRootClick(event) {
    const viewButton = event.target.closest("[data-jobs-view]");
    if (viewButton) {
      activeView = viewButton.dataset.jobsView;
      renderAll();
    }

    const urgentButton = event.target.closest("[data-toggle-urgent]");
    if (urgentButton) {
      const item = state.jobs.find((jobItem) => jobItem.id === urgentButton.dataset.toggleUrgent);
      if (!item) return;
      item.urgent = !item.urgent;
      saveState();
      renderAll();
    }

    const statusButton = event.target.closest("[data-toggle-status]");
    if (statusButton) {
      const item = state.jobs.find((jobItem) => jobItem.id === statusButton.dataset.toggleStatus);
      if (!item) return;
      item.status = item.status === "Open" ? "Closed" : "Open";
      saveState();
      renderAll();
    }

    const deleteButton = event.target.closest("[data-delete-job]");
    if (deleteButton) {
      const item = state.jobs.find((jobItem) => jobItem.id === deleteButton.dataset.deleteJob);
      if (!item || !confirm(`Delete ${item.jobRole}?`)) return;
      state.jobs = state.jobs.filter((jobItem) => jobItem.id !== item.id);
      state.applications = state.applications.filter((application) => application.jobId !== item.id);
      saveState();
      renderAll();
    }

    const markButton = event.target.closest("[data-mark-application]");
    if (markButton) {
      const application = state.applications.find((item) => item.id === markButton.dataset.markApplication);
      if (!application) return;
      application.status = "Reviewed";
      saveState();
      renderAll();
    }

    const deleteApplication = event.target.closest("[data-delete-application]");
    if (deleteApplication) {
      state.applications = state.applications.filter((application) => application.id !== deleteApplication.dataset.deleteApplication);
      saveState();
      renderAll();
    }
  }

  function bindEvents() {
    qs("#jobPostForm").addEventListener("submit", (event) => {
      event.preventDefault();
      createJob(event.currentTarget);
    });

    qs("#adminJobSearch").addEventListener("input", (event) => {
      adminSearch = event.currentTarget.value;
      renderJobs();
    });

    qs("#jobCountrySelect").addEventListener("change", () => {
      qs("#jobStateSelect").value = "";
      qs("#jobDistrictSelect").value = "";
      renderPostLocationControls();
    });

    qs("#jobStateSelect").addEventListener("change", () => {
      qs("#jobDistrictSelect").value = "";
      renderPostLocationControls();
    });

    qs("#adminJobCountryFilter").addEventListener("change", (event) => {
      adminCountryFilter = event.currentTarget.value;
      adminStateFilter = "All";
      adminDistrictFilter = "All";
      renderFilters();
      renderJobs();
    });

    qs("#adminJobStateFilter").addEventListener("change", (event) => {
      adminStateFilter = event.currentTarget.value;
      adminDistrictFilter = "All";
      renderFilters();
      renderJobs();
    });

    qs("#adminJobDistrictFilter").addEventListener("change", (event) => {
      adminDistrictFilter = event.currentTarget.value;
      renderJobs();
    });

    qs("#seedJobsButton").addEventListener("click", seedJobs);
    root.removeEventListener("click", handleRootClick);
    root.addEventListener("click", handleRootClick);
  }

  function init(mount) {
    root = mount;
    state = loadState();
    renderAll();
    bindEvents();
    LOCATION_API.load().then(() => {
      if (!root) return;
      renderAll();
    });
  }

  return { init };
})();
