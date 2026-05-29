const DEMO_EMAIL = "rashmiranjanabc241947@gmail.com";
const DEMO_PASSWORD = "Rashmi@123";
const SESSION_KEY = "smartHotelPrototypeSession";

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

const services = {
  overview: {
    title: "Operations Overview",
    folder: "overview",
    file: "overview"
  },
  booking: {
    title: "Restaurant Table Booking",
    folder: "table-booking",
    file: "table-booking"
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

function getServicePath(service, extension) {
  return `services/${service.folder}/${service.file}.${extension}`;
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
  if (loadedServiceStyles.has(id)) return;
  const service = services[id];
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = getServicePath(service, "css");
  link.dataset.serviceStyle = id;
  document.head.append(link);
  loadedServiceStyles.add(id);
}

function ensureServiceScript(id) {
  if (loadedServiceScripts.has(id)) return Promise.resolve();
  const service = services[id];
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = getServicePath(service, "js");
    script.defer = true;
    script.dataset.serviceScript = id;
    script.addEventListener("load", () => {
      loadedServiceScripts.add(id);
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Unable to load ${service.file}.js`)));
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

window.smartHotelServices = window.smartHotelServices || {};
showPublic();
