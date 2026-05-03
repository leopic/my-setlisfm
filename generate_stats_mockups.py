#!/usr/bin/env python3
"""Generate three Stats tab concept mockups for Chronicles app."""

import cairosvg

# Color palette
BG = "#08090f"
SURFACE = "#0d1122"
SURFACE_RAISED = "#131828"
BORDER = "#1a2035"
ACCENT = "#00e8ff"
TEXT_PRIMARY = "#dde4f5"
TEXT_SECONDARY = "#5a7090"
TEXT_MUTED = "#3a4e68"
TEXT_DISABLED = "#1e2d45"
ORANGE = "#ff9f0a"
GREEN = "#30d158"

W = 390
H = 844
FONT = "Helvetica Neue, Arial, sans-serif"

# Data
YEARLY = [("10",8),("11",15),("12",22),("13",28),("14",31),("15",38),("16",35),("17",42),("18",38),("19",45),("20",8),("21",12),("22",41),("23",48),("24",44)]
CUMULATIVE = [8,23,45,73,104,142,177,219,257,302,310,322,363,411,455]


def status_bar():
    """Returns SVG for the status bar with dynamic island."""
    return f'''
  <!-- Status bar -->
  <rect x="0" y="0" width="{W}" height="54" fill="{BG}"/>
  <!-- Dynamic island -->
  <rect x="150" y="12" width="90" height="32" rx="16" fill="#000000"/>
  <!-- Time -->
  <text x="30" y="34" font-family="{FONT}" font-size="15" font-weight="600" fill="{TEXT_PRIMARY}">9:41</text>
  <!-- Battery/signal icons (simplified) -->
  <rect x="330" y="22" width="22" height="11" rx="2.5" fill="none" stroke="{TEXT_PRIMARY}" stroke-width="1.5"/>
  <rect x="352" y="25" width="3" height="5" rx="1" fill="{TEXT_PRIMARY}"/>
  <rect x="331.5" y="23.5" width="14" height="8" rx="1.5" fill="{TEXT_PRIMARY}"/>
  <circle cx="310" cy="27" r="5" fill="none" stroke="{TEXT_PRIMARY}" stroke-width="1.5"/>
  <circle cx="310" cy="27" r="2" fill="{TEXT_PRIMARY}"/>
  <rect x="289" y="22" width="3" height="10" rx="1" fill="{TEXT_PRIMARY}"/>
  <rect x="294" y="24" width="3" height="8" rx="1" fill="{TEXT_PRIMARY}"/>
  <rect x="299" y="26" width="3" height="6" rx="1" fill="{TEXT_PRIMARY}"/>
    '''


def tab_bar():
    """Returns SVG for the bottom tab bar."""
    tabs = [
        ("Home", "○", False),
        ("Concerts", "○", False),
        ("Artists", "○", False),
        ("Venues", "○", False),
        ("Stats", "◉", True),
    ]
    tab_w = W / len(tabs)
    result = f'''
  <!-- Tab bar background -->
  <rect x="0" y="{H-83}" width="{W}" height="83" fill="{SURFACE}"/>
  <line x1="0" y1="{H-83}" x2="{W}" y2="{H-83}" stroke="{BORDER}" stroke-width="1"/>
    '''
    for i, (label, icon, active) in enumerate(tabs):
        cx = tab_w * i + tab_w / 2
        color = ACCENT if active else TEXT_MUTED
        weight = "600" if active else "400"
        result += f'''
  <text x="{cx}" y="{H-58}" font-family="{FONT}" font-size="16" text-anchor="middle" fill="{color}">{icon}</text>
  <text x="{cx}" y="{H-36}" font-family="{FONT}" font-size="10" font-weight="{weight}" text-anchor="middle" fill="{color}">{label}</text>
        '''
    # Home indicator
    result += f'''
  <rect x="155" y="{H-12}" width="80" height="5" rx="2.5" fill="{TEXT_PRIMARY}" opacity="0.4"/>
    '''
    return result


def bar_chart_svg(x, y, width, height, label=None):
    """Generate a bar chart SVG group."""
    max_val = max(v for _, v in YEARLY)
    bar_area_w = width - 20
    bar_w = bar_area_w / len(YEARLY) * 0.65
    gap = bar_area_w / len(YEARLY)

    result = ""
    if label:
        result += f'<text x="{x+10}" y="{y-8}" font-family="{FONT}" font-size="11" font-weight="600" fill="{TEXT_SECONDARY}" letter-spacing="1">{label}</text>'

    for i, (yr, val) in enumerate(YEARLY):
        bar_h = (val / max_val) * (height - 24)
        bx = x + 10 + i * gap + (gap - bar_w) / 2
        by = y + height - 18 - bar_h
        opacity = 0.25 + 0.75 * (val / max_val)
        # Highlight 2023 (index 13) as busiest
        color = ACCENT if yr == "23" else ACCENT
        result += f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bar_w:.1f}" height="{bar_h:.1f}" rx="2" fill="{color}" opacity="{opacity:.2f}"/>'

    # X-axis labels — only a few
    label_indices = [0, 4, 9, 14]
    for i in label_indices:
        yr, _ = YEARLY[i]
        lx = x + 10 + i * gap + gap / 2
        result += f'<text x="{lx:.1f}" y="{y+height-4}" font-family="{FONT}" font-size="9" text-anchor="middle" fill="{TEXT_MUTED}">\'{yr}</text>'

    return result


def line_chart_svg(x, y, width, height, label=None):
    """Generate a cumulative line chart SVG group."""
    max_val = max(CUMULATIVE)
    n = len(CUMULATIVE)

    points = []
    for i, val in enumerate(CUMULATIVE):
        px = x + 10 + i * (width - 20) / (n - 1)
        py = y + height - 20 - (val / max_val) * (height - 30)
        points.append((px, py))

    pts_str = " ".join(f"{px:.1f},{py:.1f}" for px, py in points)
    # Area fill — build a path
    area_pts = f"M {points[0][0]:.1f},{y+height-20} " + " ".join(f"L{px:.1f},{py:.1f}" for px, py in points) + f" L{points[-1][0]:.1f},{y+height-20} Z"

    result = ""
    if label:
        result += f'<text x="{x+10}" y="{y-8}" font-family="{FONT}" font-size="11" font-weight="600" fill="{TEXT_SECONDARY}" letter-spacing="1">{label}</text>'

    # Area fill
    result += f'<path d="{area_pts}" fill="{ACCENT}" opacity="0.08"/>'
    # Line
    result += f'<polyline points="{pts_str}" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linejoin="round"/>'
    # Dots at ends
    result += f'<circle cx="{points[0][0]:.1f}" cy="{points[0][1]:.1f}" r="3" fill="{ACCENT}"/>'
    result += f'<circle cx="{points[-1][0]:.1f}" cy="{points[-1][1]:.1f}" r="4" fill="{ACCENT}"/>'

    # X axis labels
    label_indices = [0, 4, 9, 14]
    for i in label_indices:
        yr = YEARLY[i][0]
        lx = x + 10 + i * (width - 20) / (n - 1)
        result += f'<text x="{lx:.1f}" y="{y+height-5}" font-family="{FONT}" font-size="9" text-anchor="middle" fill="{TEXT_MUTED}">\'{yr}</text>'

    return result


def stat_card(x, y, w, h, value, label, color=None, sub=None):
    """Two-line stat card with big value and label."""
    color = color or ACCENT
    result = f'''
  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{SURFACE_RAISED}"/>
  <text x="{x+w//2}" y="{y+h//2-6}" font-family="{FONT}" font-size="26" font-weight="700" text-anchor="middle" fill="{color}">{value}</text>
  <text x="{x+w//2}" y="{y+h//2+16}" font-family="{FONT}" font-size="11" text-anchor="middle" fill="{TEXT_SECONDARY}">{label}</text>
    '''
    if sub:
        result += f'<text x="{x+w//2}" y="{y+h//2+30}" font-family="{FONT}" font-size="10" text-anchor="middle" fill="{TEXT_MUTED}">{sub}</text>'
    return result


def section_header(x, y, label):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="11" font-weight="700" fill="{TEXT_SECONDARY}" letter-spacing="1.5">{label}</text>'


# ─────────────────────────────────────────────────────────────────
# CONCEPT 1 — "Sections"
# ─────────────────────────────────────────────────────────────────
def concept1_svg():
    pad = 16
    card_gap = 10
    card_w = (W - pad * 2 - card_gap) // 2

    content_top = 54
    content_bottom = H - 83
    scroll_h = content_bottom - content_top

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">
  <defs>
    <clipPath id="screen">
      <rect x="0" y="0" width="{W}" height="{H}" rx="0"/>
    </clipPath>
  </defs>
  <g clip-path="url(#screen)">
  <!-- Background -->
  <rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>
'''

    svg += status_bar()

    # Page title
    svg += f'<text x="{pad}" y="88" font-family="{FONT}" font-size="28" font-weight="700" fill="{TEXT_PRIMARY}">Stats</text>'

    y = 108

    # ── CONCERTS section ──
    svg += section_header(pad, y, "CONCERTS")
    y += 14

    # Two stat cards
    svg += stat_card(pad, y, card_w, 76, "390", "total shows", ACCENT)
    svg += stat_card(pad + card_w + card_gap, y, card_w, 76, "14 yrs", "since 2010", ORANGE)
    y += 76 + card_gap

    # Shows per year bar chart
    svg += f'<rect x="{pad}" y="{y}" width="{W-pad*2}" height="110" rx="12" fill="{SURFACE_RAISED}"/>'
    svg += bar_chart_svg(pad + 4, y + 22, W - pad * 2 - 8, 84, "SHOWS PER YEAR")
    y += 110 + card_gap

    # Two more stat cards
    svg += stat_card(pad, y, card_w, 68, "48", "best year (2023)", GREEN)
    svg += stat_card(pad + card_w + card_gap, y, card_w, 68, "12 days", "longest streak", ORANGE)
    y += 68 + 14

    # ── ARTISTS section ──
    svg += section_header(pad, y, "ARTISTS")
    y += 14

    svg += stat_card(pad, y, card_w, 68, "142", "artists seen", ACCENT)
    svg += stat_card(pad + card_w + card_gap, y, card_w, 68, "43%", "one-off artists", TEXT_SECONDARY)
    y += 68 + 14

    # ── PLACES section ──
    svg += section_header(pad, y, "PLACES")
    y += 14

    svg += stat_card(pad, y, card_w, 68, "14", "countries", ACCENT)
    svg += stat_card(pad + card_w + card_gap, y, card_w, 68, "June", "best month", ORANGE)

    svg += tab_bar()
    svg += '''
  </g>
</svg>'''
    return svg


# ─────────────────────────────────────────────────────────────────
# CONCEPT 2 — "Big Picture"
# ─────────────────────────────────────────────────────────────────
def concept2_svg():
    pad = 16
    card_gap = 10

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">
  <defs>
    <clipPath id="screen2">
      <rect x="0" y="0" width="{W}" height="{H}" rx="0"/>
    </clipPath>
  </defs>
  <g clip-path="url(#screen2)">
  <rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>
'''

    svg += status_bar()

    y = 62
    # Page title line
    svg += f'<text x="{pad}" y="{y+22}" font-family="{FONT}" font-size="22" font-weight="700" fill="{TEXT_PRIMARY}">Your History</text>'
    y += 38

    # 2x2 hero stats grid
    half_w = (W - pad * 2 - card_gap) // 2
    hero_h = 88

    # Row 1
    svg += f'<rect x="{pad}" y="{y}" width="{half_w}" height="{hero_h}" rx="14" fill="{SURFACE}"/>'
    svg += f'<text x="{pad + half_w//2}" y="{y+44}" font-family="{FONT}" font-size="36" font-weight="800" text-anchor="middle" fill="{ACCENT}">390</text>'
    svg += f'<text x="{pad + half_w//2}" y="{y+64}" font-family="{FONT}" font-size="12" text-anchor="middle" fill="{TEXT_SECONDARY}">shows</text>'

    svg += f'<rect x="{pad+half_w+card_gap}" y="{y}" width="{half_w}" height="{hero_h}" rx="14" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+half_w+card_gap + half_w//2}" y="{y+44}" font-family="{FONT}" font-size="36" font-weight="800" text-anchor="middle" fill="{ORANGE}">14</text>'
    svg += f'<text x="{pad+half_w+card_gap + half_w//2}" y="{y+64}" font-family="{FONT}" font-size="12" text-anchor="middle" fill="{TEXT_SECONDARY}">years</text>'

    y += hero_h + card_gap

    # Row 2
    svg += f'<rect x="{pad}" y="{y}" width="{half_w}" height="{hero_h}" rx="14" fill="{SURFACE}"/>'
    svg += f'<text x="{pad + half_w//2}" y="{y+44}" font-family="{FONT}" font-size="36" font-weight="800" text-anchor="middle" fill="{GREEN}">14</text>'
    svg += f'<text x="{pad + half_w//2}" y="{y+64}" font-family="{FONT}" font-size="12" text-anchor="middle" fill="{TEXT_SECONDARY}">countries</text>'

    svg += f'<rect x="{pad+half_w+card_gap}" y="{y}" width="{half_w}" height="{hero_h}" rx="14" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+half_w+card_gap + half_w//2}" y="{y+44}" font-family="{FONT}" font-size="36" font-weight="800" text-anchor="middle" fill="{ACCENT}">142</text>'
    svg += f'<text x="{pad+half_w+card_gap + half_w//2}" y="{y+64}" font-family="{FONT}" font-size="12" text-anchor="middle" fill="{TEXT_SECONDARY}">artists</text>'

    y += hero_h + 18

    # Bar chart — dominant, full width
    chart_h = 148
    svg += f'<rect x="{pad}" y="{y}" width="{W-pad*2}" height="{chart_h}" rx="14" fill="{SURFACE}"/>'
    svg += bar_chart_svg(pad + 4, y + 22, W - pad * 2 - 8, chart_h - 12, "SHOWS PER YEAR")
    y += chart_h + 18

    # Compact 3-column fact grid
    fact_w = (W - pad * 2 - card_gap * 2) // 3
    fact_h = 72
    facts = [
        (ORANGE, "June", "best month"),
        (ACCENT, "847", "longest gap (days)"),
        (GREEN, "43%", "one-off artists"),
    ]
    for i, (color, val, lbl) in enumerate(facts):
        fx = pad + i * (fact_w + card_gap)
        svg += f'<rect x="{fx}" y="{y}" width="{fact_w}" height="{fact_h}" rx="10" fill="{SURFACE}"/>'
        svg += f'<text x="{fx + fact_w//2}" y="{y+32}" font-family="{FONT}" font-size="20" font-weight="700" text-anchor="middle" fill="{color}">{val}</text>'
        svg += f'<text x="{fx + fact_w//2}" y="{y+50}" font-family="{FONT}" font-size="9" text-anchor="middle" fill="{TEXT_SECONDARY}">{lbl}</text>'

    svg += tab_bar()
    svg += '''
  </g>
</svg>'''
    return svg


# ─────────────────────────────────────────────────────────────────
# CONCEPT 3 — "Chronicle"
# ─────────────────────────────────────────────────────────────────
def concept3_svg():
    pad = 16

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">
  <defs>
    <clipPath id="screen3">
      <rect x="0" y="0" width="{W}" height="{H}" rx="0"/>
    </clipPath>
  </defs>
  <g clip-path="url(#screen3)">
  <rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>
'''

    svg += status_bar()

    y = 62

    # Headline display text
    svg += f'<text x="{pad}" y="{y+48}" font-family="{FONT}" font-size="54" font-weight="800" fill="{TEXT_PRIMARY}">390</text>'
    svg += f'<text x="{pad+102}" y="{y+48}" font-family="{FONT}" font-size="24" font-weight="300" fill="{TEXT_SECONDARY}"> shows</text>'
    y += 56
    svg += f'<text x="{pad}" y="{y+8}" font-family="{FONT}" font-size="16" font-weight="400" fill="{TEXT_MUTED}">14 years  ·  14 countries  ·  142 artists</text>'
    y += 28

    # Accent line
    svg += f'<rect x="{pad}" y="{y}" width="40" height="3" rx="1.5" fill="{ACCENT}"/>'
    y += 18

    # Cumulative line chart section
    svg += f'<text x="{pad}" y="{y+14}" font-family="{FONT}" font-size="13" font-weight="600" fill="{TEXT_PRIMARY}">Every show, stacked up</text>'
    y += 22

    chart_h = 130
    svg += f'<rect x="{pad}" y="{y}" width="{W-pad*2}" height="{chart_h}" rx="14" fill="{SURFACE}"/>'
    svg += line_chart_svg(pad + 4, y + 16, W - pad * 2 - 8, chart_h - 12)

    # End value annotation
    last_x = pad + 4 + 10 + (W - pad * 2 - 8 - 20)
    svg += f'<text x="{last_x - 8}" y="{y+30}" font-family="{FONT}" font-size="12" font-weight="700" text-anchor="end" fill="{ACCENT}">455 shows</text>'

    y += chart_h + 20

    # ── Artist insights row ──
    svg += f'<text x="{pad}" y="{y+4}" font-family="{FONT}" font-size="14" font-weight="600" fill="{TEXT_PRIMARY}">Artist insights</text>'
    svg += f'<text x="{W-pad}" y="{y+4}" font-family="{FONT}" font-size="12" text-anchor="end" fill="{ACCENT}">→</text>'
    y += 16

    card_w = 156
    card_h = 82
    # Card 1
    svg += f'<rect x="{pad}" y="{y}" width="{card_w}" height="{card_h}" rx="12" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+12}" y="{y+28}" font-family="{FONT}" font-size="22" font-weight="700" fill="{ACCENT}">142</text>'
    svg += f'<text x="{pad+12}" y="{y+46}" font-family="{FONT}" font-size="11" fill="{TEXT_SECONDARY}">artists seen</text>'
    svg += f'<text x="{pad+12}" y="{y+64}" font-family="{FONT}" font-size="10" fill="{TEXT_MUTED}">across 14 years</text>'
    # Card 2
    svg += f'<rect x="{pad+card_w+12}" y="{y}" width="{card_w}" height="{card_h}" rx="12" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+card_w+24}" y="{y+28}" font-family="{FONT}" font-size="22" font-weight="700" fill="{ORANGE}">43%</text>'
    svg += f'<text x="{pad+card_w+24}" y="{y+46}" font-family="{FONT}" font-size="11" fill="{TEXT_SECONDARY}">one-off artists</text>'
    svg += f'<text x="{pad+card_w+24}" y="{y+64}" font-family="{FONT}" font-size="10" fill="{TEXT_MUTED}">never seen again</text>'

    y += card_h + 18

    # ── On the road row ──
    svg += f'<text x="{pad}" y="{y+4}" font-family="{FONT}" font-size="14" font-weight="600" fill="{TEXT_PRIMARY}">On the road</text>'
    svg += f'<text x="{W-pad}" y="{y+4}" font-family="{FONT}" font-size="12" text-anchor="end" fill="{ACCENT}">→</text>'
    y += 16

    # Card 3
    svg += f'<rect x="{pad}" y="{y}" width="{card_w}" height="{card_h}" rx="12" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+12}" y="{y+28}" font-family="{FONT}" font-size="22" font-weight="700" fill="{GREEN}">14</text>'
    svg += f'<text x="{pad+12}" y="{y+46}" font-family="{FONT}" font-size="11" fill="{TEXT_SECONDARY}">countries visited</text>'
    svg += f'<text x="{pad+12}" y="{y+64}" font-family="{FONT}" font-size="10" fill="{TEXT_MUTED}">for live music</text>'
    # Card 4
    svg += f'<rect x="{pad+card_w+12}" y="{y}" width="{card_w}" height="{card_h}" rx="12" fill="{SURFACE}"/>'
    svg += f'<text x="{pad+card_w+24}" y="{y+28}" font-family="{FONT}" font-size="22" font-weight="700" fill="{ACCENT}">June</text>'
    svg += f'<text x="{pad+card_w+24}" y="{y+46}" font-family="{FONT}" font-size="11" fill="{TEXT_SECONDARY}">favourite month</text>'
    svg += f'<text x="{pad+card_w+24}" y="{y+64}" font-family="{FONT}" font-size="10" fill="{TEXT_MUTED}">most shows attended</text>'

    svg += tab_bar()
    svg += '''
  </g>
</svg>'''
    return svg


def main():
    concepts = [
        (concept1_svg, "/Users/leo/code/my-setlistfm/assets/stats-concept-1.png", "Concept 1 — Sections"),
        (concept2_svg, "/Users/leo/code/my-setlistfm/assets/stats-concept-2.png", "Concept 2 — Big Picture"),
        (concept3_svg, "/Users/leo/code/my-setlistfm/assets/stats-concept-3.png", "Concept 3 — Chronicle"),
    ]

    for fn, path, name in concepts:
        svg_str = fn()
        cairosvg.svg2png(
            bytestring=svg_str.encode("utf-8"),
            write_to=path,
            output_width=780,
            output_height=1688,
        )
        print(f"[OK] {name} → {path}")


if __name__ == "__main__":
    main()
