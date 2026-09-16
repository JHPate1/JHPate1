/**
 * GitHub Profile Cards — Cloudflare Worker
 * Live data for @JHPate1
 *
 * Routes:
 *   /time    — animated live clock card
 *   /stats   — live GitHub stats for JHPate1
 *   /skills  — animated skill bars
 *   /        — preview page
 */

const TZ = "America/New_York";
const GITHUB_USER = "JHPate1";
const FONT = "'Segoe UI', ui-sans-serif, system-ui, -apple-system, Roboto, Arial";

const THEMES = {
  morning:   ["#38bdf8", "#34d399", "#fbbf24"],
  afternoon: ["#fb923c", "#f43f5e", "#fbbf24"],
  evening:   ["#a855f7", "#6366f1", "#ec4899"],
  night:     ["#1e3a8a", "#7c3aed", "#06b6d4"],
};

const SKILLS = [
  ["HTML", 70, "#e34f26"],
  ["SCSS", 80, "#cf649a"],
  ["Bootstrap", 50, "#7952b3"],
  ["JavaScript", 65, "#f7df1e"],
  ["CSS", 75, "#38bdf8"],
];

// ---------- helpers ----------

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
           .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
};

const pickTheme = (hour, override) =>
  override && THEMES[override] ? THEMES[override]
  : hour >= 5 && hour < 12  ? THEMES.morning
  : hour >= 12 && hour < 17 ? THEMES.afternoon
  : hour >= 17 && hour < 21 ? THEMES.evening
  : THEMES.night;

const respond = (content, type = "image/svg+xml") =>
  new Response(content, {
    headers: {
      "content-type": `${type}; charset=utf-8`,
      "cache-control": "public, max-age=60, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });

const ghHeaders = () => {
  const h = { "user-agent": "profile-cards-worker", accept: "application/vnd.github+json" };
  if (typeof GITHUB_TOKEN !== "undefined") h.authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
};

// ---------- time card ----------

function timeCard(themeOverride) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const [c1, c2, c3] = pickTheme(now.getHours(), themeOverride);

  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const [hhmm, ampm] = time.split(" ");
  const day = now.getDate();
  const dateLine = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" font-family="${FONT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="orb" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- soft floating glow orbs -->
  <circle cx="120" cy="80" r="90" fill="${c3}" opacity="0.35" filter="url(#blur)">
    <animate attributeName="cx" values="120;160;120" dur="8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="500" cy="240" r="80" fill="${c1}" opacity="0.4" filter="url(#blur)">
    <animate attributeName="cy" values="240;200;240" dur="10s" repeatCount="indefinite"/>
  </circle>

  <rect x="40" y="40" rx="32" width="520" height="240" fill="url(#bg)" filter="url(#shadow)"/>
  <!-- glass sheen -->
  <path d="M40 100 Q300 20 560 100 L560 72 Q300 -8 40 72 Z" fill="#fff" opacity="0.14"/>
  <rect x="40" y="40" rx="32" width="520" height="240" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="1.5"/>

  <text x="80" y="170" fill="#fff" font-size="92" font-weight="800" letter-spacing="-3">${esc(hhmm)}</text>
  <text x="330" y="170" fill="#fff" font-size="26" font-weight="700" opacity="0.9">${esc(ampm)}</text>

  <text x="84" y="212" fill="#fff" font-size="26" font-weight="600" opacity="0.95">${esc(dateLine)}${ordinal(day)}</text>

  <g transform="translate(508,62)" fill="#fff" opacity="0.9">
    <circle cx="10" cy="10" r="10" opacity="0.25">
      <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="4" fill="#fff"/>
  </g>

  <text x="84" y="248" fill="#fff" opacity="0.65" font-size="13" letter-spacing="1">LIVE • ${esc(TZ)} • @JHPate1</text>
</svg>`;
}

// ---------- stats card (live from GitHub) ----------

async function statsCard() {
  let followers = "?", repos = "?", totalStars = "?", name = GITHUB_USER;

  const [userRes, repoRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers: ghHeaders() }),
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, { headers: ghHeaders() }),
  ]);

  if (userRes.ok) {
    const u = await userRes.json();
    followers = u.followers ?? 0;
    repos = u.public_repos ?? 0;
    if (u.name) name = u.name;
  }
  if (repoRes.ok) {
    const list = await repoRes.json();
    totalStars = list.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  }

  const stat = (x, label, value, color) => `
    <circle cx="${x}" cy="130" r="46" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
    <circle cx="${x}" cy="130" r="46" fill="none" stroke="${color}" stroke-width="3"
            stroke-linecap="round" stroke-dasharray="60 289" transform="rotate(-90 ${x} 130)">
      <animate attributeName="stroke-dasharray" from="0 289" to="60 289" dur="1.2s" fill="freeze"/>
    </circle>
    <text x="${x}" y="126" fill="#fff" font-size="26" font-weight="800" text-anchor="middle">${esc(value)}</text>
    <text x="${x}" y="148" fill="#94a3b8" font-size="12" text-anchor="middle" letter-spacing="1">${label}</text>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240" font-family="${FONT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect x="20" y="20" rx="28" width="680" height="200" fill="url(#bg)" filter="url(#shadow)"/>
  <rect x="20" y="20" rx="28" width="680" height="200" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
  <path d="M20 80 Q360 0 700 80 L700 48 Q360 -32 20 48 Z" fill="#fff" opacity="0.05"/>

  <text x="52" y="62" fill="#fff" font-size="22" font-weight="800">${esc(name)}</text>
  <text x="52" y="84" fill="#64748b" font-size="13" letter-spacing="1">GITHUB • LIVE</text>

  ${stat(160, "FOLLOWERS", followers, "#38bdf8")}
  ${stat(360, "REPOS", repos, "#a855f7")}
  ${stat(560, "STARS", totalStars, "#fbbf24")}

  <text x="360" y="200" fill="#475569" font-size="11" text-anchor="middle" letter-spacing="1">updated every request • api.github.com</text>
</svg>`;
}

// ---------- skills card ----------

function skillsCard() {
  let y = 86;
  const rows = SKILLS.map(([name, pct, color]) => {
    const barW = 400, fillW = Math.round(barW * pct / 100);
    const row = `
    <text x="60" y="${y}" fill="#e2e8f0" font-size="15" font-weight="700">${esc(name)}</text>
    <text x="660" y="${y}" fill="#94a3b8" font-size="13" font-weight="700" text-anchor="end">${pct}%</text>
    <rect x="60" y="${y + 10}" width="${barW}" height="10" rx="5" fill="rgba(255,255,255,0.08)"/>
    <rect x="60" y="${y + 10}" width="0" height="10" rx="5" fill="${color}">
      <animate attributeName="width" from="0" to="${fillW}" dur="1s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
    </rect>`;
    y += 52;
    return row;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${y + 20}" viewBox="0 0 720 ${y + 20}" font-family="${FONT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect x="20" y="20" rx="28" width="680" height="${y - 10}" fill="url(#bg)" filter="url(#shadow)"/>
  <rect x="20" y="20" rx="28" width="680" height="${y - 10}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
  <path d="M20 70 Q360 0 700 70 L700 44 Q360 -26 20 44 Z" fill="#fff" opacity="0.05"/>

  <text x="52" y="62" fill="#fff" font-size="22" font-weight="800">Skills</text>
  ${rows}
</svg>`;
}

// ---------- worker ----------

export default {
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/time":
        return respond(timeCard(url.searchParams.get("theme")));
      case "/stats":
        return respond(await statsCard());
      case "/skills":
        return respond(skillsCard());
      case "/":
        return respond(
          `<html><body style="background:#0b1020;display:flex;flex-direction:column;gap:20px;align-items:center;padding:32px;font-family:system-ui">
            <img src="/time" width="600"><img src="/stats" width="720"><img src="/skills" width="720">
          </body></html>`,
          "text/html"
        );
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};
