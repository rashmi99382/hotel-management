const AUTH_DEMO_EMAIL = "rashmiranjanabc241947@gmail.com";
const AUTH_DEMO_PASSWORD = "Rashmi@123";
const AUTH_SESSION_KEY = "smartHotelPrototypeSession";
const AUTH_SESSION_EMAIL_KEY = "smartHotelPrototypeSessionEmail";
const AUTH_OWNER_ACCOUNT_KEY = "smartHotelPrototypeOwnerAccount";

const authMessage = document.querySelector("#authMessage");
const loginForm = document.querySelector("#authLoginForm");
const signupForm = document.querySelector("#authSignupForm");

function safeNextHash() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "#overview";
  return /^#[a-zA-Z0-9_-]+$/.test(next) ? next : "#overview";
}

function mainSiteUrl(hash = "#home") {
  return `index.html${hash}`;
}

function setAuthMessage(message, isSuccess = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.classList.toggle("is-success", isSuccess);
}

function readOwnerAccount() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_OWNER_ACCOUNT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSession(email) {
  localStorage.setItem(AUTH_SESSION_KEY, "active");
  localStorage.setItem(AUTH_SESSION_EMAIL_KEY, email);
}

function isValidLogin(email, password) {
  const owner = readOwnerAccount();
  return (email === AUTH_DEMO_EMAIL && password === AUTH_DEMO_PASSWORD)
    || (email === owner.email && password === owner.password);
}

function goToDashboard(email) {
  saveSession(email);
  window.location.href = mainSiteUrl(safeNextHash());
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!isValidLogin(email, password)) {
    setAuthMessage("Invalid Gmail or password.");
    return;
  }

  setAuthMessage("Login successful. Opening dashboard.", true);
  window.setTimeout(() => goToDashboard(email), 260);
});

signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!email.includes("@") || !email.includes(".")) {
    setAuthMessage("Enter a valid Gmail address.");
    return;
  }

  if (password.length < 6) {
    setAuthMessage("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    setAuthMessage("Password and confirm password do not match.");
    return;
  }

  localStorage.setItem(AUTH_OWNER_ACCOUNT_KEY, JSON.stringify({
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  }));
  setAuthMessage("Account created. Opening dashboard.", true);
  window.setTimeout(() => goToDashboard(email), 260);
});

document.querySelectorAll("[data-auth-back]").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = mainSiteUrl("#home");
  });
});
