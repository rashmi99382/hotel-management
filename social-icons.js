(() => {
  if (window.smartHotelSocialIcons) return;

  let idSeed = 0;
  const uid = (prefix) => `${prefix}-${++idSeed}`;
  const alias = {
    in: "linkedin",
    ig: "instagram",
    f: "facebook",
    p: "pinterest",
    xTwitter: "x",
    yt: "youtube",
    wa: "whatsapp",
    contact: "whatsapp",
    at: "attendance",
    lo: "location"
  };

  const icons = {
    linkedin: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#0a66c2"/>
        <circle cx="18.2" cy="18" r="5.1" fill="#fff"/>
        <path fill="#fff" d="M14 27h8.2v25H14zM28 27h7.8v3.4c1.5-2.3 4.1-4 8-4 8.5 0 10.2 5.6 10.2 12.8V52h-8.3V40.6c0-3.1-.7-6.1-4.5-6.1-3.9 0-4.9 3-4.9 6.1V52H28z"/>
      </svg>
    `,
    instagram: () => {
      const grad = uid("ig");
      return `
        <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
          <defs>
            <radialGradient id="${grad}" cx="30%" cy="105%" r="100%">
              <stop offset="0%" stop-color="#ffd86f"/>
              <stop offset="34%" stop-color="#ff7a3d"/>
              <stop offset="62%" stop-color="#dd2a7b"/>
              <stop offset="100%" stop-color="#515bd4"/>
            </radialGradient>
          </defs>
          <rect width="64" height="64" rx="32" fill="url(#${grad})"/>
          <rect x="17" y="17" width="30" height="30" rx="9" fill="none" stroke="#fff" stroke-width="4.4"/>
          <circle cx="32" cy="32" r="8.1" fill="none" stroke="#fff" stroke-width="4.4"/>
          <circle cx="43" cy="21" r="3.2" fill="#fff"/>
        </svg>
      `;
    },
    facebook: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#1877f2"/>
        <path fill="#fff" d="M36 55V35.4h6.6l1-7.7H36v-4.9c0-2.2.6-3.7 3.8-3.7h4.1v-6.9c-.7-.1-3.1-.3-5.9-.3-5.8 0-9.8 3.6-9.8 10.1v5.7h-6.6v7.7h6.6V55z"/>
      </svg>
    `,
    pinterest: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#e60023"/>
        <path fill="#fff" d="M31.8 12.6c-10.3 0-18 7-18 16.3 0 6.5 3.6 10.2 6.9 10.2 1.4 0 2.2-3.8 2.2-4.9 0-1.3-3.3-4.1-3.3-9.5 0-7 5.3-12 12.2-12 5.9 0 10.2 3.4 10.2 9.5 0 4.6-1.9 13.2-7.8 13.2-2.1 0-4-1.6-4-3.8 0-3.2 2.2-6.4 2.2-9.7 0-5.7-8.1-4.7-8.1 2.2 0 1.5.2 3.1.9 4.5-1.3 5.4-3.9 13.5-3.9 19.1 0 1.7.2 3.4.3 5.1.4.4.2.3.8.1 4.4-6 4.2-7.2 6.2-15.1 1.7 3.2 6 4.9 9.5 4.9 9.1 0 13.2-8.8 13.2-16.7 0-8.9-7.7-14.7-16.1-14.7z"/>
      </svg>
    `,
    x: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#0f172a"/>
        <path fill="#fff" d="M37 29.2 52.5 12h-4.9L34.8 26.2 24.6 12H12.4l16.3 22.7L12.4 52h4.9l13.6-14.9L41.6 52h12.2zm-4 4.4-2.2-3.1L21.8 16h5.2l8.5 12.2 2.2 3.1 9.6 16.3h-5.2z"/>
      </svg>
    `,
    youtube: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#ff0033"/>
        <path fill="#fff" d="M52.8 23.1c-.5-2-2.1-3.5-4-4-3.5-.9-16.8-.9-16.8-.9s-13.3 0-16.8.9c-1.9.5-3.5 2-4 4-.9 3.5-.9 8.9-.9 8.9s0 5.4.9 8.9c.5 2 2.1 3.5 4 4 3.5.9 16.8.9 16.8.9s13.3 0 16.8-.9c1.9-.5 3.5-2 4-4 .9-3.5.9-8.9.9-8.9s0-5.4-.9-8.9z"/>
        <path fill="#ff0033" d="m27.4 38.5 11.1-6.5-11.1-6.5z"/>
      </svg>
    `,
    whatsapp: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#22c55e"/>
        <path fill="#fff" d="M15.7 50.2 18 41.6a17.8 17.8 0 1 1 6.8 6.5zm9.5-5.2.5.3a14.2 14.2 0 1 0-4.4-4.2l.4.6-1.3 4.8z"/>
        <path fill="#fff" d="M42.5 36.9c-.6-.3-3.7-1.8-4.2-2-.6-.2-1-.3-1.4.3-.4.6-1.6 2-2 2.4-.3.4-.7.5-1.3.2a15 15 0 0 1-7.4-6.5c-.6-1.1.6-1 1.7-3.3.2-.4.1-.8-.1-1.2-.2-.3-1.4-3.3-1.9-4.5-.5-1.2-1-1-1.4-1h-1.2c-.4 0-1.1.2-1.7.8-.6.6-2.2 2.2-2.2 5.3s2.3 6.1 2.6 6.5c.3.4 4.5 6.8 10.8 9.6 4 1.7 5.6 1.8 7.6 1.5 1.2-.2 3.7-1.5 4.2-3 .5-1.5.5-2.8.4-3.1-.2-.2-.6-.4-1.2-.7z"/>
      </svg>
    `,
    attendance: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#10b981"/>
        <path fill="#fff" d="M32 8c-10.5 0-19 8.5-19 19 0 14.5 19 29 19 29s19-14.5 19-29C51 16.5 42.5 8 32 8zm0 33a14 14 0 1 1 0-28 14 14 0 0 1 0 28z"/>
        <path fill="#10b981" d="M34.2 20h-4.4v10.5l8.5 5 2.2-3.7-6.3-3.7z"/>
      </svg>
    `,
    location: () => `
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill="#f8fafc"/>
        <path fill="#34a853" d="M32 6c-9.6 0-17.4 7.7-17.4 17.3 0 13 17.4 34.7 17.4 34.7s17.4-21.7 17.4-34.7C49.4 13.7 41.6 6 32 6z"/>
        <path fill="#4285f4" d="M32 6c-6.8 0-12.6 3.9-15.5 9.5l14 14 13.2-13.2C40.7 10.2 36.8 6 32 6z"/>
        <path fill="#fbbc05" d="m16.5 15.5 14 14L22 38c-4-4.7-7.4-9.8-7.4-14.7 0-2.8.7-5.5 1.9-7.8z"/>
        <path fill="#ea4335" d="m43.7 16.3-13.2 13.2L42 41c3.9-5.8 7.4-12.6 7.4-17.7 0-2.5-.6-4.9-1.6-7z"/>
        <circle cx="32" cy="24" r="6.2" fill="#fff"/>
      </svg>
    `
  };

  function normalize(key) {
    return alias[key] || key || "attendance";
  }

  function icon(key, label = "") {
    const normalized = normalize(key);
    const svg = icons[normalized] ? icons[normalized]() : icons.attendance();
    const safeLabel = String(label || normalized).replace(/["<>]/g, "");
    return `<span class="social-code-logo social-code-logo-${normalized}" title="${safeLabel}" aria-hidden="true">${svg}</span>`;
  }

  window.smartHotelSocialIcons = { icon, normalize };
})();
