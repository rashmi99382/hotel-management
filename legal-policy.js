(() => {
  const POLICY_LANGUAGE_KEY = "vistaCraftPublicLanguage";

  const languages = [
    ["en-IN", "English (India)"],
    ["en-US", "English (US)"],
    ["en-AU", "English (Australia)"],
    ["hi-IN", "Hindi"],
    ["or-IN", "Odia"],
    ["bn-IN", "Bengali"],
    ["ta-IN", "Tamil"],
    ["te-IN", "Telugu"],
    ["mr-IN", "Marathi"],
    ["gu-IN", "Gujarati"],
    ["pa-IN", "Punjabi"],
    ["ur-IN", "Urdu"],
    ["ar", "Arabic"],
    ["zh-CN", "Chinese"],
    ["ja-JP", "Japanese"],
    ["ko-KR", "Korean"],
    ["fr-FR", "French"],
    ["de-DE", "German"],
    ["es-ES", "Spanish"],
    ["pt-BR", "Portuguese"],
    ["ru-RU", "Russian"],
    ["it-IT", "Italian"],
    ["nl-NL", "Nederlands (Nederland)"],
    ["nl-BE", "Nederlands (Belgie)"],
    ["da-DK", "Dansk"],
    ["cs-CZ", "Cestina"],
    ["hr-HR", "Hrvatski"],
    ["sv-SE", "Swedish"],
    ["tr-TR", "Turkish"],
    ["th-TH", "Thai"],
    ["vi-VN", "Vietnamese"],
    ["id-ID", "Indonesian"],
    ["ms-MY", "Malay"],
    ["ne-NP", "Nepali"],
    ["si-LK", "Sinhala"],
    ["fa-IR", "Persian"],
    ["he-IL", "Hebrew"]
  ];

  const uiText = {
    "en-IN": {
      design: "Design",
      product: "Product",
      plans: "Plans",
      business: "Business",
      education: "Education",
      career: "Career",
      help: "Help",
      signup: "Sign up",
      login: "Log in",
      privacy: "Privacy",
      legal: "Legal",
      terms: "Terms",
      language: "Language settings"
    },
    "hi-IN": {
      design: "डिजाइन",
      product: "प्रोडक्ट",
      plans: "प्लान",
      business: "बिजनेस",
      education: "शिक्षा",
      career: "करियर",
      help: "सहायता",
      signup: "साइन अप",
      login: "लॉग इन",
      privacy: "गोपनीयता",
      legal: "कानूनी",
      terms: "शर्तें",
      language: "भाषा सेटिंग"
    },
    "or-IN": {
      design: "ଡିଜାଇନ",
      product: "ପ୍ରଡକ୍ଟ",
      plans: "ପ୍ଲାନ",
      business: "ବ୍ୟବସାୟ",
      education: "ଶିକ୍ଷା",
      career: "କ୍ୟାରିୟର",
      help: "ସହାୟତା",
      signup: "ସାଇନ୍ ଅପ୍",
      login: "ଲଗ୍ ଇନ୍",
      privacy: "ଗୋପନୀୟତା",
      legal: "ଆଇନଗତ",
      terms: "ନିୟମ",
      language: "ଭାଷା ସେଟିଂ"
    },
    "bn-IN": {
      design: "ডিজাইন",
      product: "প্রোডাক্ট",
      plans: "প্ল্যান",
      business: "ব্যবসা",
      education: "শিক্ষা",
      career: "ক্যারিয়ার",
      help: "সহায়তা",
      signup: "সাইন আপ",
      login: "লগ ইন",
      privacy: "গোপনীয়তা",
      legal: "আইনি",
      terms: "শর্তাবলী",
      language: "ভাষা সেটিং"
    },
    "es-ES": {
      design: "Diseno",
      product: "Producto",
      plans: "Planes",
      business: "Negocio",
      education: "Educacion",
      career: "Carrera",
      help: "Ayuda",
      signup: "Registrarse",
      login: "Iniciar sesion",
      privacy: "Privacidad",
      legal: "Legal",
      terms: "Terminos",
      language: "Configuracion de idioma"
    },
    "fr-FR": {
      design: "Design",
      product: "Produit",
      plans: "Plans",
      business: "Business",
      education: "Education",
      career: "Carriere",
      help: "Aide",
      signup: "S'inscrire",
      login: "Connexion",
      privacy: "Confidentialite",
      legal: "Legal",
      terms: "Conditions",
      language: "Parametres de langue"
    },
    "ar": {
      design: "تصميم",
      product: "المنتج",
      plans: "الخطط",
      business: "الاعمال",
      education: "التعليم",
      career: "الوظائف",
      help: "المساعدة",
      signup: "تسجيل",
      login: "دخول",
      privacy: "الخصوصية",
      legal: "قانوني",
      terms: "الشروط",
      language: "اعدادات اللغة"
    },
    "zh-CN": {
      design: "设计",
      product: "产品",
      plans: "方案",
      business: "商业",
      education: "教育",
      career: "职业",
      help: "帮助",
      signup: "注册",
      login: "登录",
      privacy: "隐私",
      legal: "法律",
      terms: "条款",
      language: "语言设置"
    },
    "ja-JP": {
      design: "デザイン",
      product: "製品",
      plans: "プラン",
      business: "ビジネス",
      education: "教育",
      career: "キャリア",
      help: "ヘルプ",
      signup: "登録",
      login: "ログイン",
      privacy: "プライバシー",
      legal: "法務",
      terms: "利用規約",
      language: "言語設定"
    }
  };

  const privacySections = [
    ["What Our Service Provides", "VistaCraft helps hotel and restaurant owners manage Gmail login, profile updates, QR menus, food photos and videos, room photos and videos, commission-free booking support, inventory, attendance, live bills, and future services such as farmer supply, doctor service, decoration, plants, interior design, social media, photography, and videography."],
    ["Information We Collect", "We collect only the information needed to provide the service correctly. This can include owner account details, business details, menu content, room content, booking details, staff attendance, inventory, billing, and QR code information."],
    ["Owner Account Information", "Hotel and restaurant owners may provide owner name, business name, Gmail or email address, mobile number, restaurant or hotel name, business address, category, food details, room details, pricing, and service content."],
    ["Uploaded Business Content", "Owners may upload food photos, food videos, room photos, room videos, menu data, price details, business logo, bill design details, inventory records, staff details, booking availability, and other business content."],
    ["Customer Information", "Customers may enter name, mobile number, booking date, selected room or service, message, billing information, QR scan activity, and device details needed for security and service operation."],
    ["Staff and Attendance Information", "If attendance is enabled, the platform may store staff name, mobile number, role, attendance time, present or absent status, approval status, and work records."],
    ["Inventory and Billing Information", "Inventory and billing data may include stock details, raw material records, item purchase price, selling price, low-stock alerts, daily usage, bill numbers, bill amounts, tax details, PDF bill design, bill security code, and download history."],
    ["Future Farmer Supply Service", "When direct farmer-to-hotel or farmer-to-restaurant supply becomes active, order quantity, supplier details, delivery address, price, payment status, and delivery status may be collected for that selected service."],
    ["Future Personal and Business Services", "For future doctor, decoration, plant, interior, social media, photography, videography, or other services, we collect only the specific information required to deliver that service."],
    ["Information We Do Not Collect Without Permission", "We do not create random contact numbers, addresses, GST details, customer data, staff data, images, videos, or inventory records. If the user does not provide it, we do not invent it."],
    ["How We Use Your Information", "Information is used to create accounts, manage login, update profiles, generate QR codes, display menus and rooms, manage bookings, inventory, attendance, live bills, support, security, fraud prevention, and selected future services."],
    ["QR Code and Public Menu Information", "When owners create QR codes, customers see only information the owner chooses to publish, such as restaurant name, food item, image, video, price, description, category, room details, room media, and booking options."],
    ["No Commission on Hotel Booking", "Where the platform provides hotel room booking without commission, booking data is used only to connect customer and hotel and support the booking process."],
    ["Data Ownership", "Hotel and restaurant owners own the data they upload, including menu data, room media, inventory records, billing records, staff records, booking records, logo, business description, prices, and service details."],
    ["Customer Data Use", "Customer data belongs to the customer and the related hotel or restaurant. It is used only for booking confirmation, service delivery, customer support, billing, security, fraud prevention, and legal compliance."],
    ["Images, Videos, and Media Content", "Owners are responsible for ensuring uploaded media is real, lawful, not misleading, does not violate copyright, and does not misuse another person's image or private information."],
    ["Account Login and Gmail Login", "If Gmail or another login provider is used, we may receive name, email, profile image, and authentication ID only for login, account creation, and security."],
    ["Mobile Number Update", "A mobile number added by the owner may be used for account verification, booking communication, support, business communication, security alerts, and service messages."],
    ["Payment and Billing Information", "If paid services or subscriptions are added, payment may be processed through a third-party provider. We may store plan, payment status, invoice amount, billing details, and transaction reference."],
    ["Inventory Data", "Inventory data is private business information. It may include stock quantity, purchase price, selling price, supplier records, wastage, usage, profit, and cost information."],
    ["Staff Attendance Data", "Attendance data is controlled by the hotel or restaurant owner. We store and process it only to provide attendance management features."],
    ["Bill Security Code", "Bill security codes can help verify genuine bills and reduce fake bills. Verification data may include bill number, date, amount, business name, security code, and verification status."],
    ["Farmer Supply and Delivery Data", "Supply and delivery data is shared only with parties involved in the selected delivery, such as owner, farmer, supplier, delivery partner, payment provider, or support team."],
    ["Future Health Doctor Service", "Health information is sensitive. If future doctor service is used, health data is collected only when provided by the user and used only for consultation, appointment, delivery, support, safety, or legal need."],
    ["Future Design, Plant, Photography, Video and Social Media Services", "Service-specific photos, videos, site details, design preferences, branding details, booking date, communication details, and payment details are used only for the selected service."],
    ["Cookies and Tracking Technologies", "Cookies may be used to keep users logged in, remember preferences, improve speed, understand usage, improve security, detect errors, and improve user experience."],
    ["Device and Technical Information", "We may collect IP address, browser type, device type, operating system, pages visited, date and time, QR scan activity, error logs, and security logs for performance and security."],
    ["Location Information", "Approximate location from IP or user-provided details may be used for service display, booking, delivery, farmer supply, tax or pricing needs, security, and improvement."],
    ["Data Sharing", "We do not sell user data. Limited data may be shared only for hosting, storage, payments, email/SMS, WhatsApp communication, booking, delivery, support, security, fraud prevention, or legal compliance."],
    ["Third-Party Services", "The platform may use Google login, payment gateways, hosting, cloud storage, email, SMS, WhatsApp, analytics, maps, or delivery partners, each with its own policy."],
    ["WhatsApp Communication", "If WhatsApp sharing is enabled or requested, booking, billing, or service details may be processed by WhatsApp or related providers."],
    ["Data Security", "We use reasonable security measures such as login protection, authentication, access control, secure servers, monitoring, backups, and fraud detection, but no internet service is guaranteed 100 percent secure."],
    ["User Responsibilities", "Users must provide correct information, keep login safe, upload only lawful content, avoid fake or misleading content, not misuse customer data, and manage business content carefully."],
    ["Publicly Visible Information", "Information added to public QR menu or booking pages may be visible to customers. Owners should not upload private information publicly unless they want customers to see it."],
    ["Data Retention", "We keep data as long as needed for active account use, business records, billing records, legal compliance, security, backup, dispute resolution, and service improvement."],
    ["Account Deletion and Data Correction", "Users may request deletion or update account, mobile, business, menu, room, media, inventory, staff, and billing information where platform controls are available."],
    ["Children's Privacy and Marketing", "The service is mainly for business owners, staff, and customers, not children creating business accounts. Service messages may be sent; marketing messages may be controlled where available."],
    ["No Selling, Legal Requirements, Business Transfer, Changes and Contact", "We do not sell data. We may preserve or share information if required by law, fraud prevention, safety, or business transfer. Policy changes may be posted on the site. Contact details should be real business details only."]
  ];

  const legalSections = [
    ["About Our Service", "VistaCraft provides digital services mainly for hotel owners, restaurant owners, and related business owners, including login, mobile update, menu listing, QR code generation, room media, booking support, inventory, attendance, and live bills."],
    ["Information We Collect", "We collect only information required to provide services, including Gmail login details, business details, food item data, room media, booking details, inventory, attendance, and billing records."],
    ["Account Information", "When owners log in with Gmail, we may receive account identification details such as email, name if available, and login data needed to operate the service."],
    ["Business Information", "Owners may provide restaurant name, hotel name, food name, food price, food description, food image, food video, room image, room video, room details, booking information, inventory, staff attendance, and billing data."],
    ["Customer Booking Information", "When customers use booking features, the platform may collect the information entered in the booking form to complete and manage the booking."],
    ["QR Code and Menu Usage", "When a QR code is scanned, the platform loads the restaurant or hotel page connected to that QR code and may store technical data required to display the correct page."],
    ["Inventory, Attendance and Billing Information", "If owners use these modules, the platform may store stock item data, prices, quantities, staff attendance records, live bill data, service price details, and business records."],
    ["How We Use Information", "Information is used to allow Gmail login, mobile update, QR code management, public food and room display, booking, inventory, attendance, live billing, business record keeping, platform operation, security, and selected future services."],
    ["Customer Data Use Commitment", "Customer and business data is used only for the selected service. We do not use the information for unrelated business purposes."],
    ["Content Uploaded by Owners", "Owners are responsible for uploaded food images, videos, prices, descriptions, room photos, room videos, room prices, business details, inventory, billing, and staff-related details."],
    ["QR Code Service", "Generated QR codes show the menu, food media, room details, videos, prices, or business information added by the owner. The owner must keep the QR code page updated."],
    ["Booking Service", "Booking support connects hotels and customers. The owner is responsible for confirming, rejecting, managing, or fulfilling bookings and for any disputes about availability, quality, price, cancellation, or service."],
    ["Inventory Management", "Inventory tools help owners manage stock, item prices, quantity, and records. Business decisions based on this data remain the owner's responsibility."],
    ["Attendance Management", "Attendance tools help manage staff records. Owners must use this feature lawfully and inform staff where required."],
    ["Live Bill Generation", "Owners are responsible for correct bill details, item prices, tax details, discounts, and customer information entered into live bill tools."],
    ["Future Raw Food Supply Service", "Future direct farmer supply services may include fruits, vegetables, raw materials, delivery rules, pricing, quality checks, refunds, replacement rules, and vendor terms added when active."],
    ["Future Health, Decoration, Design and Media Services", "Future services such as doctor support, planning, plant decoration, interior design, social media, videography, photography, and other business services may have separate rules and pricing."],
    ["Data Sharing", "We do not sell customer data. Data may be shared only to provide selected services, operate hosting/storage/login/billing systems, process booking, or meet legal needs."],
    ["Public Information", "Restaurant name, hotel name, food details, room details, prices, media, and QR pages may be visible publicly if added by the owner."],
    ["Data Security", "We try to protect data with reasonable security measures. Users must keep Gmail, passwords, mobile number, device, and account access safe."],
    ["Data Accuracy", "Owners must keep food price, food availability, media, room price, room availability, inventory, attendance, billing, and business details accurate and updated."],
    ["User Responsibilities", "Users must not upload fake images, fake room media, illegal content, copyrighted content without permission, misleading prices, false booking details, false bills, or misuse customer data."],
    ["Ownership of Uploaded Content", "Owners keep ownership of uploaded content. By uploading it, they allow VistaCraft to store, display, process, and use it only for platform services."],
    ["No Guarantee of Sales or Bookings", "The platform helps businesses display services clearly, but does not guarantee more customers, orders, bookings, profit, reviews, or business growth."],
    ["Payment, Subscription and Fees", "If subscription or service fees are added, details such as pricing, refund policy, cancellation policy, and payment terms should be shown clearly before payment."],
    ["Third-Party Services", "The platform may use Google login, hosting, storage, payments, communication, maps, delivery, or other third-party services with their own terms and policies."],
    ["Legal Compliance", "Hotel and restaurant owners are responsible for laws related to food safety, hotel operation, restaurant operation, tax, billing, customer data, staff records, consumer protection, delivery, and local business rules."],
    ["Customer Information and Data Retention", "Customer information must be used only for booking, communication, service delivery, support, and related purposes. Data may be retained as needed for service, law, security, and records."],
    ["Account Access, Limitation of Liability and Service Availability", "Owners are responsible for account access. VistaCraft is not responsible for wrong owner-entered data, fake content, booking disputes, business loss, downtime, or third-party issues beyond providing the digital platform."],
    ["Changes, Children, Contact Information", "Services and policies may change. The platform is not mainly designed for children creating business accounts. Real business contact details should be added when available, not random contact data."]
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPolicyList(container, sections, type) {
    if (!container) return;
    container.innerHTML = sections.map(([title, body], index) => `
      <details class="policy-item" ${index === 0 ? "open" : ""}>
        <summary>
          <span class="policy-number">${String(index + 1).padStart(2, "0")}</span>
          <span>${escapeHtml(title)}</span>
          <span class="policy-plus" aria-hidden="true">+</span>
        </summary>
        <div class="policy-answer">
          <p class="policy-shiny">${escapeHtml(body)}</p>
        </div>
      </details>
    `).join("");
    container.dataset.policyType = type;
  }

  function renderFooterSocialIcons() {
    const container = document.querySelector("#footerSocialIcons");
    if (!container) return;
    const icons = [
      ["linkedin", "#"],
      ["instagram", "#"],
      ["facebook", "#"],
      ["pinterest", "#"],
      ["x", "#"],
      ["youtube", "#"]
    ];
    container.innerHTML = icons.map(([key, href]) => `
      <a href="${href}" aria-label="${key}" title="${key}">
        ${window.smartHotelSocialIcons?.icon(key, key) || escapeHtml(key)}
      </a>
    `).join("");
  }

  function populateLanguageSelect(filter = "") {
    const select = document.querySelector("#siteLanguageSelect");
    if (!select) return;
    const selected = localStorage.getItem(POLICY_LANGUAGE_KEY) || "en-IN";
    const normalizedFilter = filter.trim().toLowerCase();
    select.innerHTML = languages
      .filter(([, label]) => label.toLowerCase().includes(normalizedFilter))
      .map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
      .join("");
  }

  function getLanguageLabel(value) {
    return languages.find(([code]) => code === value)?.[1] || "English (India)";
  }

  function applyLanguage(value) {
    const lang = value || localStorage.getItem(POLICY_LANGUAGE_KEY) || "en-IN";
    const label = getLanguageLabel(lang);
    const text = uiText[lang] || uiText["en-IN"];
    localStorage.setItem(POLICY_LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelector("#selectedLanguageLabel") && (document.querySelector("#selectedLanguageLabel").textContent = label);
    document.querySelector("#footerLanguageLabel") && (document.querySelector("#footerLanguageLabel").textContent = label);
    document.querySelectorAll(".primary-nav a").forEach((link) => {
      const key = link.getAttribute("href")?.replace("#", "");
      if (text[key]) link.textContent = text[key];
    });
    const signupButtons = document.querySelectorAll("[data-open-login].secondary, .auth-actions [data-open-login]");
    signupButtons.forEach((button) => {
      if (button.textContent.trim().toLowerCase().includes("sign") || button.textContent.includes("साइन")) {
        button.textContent = text.signup;
      }
    });
    const loginButton = document.querySelector("#openLoginButton");
    if (loginButton) loginButton.textContent = text.login;
    document.querySelectorAll(".site-footer a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === "#privacy") link.textContent = text.privacy;
      if (href === "#legal") link.textContent = text.legal;
      if (href === "#terms") link.textContent = text.terms;
    });
    const languageTitle = document.querySelector(".language-settings > span");
    if (languageTitle) languageTitle.textContent = text.language;
  }

  function bindLanguagePicker() {
    const button = document.querySelector("#languagePickerButton");
    const panel = document.querySelector("#languagePanel");
    const select = document.querySelector("#siteLanguageSelect");
    const search = document.querySelector("#languageSearch");
    populateLanguageSelect();
    applyLanguage();
    button?.addEventListener("click", () => {
      const open = panel?.classList.toggle("is-hidden") === false;
      button.setAttribute("aria-expanded", String(open));
      if (open) search?.focus();
    });
    search?.addEventListener("input", () => populateLanguageSelect(search.value));
    select?.addEventListener("change", () => {
      applyLanguage(select.value);
      panel?.classList.add("is-hidden");
      button?.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", (event) => {
      if (!panel || panel.classList.contains("is-hidden")) return;
      if (panel.contains(event.target) || button?.contains(event.target)) return;
      panel.classList.add("is-hidden");
      button?.setAttribute("aria-expanded", "false");
    });
  }

  function applyTextPressure() {
    document.querySelectorAll(".policy-gradient-title").forEach((title) => {
      if (title.dataset.pressureReady) return;
      title.dataset.pressureReady = "true";
      const text = title.textContent || "";
      title.innerHTML = text.split("").map((char) => `<span>${char === " " ? "&nbsp;" : escapeHtml(char)}</span>`).join("");
      title.addEventListener("pointermove", (event) => {
        const rect = title.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        title.querySelectorAll("span").forEach((span) => {
          const spanRect = span.getBoundingClientRect();
          const centerX = spanRect.left + spanRect.width / 2;
          const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
          const strength = Math.max(0, 1 - distance / 220);
          span.style.fontVariationSettings = `"wght" ${Math.round(650 + strength * 250)}`;
          span.style.transform = `translateY(${strength * -5}px) scale(${1 + strength * 0.08})`;
        });
      });
      title.addEventListener("pointerleave", () => {
        title.querySelectorAll("span").forEach((span) => {
          span.style.fontVariationSettings = "";
          span.style.transform = "";
        });
      });
    });
  }

  function renderPublicRoute(hash) {
    const route = hash === "terms" ? "legal" : hash;
    const isPolicy = route === "privacy" || route === "legal";
    document.querySelectorAll("[data-public-main]").forEach((section) => {
      section.classList.toggle("is-hidden", isPolicy);
    });
    document.querySelectorAll("[data-policy-page]").forEach((section) => {
      section.classList.toggle("is-hidden", section.dataset.policyPage !== route);
    });
    document.body.classList.toggle("policy-route", isPolicy);
    if (isPolicy) {
      requestAnimationFrame(() => {
        document.querySelector(`[data-policy-page="${route}"]`)?.scrollIntoView({ block: "start" });
      });
    }
  }

  function init() {
    renderPolicyList(document.querySelector("#privacyPolicyList"), privacySections, "privacy");
    renderPolicyList(document.querySelector("#legalPolicyList"), legalSections, "legal");
    renderFooterSocialIcons();
    bindLanguagePicker();
    applyTextPressure();
  }

  window.smartHotelLegalPolicy = {
    init,
    renderPublicRoute,
    applyLanguage
  };

  document.addEventListener("DOMContentLoaded", init);
})();
