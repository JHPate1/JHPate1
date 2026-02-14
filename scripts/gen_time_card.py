#!/usr/bin/env python3
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
import subprocess
import json

TZ = "America/New_York"

TIME_OUT = Path("assets/time-card.svg")
STATS_OUT = Path("assets/github-stats.svg")


# ---------- GET GITHUB STATS ----------
def get_stats():
    try:
        commits = subprocess.check_output(
            ["git", "rev-list", "--count", "HEAD"]
        ).decode().strip()
    except:
        commits = "0"

    try:
        contributors = subprocess.check_output(
            ["git", "shortlog", "-sn"]
        ).decode().strip().split("\n")
        contributors = str(len(contributors))
    except:
        contributors = "1"

    return commits, contributors


# ---------- TIME CARD ----------
def make_time_card():
    now = datetime.now(ZoneInfo(TZ))

    time_main = now.strftime("%I:%M").lstrip("0")
    ampm = now.strftime("%p")
    date_line = now.strftime("%A, %B %d")

    if 5 <= now.hour < 12:
        c1, c2 = "#0ea5e9", "#22c55e"
    elif 12 <= now.hour < 17:
        c1, c2 = "#fb923c", "#f43f5e"
    elif 17 <= now.hour < 21:
        c1, c2 = "#a855f7", "#6366f1"
    else:
        c1, c2 = "#0f172a", "#1d4ed8"

    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="300">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
<stop offset="0%" stop-color="{c1}"/>
<stop offset="100%" stop-color="{c2}"/>
</linearGradient>
</defs>

<rect x="40" y="45" rx="28" width="480" height="210" fill="url(#g)"/>

<text x="90" y="150" fill="white" font-size="90" font-family="Arial" font-weight="700">
{time_main}
</text>
<text x="300" y="150" fill="white" font-size="30" font-family="Arial">{ampm}</text>
<text x="90" y="200" fill="white" font-size="28" font-family="Arial">{date_line}</text>
</svg>
"""
    TIME_OUT.write_text(svg)


# ---------- SKILL CARD ----------
def make_skill_card():
    commits, contributors = get_stats()

    skills = [
        ("HTML", 70),
        ("SCSS", 80),
        ("Bootstrap", 50),
    ]

    bars = ""
    y = 70

    for name, percent in skills:
        width = percent * 4
        bars += f"""
        <text x="40" y="{y}" fill="white" font-size="18">{name}</text>
        <rect x="40" y="{y+10}" width="400" height="10" rx="6" fill="#555"/>
        <rect x="40" y="{y+10}" width="{width}" height="10" rx="6" fill="white"/>
        <text x="{50+width}" y="{y+20}" fill="white" font-size="12">{percent}%</text>
        """
        y += 60

    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="300">
<rect width="100%" height="100%" rx="20" fill="#1f1f1f"/>

<text x="40" y="40" fill="white" font-size="24" font-weight="700">
GitHub Skills
</text>

{bars}

<text x="40" y="260" fill="#aaa" font-size="14">
Commits: {commits}   Contributors: {contributors}
</text>
</svg>
"""
    STATS_OUT.write_text(svg)


# ---------- RUN ----------
Path("assets").mkdir(exist_ok=True)

make_time_card()
make_skill_card()
print("Cards updated.")
