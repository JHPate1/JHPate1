/**
 * github.jyot.dev — profile cards for @JHPate1
 * routes: /time /stats /streak /languages /activity /skills
 *
 * Set GITHUB_TOKEN (wrangler secret) for real contribution data.
 * Without it, streak/activity fall back to recent public events.
 */

const TZ = "America/New_York";
const USER = "JHPate1";
const SITE = "jyot.dev";

// GitHub dark palette — color only where it means something
const BG = "#0d1117", BORDER = "#21262d", TRACK = "#161b22";
const TEXT = "#e6edf3", MUTED = "#8b949e", FAINT = "#6e7681";
const HEAT = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const FONT = `-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;

const SKILLS = [["HTML", 70], ["SCSS", 80], ["Bootstrap", 50], ["JavaScript", 65], ["CSS", 75]];

const LANG_FALLBACK = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c",
  SCSS: "#c6538c", Python: "#3572A5", Java: "#b07219", Shell: "#89e051",
  "C++": "#f34b7d", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584",
  PHP: "#4F5D95", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
  Vue: "#41b883", "Jupyter Notebook": "#DA5B0B",
};

// ---------- plumbing ----------

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
};

const respond = (body, sMax = 300) => new Response(body, {
  headers: {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": `public, max-age=60, s-maxage=${sMax}`,
    "access-control-allow-origin": "*",
  },
});

const gh = () => {
  const h = { "user-agent": `${SITE} cards`, accept: "application/vnd.github+json" };
  if (typeof GITHUB_TOKEN !== "undefined") h.authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
};

const svgDoc = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;

// shared card chrome: flat panel, hairline border, quiet title
function chrome(w, h, title, sub) {
  let s = `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${BG}" stroke="${BORDER}"/>`;
  if (title) s += `<text x="28" y="42" font-size="15" font-weight="600" fill="${TEXT}">${esc(title)}</text>`;
  if (sub) s += `<text x="28" y="62" font-size="12" fill="${MUTED}">${esc(sub)}</text>`;
  return s;
}

// ---------- data ----------

async function contributions() {
  if (typeof GITHUB_TOKEN === "undefined") return null;
  const q = `query($l:String!){user(login:$l){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  try {
    const r = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...gh(), "content-type": "application/json" },
      body: JSON.stringify({ query: q, variables: { l: USER } }),
    });
    const j = await r.json();
    return j?.data?.user?.contributionsCollection?.contributionCalendar ?? null;
  } catch { return null; }
}

async function languagesData() {
  if (typeof GITHUB_TOKEN !== "undefined") {
    const q = `query($l:String!){user(login:$l){repositories(first:100,isFork:false,ownerAffiliations:OWNER){nodes{languages(first:8,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}}}}`;
    try {
      const r = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { ...gh(), "content-type": "application/json" },
        body: JSON.stringify({ query: q, variables: { l: USER } }),
      });
      const j = await r.json();
      const totals = {};
      for (const repo of j?.data?.user?.repositories?.nodes ?? []) {
        for (const e of repo.languages.edges) {
          totals[e.node.name] ??= { size: 0, color: e.node.color };
          totals[e.node.name].size += e.size;
        }
      }
      const all = Object.entries(totals).sort((a, b) => b[1].size - a[1].size);
      if (!all.length) return null;
      const total = all.reduce((s, [, v]) => s + v.size, 0);
      const rows = all.slice(0, 5).map(([name, v]) => ({ name, color: v.color || MUTED, pct: Math.round(v.size / total * 100) }));
      const rest = all.slice(5).reduce((s, [, v]) => s + v.size, 0);
      if (rest > 0) rows.push({ name: "other", color: FAINT, pct: Math.round(rest / total * 100) });
      return rows;
    } catch {}
  }
  // fallback: count repos by primary language
  try {
    const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100`, { headers: gh() });
    if (!r.ok) return null;
    const counts = {};
    for (const repo of await r.json()) if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return entries.length
      ? entries.map(([name, n]) => ({ name, color: LANG_FALLBACK[name] || MUTED, pct: Math.round(n / total * 100) }))
      : null;
  } catch { return null; }
}

// ---------- cards ----------

function timeCard() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const h = now.getHours();
  const greet = h < 5 ? "up late?" : h < 12 ? "good morning" : h < 17 ? "good afternoon" : h < 21 ? "good evening" : "up late?";
  const [hm, ap] = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).split(" ");
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + ordinal(now.getDate());
  return svgDoc(600, 240, `
    ${chrome(600, 240)}
    <text x="32" y="46" font-size="13" fill="${MUTED}">${greet}</text>
    <text x="28" y="150" font-size="88" font-weight="300" letter-spacing="-2" fill="${TEXT}">${hm}<tspan dx="10" font-size="24" font-weight="400" fill="${MUTED}">${ap}</tspan></text>
    <text x="32" y="190" font-size="15" fill="${MUTED}">${esc(date)}</text>
    <text x="568" y="216" font-size="12" text-anchor="end" fill="${FAINT}">${SITE}</text>
  `, "local time");
}

async function statsCard() {
  let name = USER, followers = "—", repos = "—", stars = "—";
  const [u, r] = await Promise.all([
    fetch(`https://api.github.com/users/${USER}`, { headers: gh() }),
    fetch(`https://api.github.com/users/${USER}/repos?per_page=100`, { headers: gh() }),
  ]);
  if (u.ok) {
    const j = await u.json();
    name = j.name || USER;
    followers = j.followers ?? "—";
    repos = j.public_repos ?? "—";
  }
  if (r.ok) stars = (await r.json()).reduce((s, x) => s + (x.stargazers_count || 0), 0);
  const sub = name !== USER ? `@${USER}` : "github";
  const col = (x, v, l) => `
    <text x="${x}" y="138" font-size="34" font-weight="600" text-anchor="middle" fill="${TEXT}">${esc(String(v))}</text>
    <text x="${x}" y="160" font-size="12" text-anchor="middle" fill="${MUTED}">${l}</text>`;
  return svgDoc(720, 200, `
    ${chrome(720, 200, name, sub)}
    <line x1="240" y1="108" x2="240" y2="162" stroke="${BORDER}"/>
    <line x1="480" y1="108" x2="480" y2="162" stroke="${BORDER}"/>
    ${col(120, followers, "followers")}${col(360, repos, "repos")}${col(600, stars, "stars")}
  `, `${USER} on GitHub`);
}

async function streakCard() {
  const cal = await contributions();
  let cur = "—", best = "—", year = "—";
  if (cal?.weeks?.length) {
    const days = cal.weeks.flatMap(w => w.contributionDays);
    let run = 0, longest = 0;
    for (const d of days) {
      run = d.contributionCount > 0 ? run + 1 : 0;
      if (run > longest) longest = run;
    }
    let i = days.length - 1;
    if (days[i].contributionCount === 0) i--; // today isn't over yet
    let c = 0;
    while (i >= 0 && days[i].contributionCount > 0) { c++; i--; }
    cur = c; best = longest; year = cal.totalContributions;
  }
  const col = (x, v, l) => `
    <text x="${x}" y="138" font-size="34" font-weight="600" text-anchor="middle" fill="${TEXT}">${esc(String(v))}</text>
    <text x="${x}" y="160" font-size="12" text-anchor="middle" fill="${MUTED}">${l}</text>`;
  return svgDoc(720, 200, `
    ${chrome(720, 200, "Streak", "contributions in a row")}
    <line x1="240" y1="108" x2="240" y2="162" stroke="${BORDER}"/>
    <line x1="480" y1="108" x2="480" y2="162" stroke="${BORDER}"/>
    ${col(120, cur, "current")}${col(360, best, "longest")}${col(600, year, "past year")}
  `, "contribution streak");
}

async function languagesCard() {
  const rows = await languagesData();
  if (!rows) return svgDoc(720, 120, `${chrome(720, 120, "Languages", "no public code found")}`, "languages");
  const W = 656;
  let x = 32;
  const segs = rows.map(r => {
    const w = Math.max(W * r.pct / 100, 1);
    const s = `<rect x="${x.toFixed(1)}" y="92" width="${w.toFixed(1)}" height="8" fill="${r.color}"/>`;
    x += W * r.pct / 100;
    return s;
  }).join("");
  const legend = rows.map((r, i) => `
    <circle cx="38" cy="${128 + i * 26}" r="4.5" fill="${r.color}"/>
    <text x="52" y="${132 + i * 26}" font-size="13" fill="${TEXT}">${esc(r.name)}</text>
    <text x="688" y="${132 + i * 26}" font-size="12" text-anchor="end" fill="${MUTED}">${r.pct}%</text>`).join("");
  const h = 132 + rows.length * 26 + 6;
  return svgDoc(720, h, `
    ${chrome(720, h, "Languages", "across public repos")}
    <clipPath id="cp"><rect x="32" y="92" width="${W}" height="8" rx="4"/></clipPath>
    <rect x="32" y="92" width="${W}" height="8" rx="4" fill="${TRACK}"/>
    <g clip-path="url(#cp)">${segs}</g>
    ${legend}
  `, "top languages");
}

async function activityCard() {
  const cal = await contributions();
  let weeks, sub;
  if (cal?.weeks?.length) {
    weeks = cal.weeks.slice(-52);
    sub = "contributions, past year";
  } else {
    const counts = {};
    try {
      const r = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=100`, { headers: gh() });
      if (r.ok) for (const e of await r.json()) {
        const d = e.created_at.slice(0, 10);
        counts[d] = (counts[d] || 0) + 1;
      }
    } catch {}
    weeks = fallbackWeeks(counts, 13);
    sub = "recent public activity";
  }
  const cell = 10, gap = 2, y0 = 100;
  const x0 = Math.round((720 - weeks.length * (cell + gap) + gap) / 2);
  const rects = [];
  let labels = "", lastMonth = "";
  weeks.forEach((wk, wi) => {
    const x = x0 + wi * (cell + gap);
    wk.contributionDays.forEach((d, di) => {
      const c = d.contributionCount;
      const lvl = c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 6 ? 3 : 4;
      rects.push(`<rect x="${x}" y="${y0 + di * (cell + gap)}" width="${cell}" height="${cell}" rx="2" fill="${HEAT[lvl]}"/>`);
    });
    const m = new Date(wk.contributionDays[0].date + "T12:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    if (m !== lastMonth) { labels += `<text x="${x}" y="90" font-size="10" fill="${FAINT}">${m}</text>`; lastMonth = m; }
  });
  const swatches = HEAT.map((c, i) => `<rect x="${x0 + 34 + i * 14}" y="200" width="10" height="10" rx="2" fill="${c}"/>`).join("");
  return svgDoc(720, 230, `
    ${chrome(720, 230, "Activity", sub)}
    ${labels}
    ${rects.join("")}
    <text x="${x0}" y="209" font-size="10" fill="${FAINT}">less</text>
    ${swatches}
    <text x="${x0 + 34 + HEAT.length * 14 + 4}" y="209" font-size="10" fill="${FAINT}">more</text>
  `, "contribution activity");
}

function fallbackWeeks(counts, nWeeks) {
  const end = new Date(); end.setHours(12, 0, 0, 0);
  const start = new Date(end.getTime() - (nWeeks * 7 - 1) * 86400000);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday
  const cells = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, contributionCount: counts[key] || 0 });
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push({ contributionDays: cells.slice(i, i + 7) });
  return weeks;
}

function skillsCard() {
  const rows = SKILLS.map(([name, pct], i) => {
    const y = 96 + i * 44;
    return `
    <text x="32" y="${y}" font-size="14" font-weight="500" fill="${TEXT}">${esc(name)}</text>
    <text x="688" y="${y}" font-size="12" text-anchor="end" fill="${MUTED}">${pct}%</text>
    <rect x="32" y="${y + 8}" width="600" height="6" rx="3" fill="${TRACK}"/>
    <rect x="32" y="${y + 8}" width="${6 * pct}" height="6" rx="3" fill="${TEXT}" opacity="0.85"/>`;
  }).join("");
  const h = 88 + SKILLS.length * 44;
  return svgDoc(720, h, `${chrome(720, h, "Skills")}${rows}`, "skills");
}

// ---------- preview page ----------

const page = `<!doctype html><html><head><meta charset="utf-8"><title>${SITE}</title>
<style>
  body{background:#010409;color:#e6edf3;font-family:-apple-system,"Segoe UI",Arial,sans-serif;max-width:760px;margin:0 auto;padding:48px 24px}
  h1{font-size:16px;font-weight:600;margin:0 0 6px}
  p{color:#8b949e;font-size:13px;margin:0 0 40px}
  h2{font-size:12px;font-weight:500;color:#8b949e;margin:28px 0 8px}
  img{display:block;max-width:100%}
</style></head><body>
<h1>${SITE}</h1><p>profile cards for @${USER}</p>
${["time", "stats", "streak", "languages", "activity", "skills"]
  .map(r => `<h2>/${r}</h2><img src="/${r}" alt="${r} card">`).join("")}
</body></html>`;

// ---------- worker ----------

export default {
  async fetch(request) {
    switch (new URL(request.url).pathname) {
      case "/time":      return respond(timeCard(), 60);
      case "/stats":     return respond(await statsCard(), 1800);
      case "/streak":    return respond(await streakCard(), 1800);
      case "/languages": return respond(await languagesCard(), 3600);
      case "/activity":  return respond(await activityCard(), 1800);
      case "/skills":    return respond(skillsCard(), 86400);
      case "/":          return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
      default:           return new Response("not found", { status: 404 });
    }
  },
};
