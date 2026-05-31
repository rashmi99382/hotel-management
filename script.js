const DEMO_EMAIL = "rashmiranjanabc241947@gmail.com";
const DEMO_PASSWORD = "Rashmi@123";
const SESSION_KEY = "smartHotelPrototypeSession";
const ASSET_VERSION = "qr-pdf-work-v2";

const publicView = document.querySelector("#publicView");
const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const userEmail = document.querySelector("#userEmail");
const pageTitle = document.querySelector("#pageTitle");
const logoutButton = document.querySelector("#logoutButton");
const backToSiteButton = document.querySelector("#backToSiteButton");
const serviceHost = document.querySelector("#serviceHost");
const navItems = document.querySelectorAll("[data-section-link]");
const CAREER_KEY = "smartHotelCareerPlatformState";
const LOCATION_DATA_URL = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries+states+cities.json";

const FALLBACK_LOCATIONS = [
  {
    country: "India",
    states: [
      { state: "Odisha", districts: ["Angul", "Balasore", "Bhadrak", "Cuttack", "Ganjam", "Jagatsinghpur", "Jajpur", "Kendrapara", "Khordha", "Mayurbhanj", "Puri", "Sambalpur", "Sundargarh"] },
      { state: "West Bengal", districts: ["Darjeeling", "Hooghly", "Howrah", "Kolkata", "North 24 Parganas", "South 24 Parganas"] },
      { state: "Jharkhand", districts: ["Bokaro", "Deoghar", "Dhanbad", "Jamshedpur", "Ranchi"] },
      { state: "Bihar", districts: ["Bhagalpur", "Gaya", "Muzaffarpur", "Patna", "Purnia"] },
      { state: "Telangana", districts: ["Hyderabad", "Karimnagar", "Rangareddy", "Warangal"] },
      { state: "Maharashtra", districts: ["Mumbai", "Nagpur", "Nashik", "Pune", "Thane"] },
      { state: "Delhi", districts: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "South Delhi"] },
      { state: "Karnataka", districts: ["Bengaluru Urban", "Mangaluru", "Mysuru", "Udupi"] },
      { state: "Tamil Nadu", districts: ["Chennai", "Coimbatore", "Madurai", "Salem"] },
      { state: "Kerala", districts: ["Ernakulam", "Kochi", "Kozhikode", "Thiruvananthapuram"] }
    ]
  },
  {
    country: "United States",
    states: [
      { state: "California", districts: ["Los Angeles", "San Diego", "San Francisco", "San Jose"] },
      { state: "Florida", districts: ["Jacksonville", "Miami", "Orlando", "Tampa"] },
      { state: "New York", districts: ["Albany", "Brooklyn", "Manhattan", "Queens"] },
      { state: "Texas", districts: ["Austin", "Dallas", "Houston", "San Antonio"] }
    ]
  },
  {
    country: "United Kingdom",
    states: [
      { state: "England", districts: ["Birmingham", "London", "Manchester", "Liverpool"] },
      { state: "Scotland", districts: ["Aberdeen", "Edinburgh", "Glasgow"] },
      { state: "Wales", districts: ["Cardiff", "Swansea"] }
    ]
  },
  {
    country: "United Arab Emirates",
    states: [
      { state: "Abu Dhabi", districts: ["Abu Dhabi", "Al Ain"] },
      { state: "Dubai", districts: ["Bur Dubai", "Deira", "Downtown Dubai", "Jumeirah"] },
      { state: "Sharjah", districts: ["Al Majaz", "Al Nahda", "Sharjah"] }
    ]
  },
  {
    country: "Canada",
    states: [
      { state: "British Columbia", districts: ["Vancouver", "Victoria"] },
      { state: "Ontario", districts: ["Ottawa", "Toronto"] },
      { state: "Quebec", districts: ["Montreal", "Quebec City"] }
    ]
  },
  {
    country: "Australia",
    states: [
      { state: "New South Wales", districts: ["Newcastle", "Sydney"] },
      { state: "Queensland", districts: ["Brisbane", "Gold Coast"] },
      { state: "Victoria", districts: ["Geelong", "Melbourne"] }
    ]
  },
  { country: "Singapore", states: [{ state: "Singapore", districts: ["Central", "East", "North", "West"] }] },
  { country: "Qatar", states: [{ state: "Doha", districts: ["Al Sadd", "Lusail", "The Pearl"] }] },
  { country: "Saudi Arabia", states: [{ state: "Riyadh", districts: ["Al Olaya", "Diriyah", "Riyadh"] }, { state: "Makkah", districts: ["Jeddah", "Mecca"] }] },
  { country: "Nepal", states: [{ state: "Bagmati", districts: ["Bhaktapur", "Kathmandu", "Lalitpur"] }] },
  { country: "Bangladesh", states: [{ state: "Dhaka", districts: ["Dhaka", "Gazipur", "Narayanganj"] }, { state: "Chattogram", districts: ["Chattogram", "Cox's Bazar"] }] },
  { country: "Sri Lanka", states: [{ state: "Western", districts: ["Colombo", "Gampaha"] }, { state: "Central", districts: ["Kandy", "Matale"] }] }
];

function careerUid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
}

function careerNow() {
  return new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function defaultCareerJob(input) {
  return {
    id: careerUid("job"),
    companyName: input.companyName,
    country: input.country || "India",
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
    logo: "",
    banner: "",
    urgent: Boolean(input.urgent),
    layout: input.layout || "professional",
    status: "Open",
    createdAt: careerNow()
  };
}

function defaultCareerState() {
  return {
    jobs: [
      defaultCareerJob({
        companyName: "Smart Palace Hotel",
        jobRole: "Waiter, Room Service Staff",
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
      defaultCareerJob({
        companyName: "Coastal Food Court",
        jobRole: "Cook, Kitchen Helper",
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
      defaultCareerJob({
        companyName: "Metro Stay",
        jobRole: "Front Desk Executive",
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

function sortUnique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function mergeLocationValues(primary, secondary) {
  return sortUnique([...(primary || []), ...(secondary || [])]);
}

function inferCountryFromState(state) {
  const match = FALLBACK_LOCATIONS.find((country) => country.states.some((item) => item.state === state));
  return match?.country || "India";
}

function normalizeCareerJob(job) {
  return {
    ...job,
    country: job.country || inferCountryFromState(job.state),
    state: job.state || "",
    district: job.district || "",
    block: job.block || "",
    status: job.status || "Open"
  };
}

function normalizeLocationDirectory(rawCountries) {
  return rawCountries.map((country) => ({
    country: String(country.name || country.country || "").trim(),
    states: (country.states || []).map((state) => ({
      state: String(state.name || state.state || "").trim(),
      districts: sortUnique((state.cities || state.districts || []).map((city) => city.name || city))
    })).filter((state) => state.state)
  })).filter((country) => country.country).sort((a, b) => a.country.localeCompare(b.country));
}

function createLocationDirectory() {
  let data = normalizeLocationDirectory(FALLBACK_LOCATIONS);
  let loadPromise = null;

  function findCountry(countryName) {
    return data.find((item) => item.country === countryName);
  }

  function findState(countryName, stateName) {
    return findCountry(countryName)?.states.find((item) => item.state === stateName);
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(LOCATION_DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Location directory unavailable");
        return response.json();
      })
      .then((raw) => {
        const normalized = normalizeLocationDirectory(raw);
        if (normalized.length) data = normalized;
        return data;
      })
      .catch(() => data);
    return loadPromise;
  }

  return {
    load,
    countries: () => data.map((item) => item.country),
    statesFor: (countryName) => findCountry(countryName)?.states.map((item) => item.state) || [],
    districtsFor: (countryName, stateName) => findState(countryName, stateName)?.districts || []
  };
}

window.smartHotelLocationDirectory = window.smartHotelLocationDirectory || createLocationDirectory();

let careerState = loadCareerState();
let selectedCareerJobId = "";

function loadCareerState() {
  try {
    const stored = localStorage.getItem(CAREER_KEY);
    if (!stored) return defaultCareerState();
    const parsed = JSON.parse(stored);
    const fallback = defaultCareerState();
    return {
      ...fallback,
      ...parsed,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs.map(normalizeCareerJob) : fallback.jobs,
      applications: Array.isArray(parsed.applications) ? parsed.applications : []
    };
  } catch {
    return defaultCareerState();
  }
}

function saveCareerState() {
  localStorage.setItem(CAREER_KEY, JSON.stringify(careerState));
}

function escapePublicHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function careerInitials(value) {
  return String(value || "Company").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

const services = {
  overview: {
    title: "Operations Overview",
    folder: "overview",
    file: "overview"
  },
  booking: {
    title: "Booking",
    folder: "table-booking",
    file: "table-booking",
    extraStyles: ["table-booking-map"],
    extraScripts: ["table-booking-map"]
  },
  menu: {
    title: "QR Restaurant Menu",
    folder: "qr-menu",
    file: "qr-menu"
  },
  inventory: {
    title: "Inventory & Cost Management",
    folder: "inventory",
    file: "inventory"
  },
  attendance: {
    title: "Smart Attendance",
    folder: "attendance",
    file: "attendance"
  },
  billing: {
    title: "Billing & QR File Transfer",
    folder: "billing-files",
    file: "billing-files"
  },
  jobs: {
    title: "Inbuilt Job Platform",
    folder: "jobs",
    file: "jobs"
  }
};

const loadedServiceScripts = new Set();
const loadedServiceStyles = new Set();

function getServiceAssetPath(service, file, extension) {
  return `services/${service.folder}/${file}.${extension}?v=${ASSET_VERSION}`;
}

function getServicePath(service, extension) {
  return getServiceAssetPath(service, service.file, extension);
}

function selectedServiceFromHash() {
  const hash = window.location.hash.replace("#", "");
  return services[hash] ? hash : "overview";
}

function showApp() {
  publicView.classList.add("is-hidden");
  loginView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  userEmail.textContent = DEMO_EMAIL;
}

function showLogin() {
  publicView.classList.add("is-hidden");
  appView.classList.add("is-hidden");
  loginView.classList.remove("is-hidden");
  loginError.textContent = "";
}

function showPublic() {
  loginView.classList.add("is-hidden");
  appView.classList.add("is-hidden");
  publicView.classList.remove("is-hidden");
}

function ensureServiceStyle(id) {
  const service = services[id];
  [service.file, ...(service.extraStyles || [])].forEach((file) => {
    const key = `${id}:${file}`;
    if (loadedServiceStyles.has(key)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getServiceAssetPath(service, file, "css");
    link.dataset.serviceStyle = key;
    document.head.append(link);
    loadedServiceStyles.add(key);
  });
}

function ensureServiceScript(id) {
  const service = services[id];
  const scriptFiles = [...(service.extraScripts || []), service.file];
  return scriptFiles.reduce((chain, file) => chain.then(() => ensureServiceScriptFile(id, service, file)), Promise.resolve());
}

function ensureServiceScriptFile(id, service, file) {
  const key = `${id}:${file}`;
  if (loadedServiceScripts.has(key)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = getServiceAssetPath(service, file, "js");
    script.defer = true;
    script.dataset.serviceScript = key;
    script.addEventListener("load", () => {
      loadedServiceScripts.add(key);
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Unable to load ${file}.js`)));
    document.body.append(script);
  });
}

async function loadService(id) {
  const service = services[id] || services.overview;
  ensureServiceStyle(id);
  serviceHost.innerHTML = `
    <section class="service-section is-active">
      <article class="panel">
        <div class="panel-heading">
          <h2>Loading ${service.title}</h2>
          <span>Please wait</span>
        </div>
      </article>
    </section>
  `;

  try {
    const response = await fetch(getServicePath(service, "html"));
    if (!response.ok) throw new Error(`Unable to load ${service.file}.html`);
    serviceHost.innerHTML = await response.text();
    await ensureServiceScript(id);
    window.smartHotelServices?.[id]?.init?.(serviceHost);
  } catch (error) {
    serviceHost.innerHTML = `
      <section class="service-section is-active">
        <article class="panel">
          <div class="panel-heading">
            <h2>Service could not load</h2>
            <span>${service.title}</span>
          </div>
          <p class="helper-text">${error.message}</p>
        </article>
      </section>
    `;
  }
}

async function setSection(id) {
  const nextId = services[id] ? id : "overview";
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.sectionLink === nextId);
  });
  pageTitle.textContent = services[nextId].title;
  if (!appView.classList.contains("is-hidden")) {
    history.replaceState(null, "", `#${nextId}`);
  }
  await loadService(nextId);
}

function selectOptionHtml(value, label, selectedValue) {
  const selected = value === selectedValue ? " selected" : "";
  return `<option value="${escapePublicHtml(value)}"${selected}>${escapePublicHtml(label)}</option>`;
}

function setSelectOptions(select, options, allLabel, selectedValue = "All") {
  const values = sortUnique(options);
  const safeSelected = selectedValue !== "All" && values.includes(selectedValue) ? selectedValue : "All";
  select.innerHTML = [
    selectOptionHtml("All", allLabel, safeSelected),
    ...values.map((value) => selectOptionHtml(value, value, safeSelected))
  ].join("");
  select.value = safeSelected;
}

function jobCountries() {
  return sortUnique(careerState.jobs.map((job) => job.country));
}

function jobStates(country) {
  return sortUnique(careerState.jobs
    .filter((job) => country === "All" || job.country === country)
    .map((job) => job.state));
}

function jobDistricts(country, state) {
  return sortUnique(careerState.jobs
    .filter((job) => country === "All" || job.country === country)
    .filter((job) => state === "All" || job.state === state)
    .map((job) => job.district));
}

function renderCareerLocationFilters() {
  const countrySelect = document.querySelector("#careerCountryFilter");
  const stateSelect = document.querySelector("#careerStateFilter");
  const districtSelect = document.querySelector("#careerDistrictFilter");
  if (!countrySelect || !stateSelect || !districtSelect) return;

  const directory = window.smartHotelLocationDirectory;
  const previousCountry = countrySelect.value || "All";
  const previousState = stateSelect.value || "All";
  const previousDistrict = districtSelect.value || "All";
  const countries = mergeLocationValues(directory.countries(), jobCountries());
  setSelectOptions(countrySelect, countries, "All countries", previousCountry);

  const selectedCountry = countrySelect.value;
  const directoryStates = selectedCountry === "All" ? [] : directory.statesFor(selectedCountry);
  const states = mergeLocationValues(directoryStates, jobStates(selectedCountry));
  setSelectOptions(stateSelect, states, "All states", previousState);

  const selectedState = stateSelect.value;
  const directoryDistricts = selectedCountry === "All" || selectedState === "All" ? [] : directory.districtsFor(selectedCountry, selectedState);
  const districts = mergeLocationValues(directoryDistricts, jobDistricts(selectedCountry, selectedState));
  setSelectOptions(districtSelect, districts, "All districts", previousDistrict);
}

function filteredPublicJobs() {
  const search = document.querySelector("#careerSearchInput")?.value?.toLowerCase() || "";
  const country = document.querySelector("#careerCountryFilter")?.value || "All";
  const state = document.querySelector("#careerStateFilter")?.value || "All";
  const district = document.querySelector("#careerDistrictFilter")?.value || "All";
  return careerState.jobs.filter((job) => {
    const haystack = `${job.companyName} ${job.jobRole} ${job.country} ${job.state} ${job.district} ${job.block}`.toLowerCase();
    return job.status === "Open"
      && (country === "All" || job.country === country)
      && (state === "All" || job.state === state)
      && (district === "All" || job.district === district)
      && haystack.includes(search);
  });
}

function publicJobCard(job) {
  const banner = job.banner ? `url('${job.banner}')` : "linear-gradient(135deg, rgba(37, 99, 235, .92), rgba(15, 159, 110, .84))";
  const phone = String(job.contactPhone || "").replace(/\D/g, "");
  const message = encodeURIComponent(`Hello ${job.companyName}, I want to apply for ${job.jobRole}.`);
  return `
    <article class="career-job-card ${job.layout === "premium" ? "is-premium" : ""}">
      <div class="career-job-banner" style="--career-banner: ${banner}">
        <div class="career-logo">${job.logo ? `<img src="${job.logo}" alt="${escapePublicHtml(job.companyName)} logo" />` : escapePublicHtml(careerInitials(job.companyName))}</div>
        <div>
          <h3>${escapePublicHtml(job.jobRole)}</h3>
          <p>${escapePublicHtml(job.companyName)}</p>
        </div>
      </div>
      <div class="career-job-body">
        <div class="career-meta">
          ${job.urgent ? `<span class="career-pill urgent">Urgent hiring</span>` : ""}
          <span class="career-pill">${escapePublicHtml(job.salary)}</span>
          <span class="career-pill">${escapePublicHtml(job.experience)}</span>
        </div>
        <p>${escapePublicHtml(job.block)}, ${escapePublicHtml(job.district)}, ${escapePublicHtml(job.state)}, ${escapePublicHtml(job.country)}</p>
        <p>${escapePublicHtml(job.description)}</p>
        <div class="career-card-actions">
          <button class="button primary" type="button" data-career-apply="${job.id}">Apply now</button>
          <a href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noreferrer">Contact</a>
        </div>
      </div>
    </article>
  `;
}

function renderPublicCareers() {
  const list = document.querySelector("#publicCareerJobs");
  if (!list) return;
  careerState = loadCareerState();
  if (!localStorage.getItem(CAREER_KEY)) saveCareerState();
  renderCareerLocationFilters();
  const jobs = filteredPublicJobs();
  list.innerHTML = jobs.map(publicJobCard).join("") || `
    <article class="career-job-card">
      <div class="career-job-body">
        <h3>No jobs found</h3>
        <p>Try another state, district, block or role.</p>
      </div>
    </article>
  `;
}

function selectCareerJob(jobId) {
  const job = careerState.jobs.find((item) => item.id === jobId);
  if (!job) return;
  selectedCareerJobId = jobId;
  document.querySelector("#careerApplyTitle").textContent = job.jobRole;
  document.querySelector("#careerApplyCompany").textContent = `${job.companyName} | ${job.block}, ${job.district}, ${job.state}, ${job.country}`;
  document.querySelector("#careerApplyForm").elements.jobId.value = jobId;
  document.querySelector("#careerApplyMessage").textContent = "";
  document.querySelector("#careerApplyPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function submitCareerApplication(form) {
  const formData = new FormData(form);
  const jobId = String(formData.get("jobId") || selectedCareerJobId);
  const job = careerState.jobs.find((item) => item.id === jobId);
  if (!job) {
    document.querySelector("#careerApplyMessage").textContent = "Select a job first.";
    return;
  }
  const resume = form.elements.resume.files[0];
  careerState.applications.unshift({
    id: careerUid("app"),
    jobId,
    name: String(formData.get("name")).trim(),
    phone: String(formData.get("phone")).trim(),
    location: String(formData.get("location")).trim(),
    resumeName: resume?.name || "",
    appliedAt: careerNow(),
    status: "New"
  });
  saveCareerState();
  document.querySelector("#careerApplyMessage").textContent = `Application sent to ${job.companyName}.`;
  form.reset();
  selectedCareerJobId = "";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email")).trim();
  const password = String(formData.get("password"));

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem(SESSION_KEY, "active");
    loginError.textContent = "";
    loginForm.reset();
    showApp();
    await setSection(selectedServiceFromHash());
    return;
  }

  loginError.textContent = "Invalid Gmail or password.";
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showPublic();
});

navItems.forEach((item) => {
  item.addEventListener("click", async (event) => {
    event.preventDefault();
    await setSection(event.currentTarget.dataset.sectionLink);
  });
});

document.querySelectorAll("[data-open-login], #openLoginButton").forEach((button) => {
  button.addEventListener("click", showLogin);
});

backToSiteButton.addEventListener("click", showPublic);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
  });
});

document.querySelector(".carousel-arrow.prev")?.addEventListener("click", () => {
  const carousel = document.querySelector("#businessCarousel");
  const card = carousel?.querySelector(".business-card");
  const amount = card ? card.getBoundingClientRect().width + 28 : 420;
  carousel?.scrollBy({ left: -amount, behavior: "smooth" });
});

document.querySelector(".carousel-arrow.next")?.addEventListener("click", () => {
  const carousel = document.querySelector("#businessCarousel");
  const card = carousel?.querySelector(".business-card");
  const amount = card ? card.getBoundingClientRect().width + 28 : 420;
  carousel?.scrollBy({ left: amount, behavior: "smooth" });
});

document.querySelector(".clear-button")?.addEventListener("click", () => {
  const input = document.querySelector(".generator-form input");
  input.value = "";
  input.focus();
});

document.querySelector("#careerSearchInput")?.addEventListener("input", renderPublicCareers);
document.querySelector("#careerCountryFilter")?.addEventListener("change", () => {
  const stateFilter = document.querySelector("#careerStateFilter");
  const districtFilter = document.querySelector("#careerDistrictFilter");
  if (stateFilter) stateFilter.value = "All";
  if (districtFilter) districtFilter.value = "All";
  renderPublicCareers();
});
document.querySelector("#careerStateFilter")?.addEventListener("change", () => {
  const districtFilter = document.querySelector("#careerDistrictFilter");
  if (districtFilter) districtFilter.value = "All";
  renderPublicCareers();
});
document.querySelector("#careerDistrictFilter")?.addEventListener("change", renderPublicCareers);
document.querySelector("#publicCareerJobs")?.addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-career-apply]");
  if (applyButton) selectCareerJob(applyButton.dataset.careerApply);
});
document.querySelector("#careerApplyForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCareerApplication(event.currentTarget);
});
window.addEventListener("smartHotelJobsUpdated", renderPublicCareers);

window.smartHotelServices = window.smartHotelServices || {};
renderPublicCareers();
window.smartHotelLocationDirectory.load().then(renderPublicCareers);
showPublic();
