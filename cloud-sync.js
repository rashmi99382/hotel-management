(() => {
  const KEY_TO_MODULE = {
    smartQrMenuSystemState: "qr-menu",
    smartTableBookingCustomerState: "table-booking",
    smartInventoryCostSystemState: "inventory",
    smartAttendanceSystemState: "attendance",
    smartHotelCareerPlatformState: "jobs",
    smartBillingQrTransferState: "billing-files",
    smartBillDownloadSettings: "bill-settings",
    smartHotelAdminProfile: "admin-profile",
    smartHotelSubscriptionStatus: "subscription",
    smartHotelPrototypeOwnerAccount: "owner-account"
  };

  const SESSION_EMAIL_KEY = "smartHotelPrototypeSessionEmail";
  const OWNER_ACCOUNT_KEY = "smartHotelPrototypeOwnerAccount";
  const DEFAULT_EMAIL = "rashmiranjanabc241947@gmail.com";
  const nativeGetItem = Storage.prototype.getItem;
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;
  const syncTimers = new Map();
  let tenantId = resolveTenantId();
  let readyPromise = null;

  function localGet(key) {
    try {
      return nativeGetItem.call(localStorage, key);
    } catch {
      return null;
    }
  }

  function localSet(key, value) {
    nativeSetItem.call(localStorage, key, value);
  }

  function parseJson(value, fallback = {}) {
    try {
      return JSON.parse(value || "");
    } catch {
      return fallback;
    }
  }

  function hasContent(value) {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.length > 0;
    return Object.keys(value).length > 0;
  }

  function normalizeTenant(value) {
    const raw = String(value || DEFAULT_EMAIL).trim();
    if (/^[a-z0-9]{16,}$/i.test(raw) && !raw.includes("@")) return raw.toLowerCase();
    return raw
      .toLowerCase()
      .replace(/@/g, "-at-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "smart-hotel-demo";
  }

  function resolveTenantId() {
    const params = new URLSearchParams(window.location.search);
    const hotelParam = params.get("hotel");
    if (hotelParam) return normalizeTenant(hotelParam);

    const sessionEmail = localGet(SESSION_EMAIL_KEY);
    if (sessionEmail) return normalizeTenant(sessionEmail);

    const owner = parseJson(localGet(OWNER_ACCOUNT_KEY), {});
    return normalizeTenant(owner.email || DEFAULT_EMAIL);
  }

  function apiBase() {
    const configured = window.SMART_HOTEL_API_BASE || localGet("smartHotelApiBase");
    if (configured) return String(configured).replace(/\/+$/, "");
    if (["4173", "5173", "5500"].includes(window.location.port)) return "http://127.0.0.1:8080";
    return "";
  }

  function authToken() {
    return [
      "smartHotelCognitoAccessToken",
      "smartHotelCognitoIdToken",
      "cognitoAccessToken",
      "cognitoIdToken",
      "accessToken",
      "idToken"
    ].map(localGet).find(Boolean);
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    };
    const token = authToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `API request failed: ${response.status}`);
    }
    return response.json();
  }

  function qrAliasIds(data) {
    const hotel = data?.hotel || {};
    const candidates = [
      data?.qrId,
      data?.secureQrId,
      data?.hotelId,
      hotel.qrId,
      hotel.secureQrId,
      hotel.secureId,
      hotel.hotelId,
      hotel.id
    ];
    if (hotel.qrUrl) {
      try {
        const url = new URL(hotel.qrUrl, window.location.href);
        candidates.push(url.searchParams.get("hotel"));
      } catch {
        /* keep normal flow */
      }
    }
    return [...new Set(candidates.filter(Boolean).map(normalizeTenant))]
      .filter((id) => id && id !== tenantId);
  }

  async function saveState(key, rawValue) {
    const moduleName = KEY_TO_MODULE[key];
    if (!moduleName) return;
    const parsed = parseJson(rawValue, { value: rawValue });
    await apiFetch(`/api/tenants/${encodeURIComponent(tenantId)}/state/${encodeURIComponent(moduleName)}`, {
      method: "PUT",
      body: JSON.stringify(parsed)
    });

    if (key === "smartQrMenuSystemState") {
      await Promise.allSettled(qrAliasIds(parsed).map((aliasId) => (
        apiFetch(`/api/tenants/${encodeURIComponent(aliasId)}/state/qr-menu`, {
          method: "PUT",
          body: JSON.stringify(parsed)
        })
      )));
    }
  }

  function scheduleSave(key, rawValue) {
    if (!KEY_TO_MODULE[key]) return;
    clearTimeout(syncTimers.get(key));
    syncTimers.set(key, setTimeout(() => {
      saveState(key, rawValue).catch((error) => {
        console.warn("Cloud sync save skipped:", key, error.message);
      });
    }, 450));
  }

  async function hydrateKey(key, moduleName) {
    const data = await apiFetch(`/api/tenants/${encodeURIComponent(tenantId)}/state/${encodeURIComponent(moduleName)}`);
    if (hasContent(data)) localSet(key, JSON.stringify(data));
  }

  async function hydratePublicQr() {
    const params = new URLSearchParams(window.location.search);
    const hotelParam = params.get("hotel");
    if (!hotelParam) return;
    const data = await apiFetch(`/api/public/qr/${encodeURIComponent(normalizeTenant(hotelParam))}`);
    if (hasContent(data)) localSet("smartQrMenuSystemState", JSON.stringify(data));
  }

  function hydrate(options = {}) {
    if (readyPromise && !options.force) return readyPromise;
    readyPromise = (async () => {
      try {
        if (window.location.pathname.includes("/services/qr-menu/customer.html")) {
          await hydratePublicQr();
        } else {
          await Promise.allSettled(
            Object.entries(KEY_TO_MODULE).map(([key, moduleName]) => hydrateKey(key, moduleName))
          );
        }
      } catch (error) {
        console.warn("Cloud sync hydrate skipped:", error.message);
      } finally {
        window.dispatchEvent(new CustomEvent("smartHotelCloudReady", { detail: { tenantId } }));
      }
    })();
    return readyPromise;
  }

  async function uploadFile(file, folder = "uploads") {
    if (!file) return "";
    const payload = {
      tenantId,
      folder,
      fileName: file.name || `upload-${Date.now()}`,
      contentType: file.type || "application/octet-stream"
    };
    const { uploadUrl, publicUrl } = await apiFetch("/api/uploads/presign", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": payload.contentType },
      body: file
    });
    if (!response.ok) throw new Error(`S3 upload failed: ${response.status}`);
    return publicUrl;
  }

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    nativeSetItem.call(this, key, value);
    if (this === localStorage) scheduleSave(String(key), String(value));
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    nativeRemoveItem.call(this, key);
    if (this === localStorage && KEY_TO_MODULE[key]) scheduleSave(String(key), "{}");
  };

  window.smartHotelCloudStorage = {
    ready: hydrate(),
    hydrate,
    tenantId: () => tenantId,
    setTenantEmail: async (email) => {
      tenantId = normalizeTenant(email || DEFAULT_EMAIL);
      return hydrate({ force: true });
    },
    saveState,
    uploadFile,
    apiBase
  };
})();
