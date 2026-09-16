/**
 * GitHub Profile Cards — Cloudflare Worker
 *
 * Routes:
 *   /time          — live clock card (auto theme by hour)
 *   /time?theme=night — force a theme: morning|afternoon|evening|night|neon|sunset
 *   /stats?repo=owner/name — commit/contributor stats card (uses GitHub API)
 *   /skills        — skills card (edit SKILLS below)
 *   /              — HTML preview page showing all three
 */

const TZ = "America/New_York";
const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";

const THEMES = {
  morning:   ["#0ea5e9", "#22c55e"],
  afternoon: ["#fb923c", "#f43f5e"],
  evening:   ["#a855f7", "#6366f1"],
  night:     ["#0f172a", "#1d4ed8"],
  neon:      ["#00f5d4", "#9b5de5"],
  sunset:    ["#ff6b6b", "#ffd166"],
};

// Edit these any time
const SKILLS = [
  ["HTML", 70],
  ["SCSS", 80],
  ["Bootstrap", 50],
  ["JavaScript", 65],
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

const svg = (body, w, h, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<defs>${defs}</defs>${body}</svg>`;

const respond = (content, type = "image/svg+xml") =>
  new Response(content, {
    headers: {
      "content-type": `${type}; charset=utf-8`,
      "cache-control": "public, max-age=60, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });

// ---------- cards ----------

function timeCard(themeOverride) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const [c1, c2] = pickTheme(now.getHours(), themeOverride);

  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const [hhmm, ampm] = time.split(" ");
  const day = now.getDate();
  const dateLine = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const defs = `
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/>
    </filter>`;

  const body = `
    <rect x="40" y="45" rx="28" width="480" height="210" fill="url(#bg)" filter="url(#glow)"/>
    <path d="M68 75 C180 20, 380 20, 492 75 L492 105 C380 70, 180 70, 68 105 Z" fill="#fff" opacity="0.12"/>
    <text x="88" y="155" fill="#fff" font-family="${FONT}" font-size="96" font-weight="800" letter-spacing="-2">${esc(hhmm)}</text>
    <text x="320" y="155" fill="#fff" font-family="${FONT}" font-size="28" font-weight="700" opacity="0.92">${esc(ampm)}</text>
    <text x="92" y="200" fill="#fff" font-family="${FONT}" font-size="28" font-weight="600" opacity="0.95">${esc(dateLine)}${ordinal(day)}</text>
    <text x="92" y="235" fill="#fff" opacity="0.70" font-family="${FONT}" font-size="14">Live • ${esc(TZ)}</text>`;

  return svg(body, 560, 300, defs);
}

async function statsCard(url) {
  let commits = "?", contributors = "?", stars = "?";
  const m = url.searchParams.get("repo")?.match(/^([\w.-]+)\/([\w.-]+)$/);

  if (m) {
    const [, owner, repo] = m;
    const headers = {
      "user-agent": "profile-cards-worker",
      accept: "application/vnd.github+json",
    };
    // Optional: set a GITHUB_TOKEN secret to avoid rate limits
    if (typeof GITHUB_TOKEN !== "undefined") headers.authorization = `Bearer ${GITHUB_TOKEN}`;

    const [repoRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, { headers }),
    ]);
    if (repoRes.ok) {
      const data = await repoRes.json();
      commits = data.size ?? "?"; // size ≈ KB of repo; use below for real count
      stars = data.stargazers_count ?? "?";
    }
    if (contribRes.ok) {
      contributors = (await contribRes.json()).length;
    }

    // Real commit count via link header pagination
    if (contribRes.ok) {
      const link = contribRes.headers.get("link") || "";
      const last = link.match(/[?&]page=(\d+)>; rel="last"/);
      contributors = last ? Number(last[1]) : 1;
    }
  }

  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>`;

  const stat = (x, label, value) => `
    <text x="${x}" y="115" fill="#e5e7eb" font-size="18" font-family="${FONT}">${label}</text>
    <text x="${x}" y="150" fill="#fff" font-size="34" font-weight="800" font-family="${FONT}">${esc(value)}</text>`;

  const body = `
    <rect x="20" y="20" rx="22" width="680" height="180" fill="url(#bg)" stroke="rgba(255,255,255,0.08)"/>
    <text x="52" y="70" fill="#fff" font-size="26" font-weight="800" font-family="${FONT}">GitHub Stats</text>
    ${stat(52, "Contributors", contributors)}
    ${stat(260, "Stars", stars)}
    ${stat(460, "Repo", m ? `${m[1]}/${m[2]}` : "add ?repo=owner/name")}
    <text x="52" y="182" fill="#9ca3af" font-size="14" font-family="${FONT}">Live from GitHub API</text>`;

  return svg(body, 720, 220, defs);
}

function skillsCard() {
  const defs = `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00f5d4"/>
      <stop offset="100%" stop-color="#9b5de5"/>
    </linearGradient>`;

  let y = 74;
  const rows = SKILLS.map(([name, pct]) => {
    const barW = 420, fillW = Math.round(barW * pct / 100);
    const row = `
      <text x="56" y="${y}" fill="#e5e7eb" font-size="14" font-weight="700" font-family="${FONT}">${esc(name)}</text>
      <rect x="56" y="${y + 16}" width="${barW}" height="12" rx="8" fill="rgba(255,255,255,0.12)"/>
      <rect x="56" y="${y + 16}" width="${fillW}" height="12" rx="8" fill="url(#bar)"/>
      <text x="${56 + fillW + 10}" y="${y + 26}" fill="#fff" font-size="12" font-weight="800" font-family="${FONT}">${pct}%</text>`;
    y += 58;
    return row;
  }).join("");

  const body = `
    <rect x="20" y="20" rx="22" width="680" height="${Math.max(240, y + 10)}" fill="#282828" stroke="rgba(255,255,255,0.08)"/>
    <text x="52" y="64" fill="#fff" font-size="20" font-weight="900" font-family="${FONT}">Skills</text>
    ${rows}`;

  return svg(body, 720, Math.max(260, y + 30), defs);
}

// ---------- worker ----------

export default {
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/time":
        return respond(timeCard(url.searchParams.get("theme")));
      case "/stats":
        return respond(await statsCard(url));
      case "/skills":
        return respond(skillsCard());
      case "/":
        return respond(
          `<html><body style="background:#111;display:flex;flex-direction:column;gap:16px;align-items:center;padding:24px">
            <img src="/time" width="560"><img src="/stats" width="720"><img src="/skills" width="720">
          </body></html>`,
          "text/html"
        );
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};
