#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
import subprocess

TZ = "America/New_York"

ASSETS = Path("assets")
TIME_OUT = ASSETS / "time-card.svg"
STATS_OUT = ASSETS / "github-stats.svg"
SKILLS_OUT = ASSETS / "skills.svg"


def run_git(*args: str) -> str:
    try:
        return subprocess.check_output(["git", *args]).decode("utf-8", "replace").strip()
    except Exception:
        return ""


def pick_theme(hour: int) -> tuple[str, str]:
    # Auto color by time of day
    if 5 <= hour < 12:   # morning
        return ("#0ea5e9", "#22c55e")
    if 12 <= hour < 17:  # afternoon
        return ("#fb923c", "#f43f5e")
    if 17 <= hour < 21:  # evening
        return ("#a855f7", "#6366f1")
    return ("#0f172a", "#1d4ed8")  # night


def ordinal(n: int) -> str:
    if 11 <= (n % 100) <= 13:
        return "th"
    return {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")


def esc(s: str) -> str:
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;"))


def make_time_card() -> None:
    now = datetime.now(ZoneInfo(TZ))
    c1, c2 = pick_theme(now.hour)

    time_main = now.strftime("%I:%M").lstrip("0")
    ampm = now.strftime("%p")
    day = int(now.strftime("%d"))
    date_line = f"{now.strftime('%A')}, {now.strftime('%B')} {day}{ordinal(day)}"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="560" height="300" viewBox="0 0 560 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>

  <rect x="40" y="45" rx="28" ry="28" width="480" height="210" fill="url(#bg)" filter="url(#shadow)"/>
  <path d="M68 75 C180 20, 380 20, 492 75 L492 105 C380 70, 180 70, 68 105 Z" fill="#fff" opacity="0.12"/>

  <text x="88" y="155" fill="#fff"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="96" font-weight="800" letter-spacing="-2">{esc(time_main)}</text>

  <text x="320" y="155" fill="#fff"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="28" font-weight="700" opacity="0.92">{esc(ampm)}</text>

  <text x="92" y="200" fill="#fff"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="28" font-weight="600" opacity="0.95">{esc(date_line)}</text>

  <g transform="translate(458,78) scale(1.35)" fill="#fff" opacity="0.95">
    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
    <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162z"/>
  </g>

  <text x="92" y="235" fill="#fff" opacity="0.70"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="14">Auto-updated • {esc(TZ)}</text>
</svg>
"""
    TIME_OUT.write_text(svg, encoding="utf-8")


def make_github_stats() -> None:
    commits = run_git("rev-list", "--count", "HEAD") or "0"
    contributors = run_git("shortlog", "-sn")
    contrib_count = str(len([l for l in contributors.splitlines() if l.strip()])) if contributors else "1"

    # Very lightweight "stats card"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="220" viewBox="0 0 720 220">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>
  </defs>

  <rect x="20" y="20" rx="22" width="680" height="180" fill="url(#bg)"/>
  <text x="52" y="70" fill="#fff" font-size="26" font-weight="800"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">GitHub Stats</text>

  <text x="52" y="115" fill="#e5e7eb" font-size="18"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">Commits</text>
  <text x="52" y="145" fill="#fff" font-size="34" font-weight="800"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">{esc(commits)}</text>

  <text x="260" y="115" fill="#e5e7eb" font-size="18"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">Contributors</text>
  <text x="260" y="145" fill="#fff" font-size="34" font-weight="800"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">{esc(contrib_count)}</text>

  <text x="52" y="182" fill="#9ca3af" font-size="14"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">Generated from repo history</text>
</svg>
"""
    STATS_OUT.write_text(svg, encoding="utf-8")


def make_skills() -> None:
    # Edit these any time
    skills = [
        ("HTML", 70),
        ("SCSS", 80),
        ("Bootstrap", 50),
    ]

    y = 74
    rows = []
    for name, pct in skills:
        bar_w = 420
        fill_w = int(bar_w * (pct / 100))
        rows.append(f"""
  <text x="56" y="{y}" fill="#e5e7eb" font-size="16" font-weight="700"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">{esc(name)}</text>

  <rect x="56" y="{y+16}" width="{bar_w}" height="12" rx="8" fill="rgba(255,255,255,0.12)"/>
  <rect x="56" y="{y+16}" width="{fill_w}" height="12" rx="8" fill="#ffffff"/>

  <text x="{56+fill_w+10}" y="{y+26}" fill="#ffffff" font-size="12" font-weight="800"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">{pct}%</text>
""")
        y += 58

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="260" viewBox="0 0 720 260">
  <rect x="20" y="20" rx="22" width="680" height="220" fill="#282828"/>
  <text x="52" y="64" fill="#fff" font-size="24" font-weight="900"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">Skills</text>
  {''.join(rows)}
</svg>
"""
    SKILLS_OUT.write_text(svg, encoding="utf-8")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    make_time_card()
    make_github_stats()
    make_skills()
    print("Generated:", TIME_OUT, STATS_OUT, SKILLS_OUT)


if __name__ == "__main__":
    main()
