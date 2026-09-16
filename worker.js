/**
 * GitHub Profile Cards — Cloudflare Worker
 * Live data for @JHPate1
 *
 * Routes:
 *   /time       — animated live clock card
 *   /stats      — followers / repos / stars rings
 *   /skills     — animated skill bars
 *   /streak     — current + longest contribution streak
 *   /languages  — top languages donut chart
 *   /activity   — 52-week contribution heatmap
 *   /typing     — typewriter effect card
 *   /quote      — rotating dev quote
 *   /           — preview page with everything
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

const QUOTES = [
  ["Talk is cheap. Show me the code.", "Linus Torvalds"],
  ["Simplicity is the soul of efficiency.", "Austin Freeman"],
  ["First, solve the problem. Then, write the code.", "John Johnson"],
  ["Make it work, make it right, make it fast.", "Kent Beck"],
  ["Programs must be written for people to read.", "SICP"],
];

const TYPING_LINES = [
  "building things for the web",
  "learning new frameworks",
  "shipping side projects",
  "breaking and fixing CSS",
];

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c",
  SCSS: "#c6538c", Python: "#3572A5", Java: "#b07219", Shell: "#89e051",
  C: "#555555", C++: "#f34b7d", Go: "#00ADD8", Rust: "#dea584",
  PHP: "#4F5D95", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
};

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

const cardChrome = (w, h, title, subtitle) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect x="20" y="20" rx="28" width="${w - 40}" height="${h - 40}" fill="url(#bg)" filter="url(#shadow)"/>
  <rect x="20" y="20" rx="28" width="${w - 40}" height="${h - 40}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
  <path d="M20 70 Q${w / 2} 0 ${w - 20} 70 L${w - 20} 44 Q${w / 2} -26 20 44 Z" fill="#fff" opacity="0.05"/>
  <text x="52" y="62" fill="#fff" font-size="22" font-weight="800">${esc(title)}</text>
  <text x="52" y="84" fill="#64748b" font-size="13" letter-spacing="1">${esc(subtitle)}</text>`;

// ---------- /time ----------

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
      <stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="120" cy="80" r="90" fill="${c3}" opacity="0.35" filter="url(#blur)">
    <animate attributeName="cx" values="120;160;120" dur="8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="500" cy="240" r="80" fill="${c1}" opacity="0.4" filter="url(#blur)">
    <animate attributeName="cy" values="240;200;240" dur="10s" repeatCount="indefinite"/>
  </circle>
  <rect x="40" y="40" rx="32" width="520" height="240" fill="url(#bg)" filter="url(#shadow)"/>
  <path d="M40 100 Q300 20 560 100 L560 72 Q300 -8 40 72 Z" fill="#fff" opacity="0.14"/>
  <rect x="40" y="40" rx="32" width="520" height="240" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="1.5"/>
  <text x="80" y="170" fill="#fff" font-size="92" font-weight="800" letter-spacing="-3">${esc(hhmm)}</text>
  <text x="330" y="170" fill="#fff" font-size="26" font-weight="700" opacity="0.9">${esc(ampm)}</text>
  <text x="84" y="212" fill="#fff" font-size="26" font-weight="600" opacity="0.95">${esc(dateLine)}${ordinal(day)}</text>
  <g transform="translate(508,62)" fill="#fff" opacity="0.9">
    <circle cx="10" cy="10" r="10" opacity="0.25">
      <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="10" cy="10" r="4"/>
  </g>
  <text x="84" y="248" fill="#fff" opacity="0.65" font-size="13" letter-spacing="1">LIVE • ${esc(TZ)} • @JHPate1</text>
</svg>`;
}

// ---------- /stats ----------

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
    totalStars = (await repoRes.json()).reduce((s, r) => s + (r.stargazers_count || 0), 0);
  }

  const stat = (x, label, value, color) => `
    <circle cx="${x}" cy="140" r="46" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
    <circle cx="${x}" cy="140" r="46" fill="none" stroke="${color}" stroke-width="3"
            stroke-linecap="round" stroke-dasharray="60 289" transform="rotate(-90 ${x} 140)">
      <animate attributeName="stroke-dasharray" from="0 289" to="60 289" dur="1.2s" fill="freeze"/>
    </circle>
    <text x="${x}" y="136" fill="#fff" font-size="26" font-weight="800" text-anchor="middle">${esc(value)}</text>
    <text x="${x}" y="158" fill="#94a3b8" font-size="12" text-anchor="middle" letter-spacing="1">${label}</text>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="250" viewBox="0 0 720 250" font-family="${FONT}">
  ${cardChrome(720, 250, name, "GITHUB • LIVE")}
  ${stat(160, "FOLLOWERS", followers, "#38bdf8")}
  ${stat(360, "REPOS", repos, "#a855f7")}
  ${stat(560, "STARS", totalStars, "#fbbf24")}
  <text x="360" y="222" fill="#475569" font-size="11" text-anchor="middle" letter-spacing="1">updated every request • api.github.com</text>
</svg>`;
}

// ---------- /skills ----------

function skillsCard() {
  let y = 106;
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
  ${cardChrome(720, y + 20, "Skills", "WHAT I WORK WITH")}
  ${rows}
</svg>`;
}

// ---------- /streak (NEW) — current & longest streak from contribution calendar ----------

async function streakCard() {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`, { headers: ghHeaders() });
  const days = new Set();
  if (res.ok) {
    for (const e of await res.json()) days.add(e.created_at.slice(0, 10));
  }

  // Build a sorted list of active days (limited to recent events) and compute streaks
  const sorted = [...days].sort().reverse();
  let current = 0, longest = 0, run = 0, prev = null;
  const dayMs = 86400000;

  for (const d of sorted) {
    const t = Date.parse(d);
    if (prev !== null && prev - t === dayMs) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  // current streak: walk forward from today/yesterday
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  today.setHours(0, 0, 0, 0);
  current = 0;
  for (let t = today.getTime(); days.has(new Date(t).toISOString().slice(0, 10)) || days.has(new Date(t - dayMs).toISOString().slice(0, 10)); t -= dayMs) {
    if (days.has(new Date(t).toISOString().slice(0, 10))) current++;
    else if (days.has(new Date(t - dayMs).toISOString().slice(0, 10))) { t -= dayMs; current++; }
    else break;
  }

  const flame = (x, label, value) => `
    <text x="${x}" y="150" fill="#fff" font-size="52" font-weight="800" text-anchor="middle">${value}</text>
    <text x="${x}" y="180" fill="#94a3b8" font-size="13" text-anchor="middle" letter-spacing="2">${label}</text>
    <circle cx="${x}" cy="105" r="8" fill="#f97316">
      <animate attributeName="r" values="8;11;8" dur="1.5s" repeatCount="indefinite"/>
    </circle>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="250" viewBox="0 0 720 250" font-family="${FONT}">
  ${cardChrome(720, 250, "Streak", "KEEP THE FIRE ALIVE")}
  ${flame(240, "CURRENT STREAK", current + "d")}
  ${flame(480, "LONGEST STREAK", longest + "d")}
  <text x="360" y="222" fill="#475569" font-size="11" text-anchor="middle">based on recent public activity</text>
</svg>`;
}

// ---------- /languages (NEW) — top languages donut chart ----------

async function languagesCard() {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, { headers: ghHeaders() });
  const totals = {};
  if (res.ok) {
    for (const repo of await res.json()) {
      const lRes = await fetch(repo.languages_url, { headers: ghHeaders() });
      if (lRes.ok) {
        for (const [lang, bytes] of Object.entries(await lRes.json())) {
          totals[lang] = (totals[lang] || 0) + bytes;
        }
      }
    }
  }

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalBytes = top.reduce((s, [, v]) => s + v, 0) || 1;

  const cx = 200, cy = 145, r = 70;
  let angle = -90;
  const slices = top.map(([lang, bytes], i) => {
    const frac = bytes / totalBytes;
    const sweep = frac * 360;
    const a1 = (angle * Math.PI) / 180, a2 = ((angle + sweep) * Math.PI) / 180;
    const large = sweep > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    angle += sweep;
    const color = LANG_COLORS[lang] || `hsl(${(i * 67) % 360} 70% 55%)`;
    return `
    <path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z"
          fill="${color}" opacity="0" stroke="#0f172a" stroke-width="2">
      <animate attributeName="opacity" from="0" to="0.9" dur="0.5s" begin="${i * 0.15}s" fill="freeze"/>
    </path>`;
  }).join("");

  const legend = top.map(([lang, bytes], i) => {
    const pct = Math.round((bytes / totalBytes) * 100);
    const color = LANG_COLORS[lang] || `hsl(${(i * 67) % 360} 70% 55%)`;
    return `
    <circle cx="370" cy="${118 + i * 34}" r="6" fill="${color}"/>
    <text x="386" y="${123 + i * 34}" fill="#e2e8f0" font-size="15" font-weight="600">${esc(lang)}</text>
    <text x="660" y="${123 + i * 34}" fill="#94a3b8" font-size="14" text-anchor="end">${pct}%</text>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="250" viewBox="0 0 720 250" font-family="${FONT}">
  ${cardChrome(720, 250, "Languages", "ACROSS ALL PUBLIC REPOS")}
  ${slices}
  <circle cx="${cx}" cy="${cy}" r="40" fill="#0f172a"/>
  <text x="${cx}" y="${cy + 5}" fill="#fff" font-size="14" font-weight="700" text-anchor="middle">TOP ${top.length}</text>
  ${legend}
</svg>`;
}

// ---------- /activity (NEW) — contribution-style heatmap ----------

async function activityCard() {
  const res = await fetch(`https://api.github.com/users/${GHPate1_FIX()}/events/public?per_page=100`, { headers: ghHeaders() });
  const counts = {};
  if (res.ok) {
    for (const e of await res.json()) {
      const d = e.created_at.slice(0, 10);
      counts[d] = (counts[d] || 0) + 1;
    }
  }

  // 26 weeks x 7 days grid
  const cell = 14, gap = 4;
  const cells = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 26 * 7 * 86400000);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday

  for (let i = 0; i < 26 * 7; i++) {
    const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    const c = counts[d] || 0;
    const level = c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : 3;
    const fills = ["rgba(255,255,255,0.06)", "#0e4429", "#26a641", "#39d353"];
    const col = Math.floor(i / 7), row = i % 7;
    cells.push(`<rect x="${60 + col * (cell + gap)}" y="${110 + row * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${fills[level]}"/>`);
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="270" viewBox="0 0 720 270" font-family="${FONT}">
  ${cardChrome(720, 270, "Activity", "LAST 26 WEEKS")}
  ${cells.join("")}
  <text x="60" y="248" fill="#475569" font-size="11">less</text>
  <rect x="92" y="240" width="11" height="11" rx="3" fill="rgba(255,255,255,0.06)"/>
  <rect x="108" y="240" width="11" height="11" rx="3" fill="#0e4429"/>
  <rect x="124" y="240" width="11" height="11" rx="3" fill="#26a641"/>
  <rect x="140" y="240" width="11" height="11" rx="3" fill="#39d353"/>
  <text x="158" y="248" fill="#475569" font-size="11">more</text>
</svg>`;
}

function GHPate1_FIX() { return GITHUB_USER; } // keeps username in one place

// ---------- /typing (NEW) — typewriter card ----------

function typingCard() {
  const line = TYPING_LINES[0];
  const chars = [...line];
  const typed = chars.map((c, i) =>
    `<tspan opacity="0">${esc(c)}<animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="${i * 0.07}s" fill="freeze"/></tspan>`
  ).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="160" viewBox="0 0 720 160" font-family="'Cascadia Code', ui-monospace, monospace">
  ${cardChrome(720, 160, "", "")}
  <text x="52" y="100" fill="#34d399" font-size="22" font-weight="600">
    <tspan fill="#38bdf8">&gt;_</tspan> ${typed}<tspan fill="#34d399">▊<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></tspan>
  </text>
  <text x="52" y="66" fill="#fff" font-size="22" font-weight="800" font-family="${FONT}">@JHPate1</text>
</svg>`;
}

// ---------- /quote (NEW) — rotating dev quote ----------

function quoteCard() {
  const [q, author] = QUOTES[Math.floor(Date.now() / 60000) % QUOTES.length];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180" viewBox="0 0 720 180" font-family="${FONT}">
  ${cardChrome(720, 180, "", "")}
  <text x="52" y="70" fill="#a855f7" font-size="60" font-weight="900" opacity="0.6">"</text>
  <text x="90" y="105" fill="#e2e8f0" font-size="20" font-weight="600" font-style="italic">${esc(q)}</text>
  <text x="90" y="135" fill="#64748b" font-size="14" font-weight="600">— ${esc(author)}</text>
</svg>`;
}

// ---------- worker ----------

export default {
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/time":      return respond(timeCard(url.searchParams.get("theme")));
      case "/stats":     return respond(await statsCard());
      case "/skills":    return respond(skillsCard());
      case "/streak":    return respond(await streakCard());
      case "/languages": return respond(await languagesCard());
      case "/activity":  return respond(await activityCard());
      case "/typing":    return respond(typingCard());
      case "/quote":     return respond(quoteCard());
      case "/": {
        const img = (p, w) => `<img src="${p}" width="${w}">`;
        return respond(
          `<html><body style="background:#0b1020;display:flex;flex-direction:column;gap:20px;align-items:center;padding:32px;font-family:system-ui">
            ${img("/typing", 720)}${img("/time", 600)}${img("/stats", 720)}
            ${img("/streak", 720)}${img("/languages", 720)}${img("/activity", 720)}
            ${img("/skills", 720)}${img("/quote", 720)}
          </body></html>`,
          "text/html"
        );
      }
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};
