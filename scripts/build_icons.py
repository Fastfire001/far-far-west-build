"""Generates one SVG icon per element of data/ in assets/icons/<id>.svg: jokers, upgrades, equipment, spell
schools and spells, plus the hero (itemHero).

Usage: python3 scripts/build_icons.py <data_dir> <out_dir>

The icons are original drawings that follow the game's visual codes without copying its assets:
- jokers: a card in the colour of their rarity, one dot per slot they cost, and a white drawing of their own, on the
  same subject as the joker's card in the game;
- spells and spell schools: a round badge in the colour of their school (`school_colors` in manual.json), with a
  pictogram on the same subject as the spell's icon in the game;
- equipment and the hero: a light silhouette on a dark tile;
- upgrades: a hexagon in the colour of their stat on the game's upgrade screen (`color` in upgrades.json).

Pictograms are drawn in a 100x100 box with fill="currentColor". Every id found in data/ must have an entry in the
tables below: a new joker or item after a game update makes the script fail until it gets one.
"""
import hashlib, html, json, math, os, sys

data_dir, out_dir = sys.argv[1:3]

RARITY_COLORS = {
    "Normal": "#8c7b5e", "Fine": "#6a8a2b", "Prime": "#2f6fae",
    "Mythic": "#7b3fa3", "Legendary": "#c9821a", "Unique": "#a3232e",
}
# Hand-entered from the game (data/manual.json), like the spell cooldowns.
SCHOOL_COLORS = {school: color for school, color in json.load(open(os.path.join(data_dir, "manual.json")))["school_colors"].items()
                 if not school.startswith("_")}
TILE_COLOR, SILHOUETTE_COLOR = "#2b211b", "#ecd9b2"
DARK_GLYPH = "#1c1d22"


# --- Pictogram library (100x100 box) -------------------------------------------------------------------------

def P(d, rule="nonzero"):
    return f'<path d="{d}" fill-rule="{rule}"/>'


def stroke(d, width=10, cap="round"):
    return (f'<path d="{d}" fill="none" stroke="currentColor" stroke-width="{width}" '
            f'stroke-linecap="{cap}" stroke-linejoin="round"/>')


def circle(cx, cy, r):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}"/>'


def ring(cx, cy, r, width=10):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="currentColor" stroke-width="{width}"/>'


def hole(cx, cy, r):
    """Circular subpath, to punch holes in a path with fill-rule evenodd."""
    return f"M{cx - r} {cy}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0Z"


def star_points(cx, cy, n, outer, inner, rotation=-90):
    points = []
    for i in range(2 * n):
        r = outer if i % 2 == 0 else inner
        a = math.radians(rotation + i * 180 / n)
        points.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return f'<polygon points="{" ".join(points)}"/>'


def group(content, transform):
    return f'<g transform="{transform}">{content}</g>'


def at(content, cx, cy, scale=1, rotate=0):
    """Places a pictogram drawn in the 100x100 box with its centre at (cx, cy), scaled and rotated."""
    return group(content, f"translate({cx} {cy}) rotate({rotate}) scale({scale}) translate(-50 -50)")


def cut(content, holes):
    """Punches holes (any pictogram, drawn in black) out of content, so the card shows through."""
    # The mask id comes from what it cuts, so that changing one drawing does not renumber the others' masks.
    mask = "k" + hashlib.md5((content + holes).encode()).hexdigest()[:8]
    return (f'<mask id="{mask}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="300" height="300">'
            f'<rect x="-100" y="-100" width="300" height="300" fill="#fff"/><g fill="#000" color="#000">{holes}</g></mask>'
            f'<g mask="url(#{mask})">{content}</g>')



def arrow(x0, y0, x1, y1, width=6, head=16):
    """A straight arrow from (x0, y0) to its tip at (x1, y1)."""
    length = math.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / length, (y1 - y0) / length
    bx, by = x1 - head * ux, y1 - head * uy
    corners = [(x1, y1), (bx - head * .6 * uy, by + head * .6 * ux), (bx + head * .6 * uy, by - head * .6 * ux)]
    return (stroke(f"M{x0} {y0}L{bx + 2 * ux:.1f} {by + 2 * uy:.1f}", width, "butt")
            + f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in corners)}"/>')

G = {}

G["burst"] = star_points(50, 50, 9, 46, 22)
G["plus"] = P("M38 8h24v30h30v24H62v30H38V62H8V38h30z")
G["minus"] = P("M8 38h84v24H8z")
G["up"] = P("M50 6 90 50H64v44H36V50H10z")
G["down"] = P("M50 94 90 50H64V6H36v44H10z")
G["heart"] = P("M50 90C12 62 4 38 22 21c12-11 24-6 28 6 4-12 16-17 28-6 18 17 10 41-28 69z")
G["shield"] = P("M50 6 88 18v30c0 25-17 38-38 46C29 86 12 73 12 48V18z")
G["bullet"] = P("M37 32c0-14 13-26 13-26s13 12 13 26v52H37z") + P("M33 84h34v10H33z")
G["bullets"] = (group(G["bullet"], "translate(-24 8) scale(.85)") + group(G["bullet"], "translate(7.5 0) scale(.85)")
                + group(G["bullet"], "translate(39 8) scale(.85)"))
G["crosshair"] = (ring(50, 50, 30, 9) + P("M45 4h10v26H45zM45 70h10v26H45zM4 45h26v10H4zM70 45h26v10H70z")
                  + circle(50, 50, 7))
G["bolt"] = P("M60 4 20 56h26l-10 40 46-56H56z")
G["flame"] = P("M50 4c12 22 34 34 32 60-2 20-16 32-32 32S18 84 18 64c0-18 12-26 16-40 6 12 10 16 14 18 4-12 4-26 2-38z")
# Placeholder for an item whose icon is still to draw: grep "TODO icon" to find them.
G["todo"] = stroke("M32 32a18 18 0 1 1 26 16c-6 3-8 7-8 14v4", 11) + circle(50, 82, 7)
G["drop"] = P("M50 6c14 24 32 42 32 60 0 18-14 30-32 30S18 84 18 66c0-18 18-36 32-60z")
G["snowflake"] = "".join(group(P("M45 6h10v88H45z") + P("M50 22 36 10l6-6 8 8 8-8 6 6zM50 78 36 90l6 6 8-8 8 8 6-6z"),
                               f"rotate({a} 50 50)") for a in (0, 60, 120))
G["cactus"] = (P("M40 94V22c0-14 20-14 20 0v72z") + P("M40 60H28c-8 0-10-6-10-12V34c0-8 12-8 12 0v14h10z")
               + P("M60 48h12V30c0-8 12-8 12 0v16c0 8-4 14-12 14H60z"))
G["skull"] = P("M50 8C26 8 12 24 12 46c0 14 7 22 16 26v18h44V72c9-4 16-12 16-26C88 24 74 8 50 8z"
               + hole(34, 46, 9) + hole(66, 46, 9) + "M44 64h12v8H44z", "evenodd")
G["ghost"] = P("M50 6C28 6 16 24 16 46v48l12-10 11 10 11-10 11 10 11-10 12 10V46C84 24 72 6 50 6z"
               + hole(38, 42, 7) + hole(62, 42, 7), "evenodd")
G["hourglass"] = P("M22 6h56v10c0 20-20 28-20 34s20 14 20 34v10H22V84c0-20 20-28 20-34S22 36 22 16z"
                   "M32 16c0 14 18 22 18 30 0-8 18-16 18-30z", "evenodd")
G["chevrons"] = P("M10 18h22l28 32-28 32H10l28-32zM46 18h22l28 32-28 32H46l28-32z")
G["reload"] = stroke("M82 52a32 32 0 1 1-14-28", 12) + P("M58 6 90 22 62 40z")
G["note"] = P("M36 16 84 6v62a12 10 0 1 1-8-9V24L44 31v49a12 10 0 1 1-8-9z")
G["boomerang"] = stroke("M10 34Q40 38 50 72 60 38 90 34", 17)
G["sheriff"] = star_points(50, 50, 6, 46, 24) + "".join(
    circle(round(50 + 44 * math.cos(math.radians(-90 + i * 60)), 1), round(50 + 44 * math.sin(math.radians(-90 + i * 60)), 1), 7)
    for i in range(6))
G["bell"] = P("M50 8c-18 0-26 18-26 38v20L12 80h76L76 66V46C76 26 68 8 50 8z") + circle(50, 88, 8)
G["moon"] = P("M60 6A44 44 0 1 0 94 64 34 34 0 1 1 60 6z")
G["arrow"] = group(P("M10 46h62v8H10z") + P("M68 32 96 50 68 68z") + P("M4 34h16l10 12H14zM4 66h16l10-12H14z"), "rotate(-40 50 50)")
G["lasso"] = stroke("M30 52c-14-6-20-18-12-28 10-12 40-14 56-2 12 10 8 24-8 28-12 3-26 2-36 2", 8) + stroke(
    "M30 52c2 14 6 26 18 40", 8)
G["tooth"] = P("M26 10c10-4 18 2 24 2s14-6 24-2c12 6 14 22 8 38-4 12-4 24-8 38-2 6-10 6-12 0l-6-22c-2-6-10-6-12 0l-6 22c-2 6-10 6-12 0-4-14-4-26-8-38-6-16-4-32 8-38z")
G["bottle"] = P("M42 6h16v8h-2v18c12 4 18 14 18 26v28a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V58c0-12 6-22 18-26V14h-2z")
G["cube"] = P("M50 6 90 28v44L50 94 10 72V28z") + P("M50 50 90 28M50 50v44M50 50 10 28", "nonzero").replace(
    "<path", '<path fill="none" stroke="#000" stroke-opacity=".35" stroke-width="5"')
G["portal"] = (f'<ellipse cx="30" cy="50" rx="14" ry="38" fill="none" stroke="currentColor" stroke-width="9"/>'
               f'<ellipse cx="70" cy="50" rx="14" ry="38" fill="none" stroke="currentColor" stroke-width="9"/>')
G["cloud"] = P("M26 70a18 18 0 0 1 0-36 24 24 0 0 1 46-6 20 20 0 0 1 4 42z")
G["spring"] = stroke("M30 90h40M34 78l32-10-32-10 32-10-32-10 32-10", 8) + P("M50 2 70 22H30z")
G["candle"] = P("M38 40h24v54H38z") + P("M50 6c6 10 10 14 10 22a10 10 0 0 1-20 0c0-8 4-12 10-22z")
G["spikes"] = P("M4 92 18 40l14 52zM34 92 50 14l16 78zM68 92 82 40l14 52z")
G["swap"] = P("M10 30h56V14l26 26-26 26V50H10z") + P("M90 70H34v16L8 60l26-26v16h56z").replace("<path", '<path fill-opacity=".85"')
G["geyser"] = P("M38 94V40h24v54z") + P("M50 4c10 10 26 14 26 28 0 8-6 12-12 12-4 0-8-2-10-6-2 6-6 8-8 8s-6-2-8-8c-2 4-6 6-10 6-6 0-12-4-12-12 0-14 16-18 26-28z")
G["bubble"] = P(hole(50, 50, 42) + hole(50, 50, 32), "evenodd") + P("M30 40c2-10 10-16 18-16v8c-6 0-10 4-10 8z")
G["rain"] = group(G["cloud"], "translate(0 -16)") + P("M28 70l-6 16h8l6-16zM48 70l-6 16h8l6-16zM68 70l-6 16h8l6-16z")
G["spray"] = P("M4 40h26v20H4z") + circle(46, 50, 7) + circle(62, 38, 7) + circle(62, 62, 7) + circle(80, 26, 8) + circle(
    80, 50, 8) + circle(80, 74, 8)
G["doll"] = (circle(50, 26, 20) + P("M36 46h28l6 20 18 6-4 10-20-6v24H48V78H42v22H32V76l-20 6-4-10 18-6z")
             + P("M38 20l8 8M46 20l-8 8M54 20l8 8M62 20l-8 8", "nonzero").replace(
                 "<path", '<path fill="none" stroke="#000" stroke-opacity=".45" stroke-width="4"'))
G["magnet"] = stroke("M24 12v38a26 26 0 0 0 52 0V12", 16, "butt") + P("M16 6h16v14H16zM68 6h16v14H68z").replace(
    "<path", '<path fill="#000" fill-opacity=".35"')
G["expand"] = P("M4 50 24 30v12h18v16H24v12zM96 50 76 30v12H58v16h18v12z") + circle(50, 50, 7)
G["magazine"] = P("M34 8h32l6 84H28z" "M40 20h20v8H40zM40 36h20v8H40zM40 52h20v8H40z", "evenodd")
G["pouch"] = P("M32 24h36l-6 12c16 8 26 22 26 38 0 14-14 20-38 20S12 88 12 74c0-16 10-30 26-38z") + P("M34 34h32v7H34z").replace("<path", '<path fill="#000" fill-opacity=".3"')
G["hand"] = P("M20 44h22a8 8 0 0 1 8 8v24a10 10 0 0 1-10 10H22A10 10 0 0 1 12 76V52a8 8 0 0 1 8-8z") + P("M38 44h48a7 7 0 0 1 0 14H38z") + P("M22 18a7 7 0 0 1 14 0v28H22z") + stroke("M14 62h32M14 72h32", 4).replace('stroke="currentColor"', 'stroke="#000" stroke-opacity=".35"')
G["target_burst"] = group(G["burst"], "translate(14 14) scale(.72)") + ring(50, 50, 44, 6)
G["hero"] = (P("M28 30c0-14 10-22 22-22s22 8 22 22v8H28z") + P("M10 40c0-4 10-6 18-4h44c8-2 18 0 18 4s-16 8-40 8-40-4-40-8z")
             + P("M34 52h32v8c0 10-7 18-16 18s-16-8-16-18z") + P("M22 96c0-14 12-22 28-22s28 8 28 22z"))
G["bullet_h"] = P("M14 38h44c16 0 30 12 30 12S74 62 58 62H14z") + P("M6 34h10v32H6z")
G["pew"] = group(G["bullet_h"], "translate(22 10) scale(.8)") + P("M2 26h22v7H2zM2 47h16v7H2zM2 68h22v7H2z")
G["mine"] = star_points(50, 56, 10, 42, 30) + circle(50, 56, 26)
G["vampire"] = P("M50 92C26 76 10 58 10 36 30 44 40 30 50 10c10 20 20 34 40 26 0 22-16 40-40 56z") + P(
    "M38 50 44 70l6-20zM50 50l6 20 6-20z").replace("<path", '<path fill="#000" fill-opacity=".4"')



# Spell pictograms, on the same subject as the spell's icon in the game.
def voodoo_doll(arms, torso=None):
    """A voodoo doll: stitched head, torso (a stitched sack unless given), legs, and the given arms as a path."""
    head = cut(circle(50, 22, 17), stroke("M40 16l6 6M46 16l-6 6M54 16l6 6M60 16l-6 6", 3) + stroke("M42 30h16", 2.5))
    body = torso if torso is not None else cut(P("M38 40h24l4 32H34z"), stroke("M40 50h20M40 60h20", 2.5))
    return head + body + stroke("M42 70 38 94M58 70 62 94", 9) + stroke(arms, 9)


def candle(x, top):
    """A lit candle standing on y = 90, its wax top at the given height."""
    return (P(f"M{x - 9} {top}h18v{90 - top}h-18z") + P(f"M{x - 9} {top}h18v5c-3 0-3 7-6 7s-3-7-6-7-3 5-6 5z")
            + P(f"M{x} {top - 26}c6 8 9 12 9 18a9 9 0 0 1-18 0c0-6 3-10 9-18z"))


G["cowboy_hat"] = P("M4 40c0-6 10-6 18-4 4-18 12-28 28-28s24 10 28 28c8-2 18-2 18 4 0 8-20 12-46 12S4 48 4 40z")
G["fireball"] = circle(66, 50, 26) + P("M60 26C40 22 22 30 4 22c10 10 12 16 22 20-10 2-18 2-24 0 10 8 22 10 32 10-8 4-16 6-24 6"
                                      " 12 8 30 10 42 8z")
G["fire_beam"] = P("M28 98V42C20 34 20 20 28 8c2 10 8 14 10 16 0-12 4-20 12-24 6 6 10 14 10 24 4-4 8-6 10-16 8 12 8 26 0 34v56z")
G["bolts"] = "".join(group(G["bolt"], f"translate({x} 2) scale(.42 .96)") for x in (-2, 29, 60))
G["doll_heart"] = voodoo_doll("M36 50 18 64M64 50l18 14", torso=at(G["heart"], 50, 56, .58))
G["candles"] = candle(32, 46) + candle(68, 34)
G["bandito"] = G["cowboy_hat"] + cut(P("M28 50h44v10c0 4-2 8-6 10v4c0 14-8 24-16 24s-16-10-16-24v-4c-4-2-6-6-6-10z"),
                                     P("M30 52h40v6H30z") + P("M36 66c4-4 24-4 28 0-4 2-24 2-28 0z"))
G["frost_burst"] = cut(star_points(50, 50, 12, 48, 26), circle(50, 50, 20)) + at(G["snowflake"], 50, 50, .32)


def ring_spiral(turns, r0, r1, width, start=-90):
    """A spiral around the centre whose radius goes from r0 to r1, starting at the given angle, as a stroke."""
    n = int(turns * 36)
    points = [(50 + (r0 + (r1 - r0) * i / n) * math.cos(math.radians(start + i * 10)),
               50 + (r0 + (r1 - r0) * i / n) * math.sin(math.radians(start + i * 10))) for i in range(n + 1)]
    return stroke("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in points), width)


def drips(x0, y0, x1, y1, spots):
    """Paint drips hanging under the segment (x0, y0)-(x1, y1), as (position along it, length) pairs."""
    art = ""
    for t, length in spots:
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        art += stroke(f"M{x:.1f} {y:.1f}v{length * 1.4:.0f}", 8) + circle(round(x, 1), round(y + length * 1.4, 1), 6)
    return art


G["burning_skull"] = (cut(at(P("M50 20c-22 0-34 14-34 32 0 12 6 20 14 24v14h40V76c8-4 14-12 14-24 0-18-12-32-34-32z"), 50, 56, .92),
                          '<ellipse cx="38" cy="52" rx="10" ry="11"/><ellipse cx="62" cy="52" rx="10" ry="11"/>'
                          + P("M47 64h6l-3 6z") + stroke("M40 82v6M50 82v6M60 82v6", 3))
                      + at(G["flame"], 38, 50, .24) + at(G["flame"], 62, 50, .24))
G["cactus_cannon"] = (at(P("M12 38h54l4 4v16l-4 4H12a12 12 0 0 1 0-24z")
                         + "".join(P(f"M{x} 40l4-8 4 8zM{x} 60l4 8 4-8z") for x in (20, 34, 48)), 34, 66, 1, -45)
                      + at(P("M50 4c10 14 30 24 28 46-2 18-14 26-28 26S22 68 22 50c0-14 10-20 14-34 6 10 8 14 12 16 2-10 2-18 2-28z"),
                           66, 34, .7, 45))
G["breeze"] = at(G["snowflake"], 50, 50, .4) + ring_spiral(1.25, 30, 42, 6, 90)
G["dripping_arrow"] = (P("M10 84 74 20l6 6-64 64z") + arrow(70, 30, 92, 8, 1, 30)
                       + drips(12, 90, 76, 26, ((.1, 4), (.3, 12), (.5, 6), (.7, 16), (.9, 8))))


def ray(x0, y0, angle, length, width):
    """A tapered ray from (x0, y0) in the given direction (degrees), widest at its far end."""
    a, n = math.radians(angle), math.radians(angle + 90)
    tx, ty = x0 + length * math.cos(a), y0 + length * math.sin(a)
    dx, dy = width / 2 * math.cos(n), width / 2 * math.sin(n)
    return f'<polygon points="{x0:.1f},{y0:.1f} {tx + dx:.1f},{ty + dy:.1f} {tx - dx:.1f},{ty - dy:.1f}"/>'


G["splash"] = ('<ellipse cx="50" cy="88" rx="40" ry="8"/>' + at(G["drop"], 50, 58, .5)
               + stroke("M30 80C22 70 16 66 8 66M70 80c8-10 14-14 22-14", 6)
               + circle(10, 54, 5) + circle(90, 54, 5) + circle(26, 40, 4) + circle(74, 40, 4))
G["drained_doll"] = (at(voodoo_doll("M62 48h20M38 48 22 62"), 28, 74, .78, -70)
                     + "".join(ray(48, 62, a, length, 18) for a, length in ((-100, 64), (-70, 70), (-40, 66), (-10, 58))))
G["hatted_cactus"] = (P("M36 40h28v52a4 4 0 0 1-4 4H40a4 4 0 0 1-4-4z")
                      + P("M36 50 18 56l18 6zM36 68l-18 6 18 6zM64 50l18 6-18 6zM64 68l18 6-18 6zM36 84l-14 5 14 5zM64 84l14 5-14 5z")
                      + at(G["cowboy_hat"], 50, 30, .92))


def _check_glyphs():
    for name, svg in G.items():
        if not svg.startswith("<"):
            raise SystemExit(f"glyph {name} is malformed")


# --- Icon layouts --------------------------------------------------------------------------------------------

def glyph(spec):
    """'burst' or 'burst+plus': a main pictogram with an optional small modifier at the top right."""
    main, _, modifier = spec.partition("+")
    if main not in G:
        raise SystemExit(f"unknown pictogram {main}")
    svg = G[main]
    if modifier:
        if modifier not in G:
            raise SystemExit(f"unknown pictogram {modifier}")
        svg = group(svg, "translate(4 10) scale(.82)") + group(
            f'<circle cx="50" cy="50" r="50" fill="#000" fill-opacity=".28"/>' + group(G[modifier], "translate(15 15) scale(.7)"),
            "translate(62 0) scale(.38)")
    return svg


def document(view_box, content, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">'
            f"<title>{html.escape(title)}</title>{content}</svg>\n")


def joker_icon(joker, svg, school=None):
    color = RARITY_COLORS[joker["rarity"]]
    dots = joker["slot_cost"]
    spacing = 9
    first = 50 - (dots - 1) * spacing / 2
    content = (
        f'<rect x="2" y="2" width="96" height="136" rx="10" fill="{color}"/>'
        f'<rect x="8" y="8" width="84" height="124" rx="6" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>'
        + "".join(f'<circle cx="{first + i * spacing:.1f}" cy="18" r="3.2" fill="#fff"/>' for i in range(dots))
        + group(f'<g fill="#fff" color="#fff">{svg}</g>', "translate(8 32) scale(.84)")
    )
    if school:
        content += (f'<circle cx="80" cy="120" r="13" fill="{SCHOOL_COLORS[school]}" stroke="#fff" stroke-width="2.5"/>'
                    + group(f'<g fill="{ink(SCHOOL_COLORS[school])}" color="{ink(SCHOOL_COLORS[school])}">{G[SCHOOL_GLYPHS[school]]}</g>',
                            "translate(71 111) scale(.18)"))
    return document("0 0 100 140", content, joker["name"])


def badge_icon(color, spec, title, double_ring=False):
    content = (f'<circle cx="50" cy="50" r="48" fill="{color}"/>'
               f'<circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="3"/>')
    if double_ring:
        content += '<circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>'
    content += group(f'<g fill="{ink(color)}" color="{ink(color)}">{glyph(spec)}</g>', "translate(21 21) scale(.58)")
    return document("0 0 100 100", content, title)


def tile_icon(svg, title):
    content = (f'<rect x="2" y="2" width="96" height="96" rx="14" fill="{TILE_COLOR}"/>'
               + group(f'<g fill="{SILHOUETTE_COLOR}" color="{SILHOUETTE_COLOR}">{svg}</g>', "translate(10 10) scale(.8)"))
    return document("0 0 100 100", content, title)


def luminance(color):
    """Relative luminance (WCAG) of a #rrggbb colour."""
    def channel(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(color[i:i + 2]) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ink(color):
    """Pictogram colour on a background: the game's colours are bright, white only reads on the darkest ones."""
    light = luminance(color)
    return "#fff" if (light + 0.05) / 0.05 < 1.05 / (light + 0.05) else DARK_GLYPH


def upgrade_icon(spec, color, title):
    hexagon = " ".join(f"{50 + 48 * math.cos(math.radians(90 + i * 60)):.1f},{50 + 48 * math.sin(math.radians(90 + i * 60)):.1f}"
                       for i in range(6))
    content = (f'<polygon points="{hexagon}" fill="{color}"/>'
               + group(f'<g fill="{ink(color)}" color="{ink(color)}">{glyph(spec)}</g>', "translate(24 24) scale(.52)"))
    return document("0 0 100 100", content, title)


# --- Equipment silhouettes (100x100) -------------------------------------------------------------------------

def revolver(barrel=46, cylinder=11, barrels=1, chambers=False):
    """A revolver pointing right, grip at the bottom left."""
    parts = [P(f"M30 30h{barrel}v{8 + 6 * (barrels - 1)}H30z"),
             P("M18 30h24v20H26l-4 6-6-2z"),
             circle(36, 42, cylinder),
             P("M18 48h16l-6 34a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6z"),
             stroke("M32 54c0 8 4 12 10 12", 5),
             P("M16 24h8v8h-8z")]
    if barrels > 1:
        parts.append(P(f"M30 {38 + 6 * (barrels - 1)}h{barrel}v4H30z"))
    if chambers:
        parts.append("".join(circle(round(36 + cylinder * .5 * math.cos(math.radians(a)), 1),
                                    round(42 + cylinder * .5 * math.sin(math.radians(a)), 1), 3.2)
                             for a in range(0, 360, 90)).replace("<circle", '<circle fill="#000" fill-opacity=".45"'))
    return group("".join(parts), "rotate(-12 50 50)")


def long_gun(barrel_len=62, stock=True, scope=False, lever=False, pump=False, double=False):
    parts = [P(f"M{94 - barrel_len} 40h{barrel_len}v{12 if double else 7}H{94 - barrel_len}z"),
             P("M26 38h18v18H26z")]
    if stock:
        parts.append(P("M4 44 26 38v18L8 66a4 4 0 0 1-6-4z"))
    if scope:
        parts.append(P("M36 26h28v8H36z") + P("M42 34h4v6h-4zM54 34h4v6h-4z"))
    if lever:
        parts.append(stroke("M30 56c0 14 18 14 18 0", 5))
    else:
        parts.append(stroke("M34 56c0 8 4 10 8 10", 4))
    if pump:
        parts.append(P("M54 52h22v8H54z"))
    return group("".join(parts), "rotate(-14 50 50)")


EQUIPMENT_SILHOUETTES = {
    "itemQuadCylinder": revolver(barrel=50, cylinder=17, barrels=2, chambers=True),
    "itemShotgun": long_gun(barrel_len=58, double=True, pump=True),
    "itemLongRanger": long_gun(barrel_len=68, scope=True),
    "itemMinigun": group(P("M44 30h52v6H44zM44 40h52v6H44zM44 50h52v6H44zM44 60h52v6H44z") + P("M18 26h28v46H18z")
                         + P("M24 72h10v14H24z") + stroke("M18 40C6 40 6 58 18 58", 6), "rotate(-10 50 50)"),
    "itemWinchester": long_gun(barrel_len=60, lever=True),
    "itemKnuckles": group("".join(ring(18 + 21 * i, 40, 10, 7) for i in range(4)) + P("M8 50h84l-6 26a8 8 0 0 1-8 6H22a8 8 0 0 1-8-6z"),
                          "translate(0 6)"),
    "itemLasso": G["lasso"],
    "itemPistol": revolver(),
    "itemBow": stroke("M30 6C70 22 70 78 30 94", 9) + stroke("M30 6V94", 3) + G["arrow"].replace("<path", '<path transform="rotate(45 50 50) translate(0 4)"'),
    "itemDualRevolver": group(revolver(), "translate(-8 -10) scale(.82)") + group(revolver(), "translate(108 28) scale(-.82 .82)"),
    "itemBoomerang": G["boomerang"],
    "itemSheriffStar": G["sheriff"],
    "itemJetpack": G["todo"],  # TODO icon
    "itemBanjo": group(circle(30, 64, 26) + P(hole(30, 64, 26) + hole(30, 64, 18), "evenodd").replace(
        "<path", '<path fill="#000" fill-opacity=".3"') + P("M44 54 86 12l8 8-42 42z") + P("M80 6h14v14H80z"), ""),
    "itemUtilityAmmo": P("M10 44h80v46H10z") + P("M10 44l10-10h60l10 10z") + group(G["bullets"], "translate(26 -2) scale(.48)"),
    "itemUtilityBottleCrate": P("M8 54h84v38H8z") + "".join(group(G["bottle"], f"translate({x} 4) scale(.5)") for x in (6, 26, 46))
                              + P("M8 66h84M8 80h84", "nonzero").replace("<path", '<path fill="none" stroke="#000" stroke-opacity=".35" stroke-width="4"'),
    "itemUtilityHealBottle": group(G["bottle"], "translate(14 0) scale(.72)") + stroke("M6 84c14 10 74 10 88 0", 6)
                             + P("M62 54h8v8h8v8h-8v8h-8v-8h-8v-8h8z"),
    "itemUtilityImpulse": circle(50, 56, 26) + P("M44 22h12v10H44z") + stroke("M16 30C6 46 6 66 16 82M84 30c10 16 10 36 0 52", 6),
    "itemHero": G["hero"],
}

SCHOOL_GLYPHS = {
    "itemFire": "flame", "itemElec": "bolt", "itemAcid": "drop",
    "itemVoodoo": "doll", "itemCactus": "cactus", "itemIce": "snowflake",
}

SPELL_GLYPHS = {
    "itemSpellFireBall": "fireball", "itemSpellFireBeam": "fire_beam", "itemSpellFireSurcharge": "target_burst",
    "itemSpellFireWisp": "ghost", "itemSpellFireFingergun": "hand",
    "itemSpellElecStrike": "bolts", "itemSpellElecSuperJump": "spring", "itemSpellElecPortal": "portal",
    "itemSpellElecSwap": "swap", "itemSpellElecThunderstrike": "bolt+down",
    "itemSpellAcidThrower": "spray", "itemSpellAcidGeyser": "geyser", "itemSpellAcidBubble": "bubble",
    "itemSpellAcidContagion": "splash", "itemSpellAcidRain": "rain",
    "itemSpellVoodooDrain": "drained_doll", "itemSpellVoodooHeal": "doll_heart", "itemSpellVoodooCorruption": "burning_skull",
    "itemSpellVoodooHealArea": "candles", "itemSpellVoodooDoll": "doll",
    "itemSpellCactusBetty": "mine", "itemSpellCactusTurret": "cactus_cannon", "itemSpellCactusWall": "spikes",
    "itemSpellCactusDecoy": "hatted_cactus", "itemSpellCactusUlti": "bandito",
    "itemSpellIceBreeze": "breeze", "itemSpellIceLance": "dripping_arrow", "itemSpellIceCube": "cube",
    "itemSpellIceGlaze": "frost_burst", "itemSpellIceBlizzard": "cloud+snowflake",
}

UPGRADE_GLYPHS = {
    "jokerUpgradeAccuracy": "crosshair", "jokerUpgradeTotalAmmoBag": "pouch", "jokerUpgradeTotalAmmoBagC": "pouch",
    "jokerUpgradeFirerate": "pew", "jokerUpgradeFirerateB": "pew", "jokerUpgradeFirerateC": "pew",
    "jokerUpgradeClipSize": "magazine", "jokerUpgradeDamage": "burst", "jokerUpgradeDrawSpeed": "hand+chevrons",
    "jokerUpgradeHeal": "heart", "jokerUpgradeJumpHeight": "up", "jokerUpgradeLifesteal": "vampire",
    "jokerUpgradeBoomerangLingeringTime": "hourglass", "jokerUpgradeSherrifStarPickUpRange": "magnet",
    "jokerUpgradeBoomerangRange": "expand", "jokerUpgradeWeaponMeleeRange": "expand", "jokerUpgradeReloadSpeed": "reload",
    "jokerUpgradeHeroSpeed": "chevrons", "jokerUpgradeSpellCooldownReduction": "hourglass+minus",
    "jokerUpgradeChordCapacity": "note+plus", "jokerUpgradeChargingSpeed": "bolt+chevrons",
    # TODO icon
    "jokerUpgradeJetpackFuel": "todo", "jokerUpgradeJetpackForce": "todo", "jokerUpgradeJetpackFlightDuration": "todo",
}

JOKER_SCHOOLS = {
    "jokerExplosiveRounds": "itemFire", "jokerExplosiveRoundsAcid": "itemAcid", "jokerExplosiveRoundsElec": "itemElec",
    "jokerExplosiveRoundsFrost": "itemIce", "jokerCdrFire": "itemFire", "jokerCdrElec": "itemElec",
    "jokerCdrAcid": "itemAcid", "jokerCdrVoodoo": "itemVoodoo", "jokerCdrCactus": "itemCactus", "jokerCdrFrost": "itemIce",
}


# Shapes shared by several joker drawings.
G["knuckles"] = cut(circle(20, 40, 16) + circle(40, 34, 16) + circle(60, 34, 16) + circle(80, 40, 16)
                    + P("M8 46h84l-6 18c-4 10-14 16-24 16H38c-10 0-20-6-24-16z"),
                    circle(20, 40, 8) + circle(40, 34, 8) + circle(60, 34, 8) + circle(80, 40, 8) + P("M30 64h40v5H30z"))
G["fist_front"] = cut(P("M22 26a9 9 0 0 1 18 0 9 9 0 0 1 16 0 9 9 0 0 1 16 0 8 8 0 0 1 16 2v30c0 14-8 24-20 28v12H36V84"
                        "C24 80 14 70 14 56V42a8 8 0 0 1 8-8z"),
                      stroke("M40 22v16M56 22v16M72 22v16", 3) + stroke("M18 50c10-4 26-4 34 2", 5))
G["open_hand"] = (P("M28 46h44v28c0 12-10 22-22 22S28 86 28 74z")
                  + stroke("M33 50V20M45 48V12M57 48V14M68 52V24", 10) + stroke("M30 68 12 50", 11))
G["sparkle"] = star_points(50, 50, 4, 46, 12)
G["anger"] = "".join(group(stroke("M6 38Q40 40 38 6", 11), f"rotate({a} 50 50)") for a in (0, 90, 180, 270))
G["horseshoe"] = cut(stroke("M30 94V52a20 20 0 0 1 40 0v42", 17, "butt"),
                     "".join(circle(round(50 + 20 * math.cos(math.radians(a)), 1), round(52 + 20 * math.sin(math.radians(a)), 1), 3.2)
                             for a in (160, 200, 240, 300, 340, 20)) + P("M20 82h60v3H20z"))
G["bone"] = stroke("M24 50h52", 14) + circle(20, 42, 10) + circle(20, 58, 10) + circle(80, 42, 10) + circle(80, 58, 10)
G["bin"] = cut(P("M24 40h52l-6 54H30z") + P("M20 34h60v8H20z"), stroke("M40 50v36M50 50v36M60 50v36", 4))

G["jester"] = (P("M14 72C12 52 8 42 2 30c14 0 24 8 30 18 2-18 8-32 18-44 10 12 16 26 18 44 6-10 16-18 30-18-6 12-10 22-12 42z")
               + P("M10 68h80v16H10z") + circle(6, 30, 7) + circle(50, 6, 7) + circle(94, 30, 7))
G["wing"] = cut(P("M50 74C42 44 26 20 4 6c0 18 4 32 10 42-4 0-8-1-10-3 4 12 12 20 22 24-4 2-8 2-12 1 8 8 20 12 36 4z"),
                stroke("M20 48c8 10 18 16 26 18M14 30c6 8 12 12 20 16", 3))

def explosion(school):
    """Explosive Hits: an explosion with the school's pictogram punched out."""
    return cut(P("M14 94 6 62l12 4L8 30l22 14 4-36 16 24L64 4l6 36 22-18-8 36 12 2-10 34z"),
               at(G[SCHOOL_GLYPHS[school]], 50, 66, .42))


def mastery(school, pictogram=None):
    """Mastery (cooldown) jokers: a tilted card with the school's pictogram, and a clock on its corner."""
    card = P("M24 8h52a6 6 0 0 1 6 6v72a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z")
    return (cut(at(card, 58, 54, .9, 10), at(G[pictogram or SCHOOL_GLYPHS[school]], 60, 58, .44, 10) + circle(24, 22, 20))
            + ring(24, 22, 13, 5) + stroke("M24 15v8h6", 4))


def cycle_arrows(n, r=34, width=12):
    """n curved arrows chasing each other around a circle."""
    parts = []
    for i in range(n):
        a0, a1 = math.radians(i * 360 / n + 8), math.radians((i + 1) * 360 / n - 28)
        x0, y0, x1, y1 = 50 + r * math.cos(a0), 50 + r * math.sin(a0), 50 + r * math.cos(a1), 50 + r * math.sin(a1)
        parts.append(stroke(f"M{x0:.1f} {y0:.1f}A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}", width, "butt"))
        tip = math.radians((i + 1) * 360 / n - 8)
        head = [(50 + r * math.cos(tip), 50 + r * math.sin(tip)),
                (50 + (r + 12) * math.cos(a1), 50 + (r + 12) * math.sin(a1)),
                (50 + (r - 12) * math.cos(a1), 50 + (r - 12) * math.sin(a1))]
        parts.append(f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in head)}"/>')
    return "".join(parts)


def through(ring_art, arrow_art, front, behind):
    """An arrow through a ring: front is where the arrow passes in front of the ring, behind where it passes behind."""
    return cut(ring_art, front) + cut(arrow_art, behind)


def rib(y, width, side):
    """A rib leaving the spine (x = 50) at height y, curving out to the given width and back down; side is -1 or 1."""
    return stroke(f"M{50 + 6 * side} {y}C{50 + width * .6 * side} {y - 6} {50 + width * side} {y + 4} {50 + width * .9 * side} {y + 18}", 7)


def spiral(turns, r_max, width, cx=50, cy=50):
    """An open spiral from the centre outwards, as a stroke."""
    points = []
    for i in range(int(turns * 36) + 1):
        a = math.radians(i * 10)
        r = r_max * i / (turns * 36)
        points.append(f"{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}")
    return stroke("M" + "L".join(points), width)


def demon():
    """A horned demon head with a jagged grin."""
    head = P("M8 8 26 32c6-4 14-6 24-6s18 2 24 6L92 8 84 42c4 6 6 12 6 20 0 18-18 32-40 32S10 80 10 62c0-8 2-14 6-20z")
    return cut(head, P("M24 46 44 54 28 60z") + P("M76 46 56 54 72 60z")
               + P("M26 70 34 66 40 74 46 66 54 74 60 66 66 74 74 70 70 82 62 78 56 86 50 78 44 86 38 78 30 82z"))


# Jokers: one drawing per joker, in the spirit of its card in the game. Elemental jokers also get the spell school
# in a corner badge (JOKER_SCHOOLS).
JOKER_ART = {
    # TODO icon
    "jokerTrailPack": G["todo"], "jokerCrashPack": G["todo"], "jokerHoverPack": G["todo"], "jokerFinalEmber": G["todo"],
    "jokerBracing": cut(star_points(50, 50, 14, 48, 36), at(G["bullet"], 50, 50, .74, 45))
                    + at(G["bullet"], 50, 50, .52, 45),
    "jokerChickshot": cut(P("M38 30 34 14l10 6 6-14 6 14 10-6-4 16c8 6 12 14 12 24 0 10-6 18-14 22l14 20H26l14-20"
                            "c-8-4-14-12-14-22 0-10 4-18 12-24z"),
                          circle(40, 48, 4.5) + circle(60, 48, 4.5) + P("M50 54 60 62 50 70 40 62z") + stroke("M32 86h36", 4)),
    "jokerDeadlyStrong": cut(P("M18 22C38 2 80 6 92 30c8 18 2 38-12 50L72 96 62 80 48 92 42 76 26 82 30 66C12 58 6 36 18 22z"),
                             P("M30 38 54 48 34 56z") + P("M88 36 62 48 82 58z") + P("M44 70h22l-4 8h-14z")),
    "jokerFreeCocktail": P("M4 22h66L42 54v30h16v10H18V84h16V54z") + at(G["knuckles"], 76, 22, .42, 28),
    "jokerGoldTooth": at(G["tooth"], 42, 56, .86) + star_points(80, 18, 4, 18, 5),
    "jokerHeavyDrinker": at(G["bottle"], 26, 24, .56, -135) + cut(at(G["drop"], 64, 62, .66), at(G["plus"], 64, 68, .26))
                         + at(G["drop"], 26, 70, .34) + at(G["drop"], 46, 40, .2),
    "jokerHeavyWeapon": cut(P("M18 16h62l12 12v18H72v16H46l-8 32H12l10-38-8-8V24z"), P("M42 24h24v24H42z") + circle(30, 52, 4)),
    "jokerHelpingHand": at(G["open_hand"], 50, 52, .96, -40),
    "jokerKnuckleDown": at(G["knuckles"], 50, 52, 1.05, -18),
    "jokerLastDance": stroke("M50 88C14 62 6 40 22 24c12-12 24-6 28 6 4-12 16-18 28-6 16 16 8 38-28 64", 8)
                      + at(G["drop"], 40, 46, .3) + at(G["drop"], 62, 40, .26) + at(G["drop"], 54, 64, .24)
                      + at(G["drop"], 84, 82, .26),
    "jokerLightWeight": cut(P("M6 74C8 38 44 8 94 8 74 22 72 52 54 70 40 84 20 90 6 74z"),
                            stroke("M8 92 60 38", 5) + stroke("M44 38l-8 18M60 30l-6 16M72 22l-6 14", 4)),
    "jokerMagicReload": stroke("M24 32A34 34 0 0 1 80 30", 10) + P("M70 12 92 32 64 40z")
                        + stroke("M76 68A34 34 0 0 1 20 70", 10) + P("M30 88 8 68 36 60z") + at(G["sparkle"], 50, 50, .5),
    "jokerPanicAttack": at(G["bolt"], 28, 40, .62, -20) + at(G["bolt"], 70, 34, .58, 18) + at(G["bolt"], 50, 72, .5, 4)
                        + P("M10 80 22 70 18 92z"),
    "jokerPartyShot": P("M6 94 26 40 60 74z") + stroke("M54 12c8 6 0 12 8 18s0 12 8 18", 5) + stroke("M78 60c6-4 12 4 18 0", 5)
                      + circle(36, 20, 5) + circle(86, 30, 5) + circle(74, 82, 5) + P("M68 8l8 2-2 8-8-2z"),
    "jokerPigshot": cut(P("M14 10 36 22h28l22-12-4 28c6 6 10 14 10 24 0 20-18 34-42 34S8 82 8 62c0-10 4-18 10-24z"),
                        P("M30 60c0-8 8-12 20-12s20 4 20 12-8 14-20 14-20-6-20-14z") + circle(28, 42, 5) + circle(72, 42, 5))
                    + P("M34 60c0-6 6-8 16-8s16 2 16 8-6 10-16 10-16-4-16-10z" + hole(43, 60, 3.5) + hole(57, 60, 3.5), "evenodd"),
    "jokerQuickDraw": P("M8 58c14-6 26-8 42-8s28 2 42 8l-8 34c-10 4-22 6-34 6s-24-2-34-6z") + P("M50 4 74 28H60v28H40V28H26z")
                      + at(G["plus"], 84, 16, .26),
    "jokerRelentless": G["fist_front"],
    "jokerPlasticDuck": cut(P("M40 30c0-14 10-24 24-24s22 10 22 22c0 2 0 4-1 6h11c2 8-6 14-16 14 8 8 12 16 12 26 0 14-14 22-40 22"
                              "S6 88 6 70c0-10 4-18 8-22 8 6 18 8 30 6-4-6-4-14-4-24z"),
                            circle(66, 24, 5) + stroke("M24 68c10 8 26 8 34-4", 5)),
    "jokerShineBright": cut(P("M50 18c16 0 28 12 28 28 0 10-6 18-12 24v12H34V70c-6-6-12-14-12-24 0-16 12-28 28-28z")
                            + P("M36 86h28v6c0 4-4 6-6 6H42c-2 0-6-2-6-6z"),
                            stroke("M42 70V54l8 8 8-8v16", 4) + P("M34 80h32v3H34z"))
                        + stroke("M50 2v8M12 20l6 6M88 20l-6 6M2 50h8M90 50h8", 6),
    "jokerSpareBullets": cut(P("M24 40C24 16 36 4 50 4s26 12 26 36v52H24z"),
                             P("M24 34h52v6H24z") + circle(40, 56, 5) + circle(60, 56, 5) + stroke("M38 70c6 8 18 8 24 0", 5)),
    "jokerFocusedFeet": ring(50, 50, 32, 8) + at(G["bullet"], 20, 20, .5, 135) + at(G["bullet"], 80, 20, .5, -135)
                        + at(G["bullet"], 80, 80, .5, -45) + at(G["bullet"], 20, 80, .5, 45),
    "jokerAntiGravityFalls": ring(50, 50, 43, 8) + cut(P("M50 14C30 14 18 28 18 46c0 12 6 20 14 24v14h36V70c8-4 14-12 14-24 0-18-12-32-32-32z"),
                                                       P("M26 42 46 46 40 58 28 54zM74 42 54 46 60 58 72 54z") + P("M50 22 56 30 50 38 44 30z")
                                                       + P("M46 60h8l-4 8z") + stroke("M40 74v10M50 74v10M60 74v10", 3)),
    "jokerBellShot": at(G["bell"], 46, 56, .86, -22) + stroke("M74 8c10 6 16 16 16 28M80 54c6 2 10 6 12 12", 6),
    "jokerBouncingBall": stroke("M8 94C14 30 40 30 46 94", 8) + star_points(70, 28, 9, 26, 23),
    "jokerCactusDay": cut(P("M50 8C28 8 16 22 16 40c0 12 6 20 14 24v14h40V64c8-4 14-12 14-24C84 22 72 8 50 8z"),
                          P("M28 34 46 42 32 50z") + P("M72 34 54 42 68 50z") + P("M44 58h12l-6 8z"))
                      + P("M4 60c14 0 26 10 32 30-16 2-28-10-32-30zM96 60c-14 0-26 10-32 30 16 2 28-10 32-30z"),
    "jokerCarePackage": cut(P("M12 40h68v54H12z"), P("M20 48h52v38H20z")) + stroke("M28 40c0-24 36-24 36 0", 7)
                        + at(G["bullet"], 46, 66, .4, 50) + at(G["plus"], 84, 24, .3),
    "jokerChad": cut(star_points(50, 50, 16, 48, 38), circle(50, 50, 30)) + ring(37, 37, 7, 5) + ring(63, 63, 7, 5)
                 + stroke("M66 32 34 68", 6),
    "jokerClutch": cut(P("M6 94 10 52 2 28l20 12 4-30 14 24L50 2l10 32 14-24 4 30 20-12-8 24 4 42z"),
                       at(G["bullet"], 34, 74, .4) + at(G["bullet"], 50, 74, .4) + at(G["bullet"], 66, 74, .4))
                   + at(G["bullet"], 34, 74, .3) + at(G["bullet"], 50, 74, .3) + at(G["bullet"], 66, 74, .3),
    "jokerCrackShot": P("M6 30 32 44 26 8l22 30 12-16 4 26 30 6-26 14 16 26-28-16-10 26-6-26-30 4 20-20z")
                      + at(G["plus"], 82, 18, .3),
    "jokerFastHands": stroke("M22 34A34 34 0 0 1 78 28", 11) + P("M68 10 94 30 64 40z")
                      + stroke("M78 66A34 34 0 0 1 22 72", 11) + P("M32 90 6 70 36 60z") + at(G["bolt"], 50, 50, .46, 12),
    "jokerFightOrFlight": cut(at(G["heart"], 50, 50, 1.06), stroke("M4 52h22l6-12 8 26 8-34 8 30 6-10h34", 5)),
    "jokerFistFight": cut(P("M50 98C24 96 8 78 12 54c2-12 10-20 12-34 8 8 10 16 10 24 4-14 10-28 22-40 0 14 6 24 14 32 2-6 2-12 0-18"
                            " 12 10 20 26 18 42-2 22-16 36-38 38z"), at(G["fist_front"], 50, 62, .74, 20))
                      + at(G["fist_front"], 50, 62, .62, 20),
    "jokerFrostBite": P("M4 8h92l-8 20-6-8-6 26-8-18-6 12-6-18-6 26-6-26-6 18-6-12-8 18-6-26-6 8z")
                      + P("M4 92h92l-8-20-6 8-6-26-8 18-6-12-6 18-6-26-6 26-6-18-6 12-8-18-6 26-6-8z"),
    "jokerGoldProspector": cut(ring(48, 52, 38, 9), P("M66 8h30v30z")) + stroke("M64 38A18 18 0 1 0 66 64V54H52", 9)
                           + at(G["plus"], 84, 16, .28),
    "jokerHop": P("M6 76 52 30 40 18h46v46L74 52 28 98z") + at(G["plus"], 22, 20, .3),
    "jokerLuckyStrike": at(G["heart"], 50, 28, .46) + at(G["heart"], 72, 50, .46, 90) + at(G["heart"], 50, 72, .46, 180)
                        + at(G["heart"], 28, 50, .46, -90) + stroke("M54 62c6 10 10 20 18 32", 6),
    "jokerLunge": cut(P("M50 18c20 0 36 16 36 36S70 92 50 92 14 74 14 54s16-36 36-36z") + P("M14 34 4 8l26 14zM86 34 96 8 70 22z"),
                      "".join(at(P("M50 12 68 34H56v26H44V34H32z"), 50 + 20 * math.cos(math.radians(a)), 56 + 20 * math.sin(math.radians(a)),
                                 .42, a + 90) for a in (45, 135, 225, 315))),
    "jokerJokheal": cut(at(P("M22 4h56v92H22z"), 40, 46, .78, -14), at(P("M18 0h64v100H18z"), 62, 56, .82, 10)
                        + at(G["plus"], 30, 30, .24, -14))
                    + cut(at(P("M22 4h56v92H22z"), 62, 56, .78, 10), at(G["plus"], 62, 56, .4, 10)),
    "jokerPickPick": stroke("M10 92 66 36", 12, "butt") + P("M10 18C50 14 82 40 92 90 76 60 56 44 30 38z")
                     + cut(at(P("M36 36h28v28H36z"), 56, 42, 1, 45), P("M50 34a8 8 0 0 1 0 16z")),
    "jokerPreciousRush": through(f'<ellipse cx="50" cy="60" rx="36" ry="14" fill="none" stroke="currentColor" stroke-width="10"/>'
                                 + P("M50 30 60 38 50 46 40 38z"),
                                 stroke("M8 92C30 80 40 64 52 52S78 26 82 20", 8) + P("M70 16 94 6 88 32z"),
                                 stroke("M24 82 36 72", 16), stroke("M56 48 64 40", 16)),
    "jokerPricklyPear": cut(circle(40, 42, 34) + "".join(circle(round(40 + 34 * math.cos(math.radians(a)), 1),
                                                                 round(42 + 34 * math.sin(math.radians(a)), 1), 6)
                                                          for a in range(50, 340, 32)),
                            circle(40, 42, 24) + P("M40 42 100 0V70z"))
                        + stroke("M44 76 54 90", 8) + circle(57, 94, 6)
                        + stroke("M94 4 34 42 66 56", 4) + at(G["bullet"], 78, 66, .44, 125),
    "jokerRage": "".join(group(stroke("M50 6A44 44 0 0 1 92 38", 8), f"rotate({a} 50 50)") for a in (0, 120, 240))
                 + at(G["anger"], 50, 50, .74),
    "jokerRunAndGun": P("M41 2h7v14h-7zM52 2h7v14h-7z") + P("M50 14 84 40 76 52 50 32 24 52 16 40z")
                      + at(G["bullet"], 22, 24, .38, -28) + at(G["bullet"], 78, 24, .38, 28)
                      + P("M52 96 24 34 32 32zM52 96 38 40 44 38zM52 96 58 38 64 40zM52 96 68 32 76 34z")
                      + P("M2 66 18 28 26 66zM98 66 82 28 74 66z"),
    "jokerRunAndReload": P("M34 6h22l26 44-26 44H34l20-44z") + stroke("M30 18A38 38 0 0 0 22 80", 10, "butt")
                         + P("M10 74h26L22 94z") + stroke("M74 82A38 38 0 0 0 80 20", 10, "butt") + P("M92 26H66L80 6z"),
    "jokerScoutsHonor": cut(G["shield"], at(G["shield"], 50, 50, .8)) + cut(at(G["shield"], 50, 50, .68), at(G["hourglass"], 50, 48, .44)),
    "jokerShroomGrave": P("M6 50C6 22 28 6 50 6s44 16 44 44c-14 4-28 6-44 6S20 54 6 50z")
                        + P("M38 56h24c0 14 2 26 6 36H32c4-10 6-22 6-36z"),
    "jokerSlowAndSteady": cut(ring(50, 50, 38, 9), P("M44 0h12v100H44zM0 44h100v12H0z"))
                          + P("M44 4h12v14H44zM4 44h14v12H4zM82 44h14v12H82z") + P("M50 92 76 62H60V24H40v38H24z"),
    "jokerSoulReaper": stroke("M70 20H40L32 42l28 6 4 22-22 16-14-10", 14, "butt") + at(G["plus"], 84, 16, .3),
    "jokerSoulSiphon": cut(at(G["heart"], 50, 50, 1.08), stroke("M38 10 60 32 34 48 66 62 44 94", 9, "butt")),
    "jokerSpeedyGunzales": at(G["chevrons"], 46, 54, .96) + at(G["plus"], 86, 14, .28),
    "jokerFastDraw": cut(at(P("M30 46C30 20 50 4 50 4s20 16 20 42z") + P("M28 52h44v36H28z") + P("M24 88h52v8H24z"), 62, 50, .96, 40),
                         star_points(26, 26, 5, 28, 13))
                     + star_points(26, 26, 5, 22, 9) + cut(at(P("M28 52h44v36H28z"), 62, 50, .96, 40), at(P("M28 58h44v4H28z"), 62, 50, .96, 40)),
    "jokerWellFed": at(cut(P("M28 34c0-6 6-10 22-10s22 4 22 10L52 98h-4z"), stroke("M30 46h12M58 60h12M38 74h8", 4))
                       + P("M50 26C40 18 36 8 40 2c8 4 12 12 10 24zM50 26c4-10 12-16 20-14-2 8-10 14-20 14z"
                           "M50 26c-6-8-16-10-22-6 4 6 12 8 22 6z"), 50, 50, 1, -35),
    "jokerAmmoSupply": cut(P("M24 34c0-16 12-28 26-28s26 12 26 28v46H24z") + P("M14 80h72v14H14z"),
                           "".join(circle(round(50 + 16 * math.cos(math.radians(a)), 1), round(38 + 16 * math.sin(math.radians(a)), 1), 6)
                                   for a in range(0, 360, 60)) + circle(50, 38, 3)),
    "jokerApprentice": P("M2 30 54 10 98 30 46 50z") + P("M20 42v18c12 12 38 12 52 2V40L46 54z") + stroke("M86 34v28", 4)
                       + P("M80 62h12l-2 14h-8z"),
    "jokerAvalanche": cut(circle(50, 42, 14) + circle(50, 74, 22), circle(45, 40, 2.5) + circle(55, 40, 2.5) + circle(50, 66, 3)
                          + circle(50, 78, 3) + P("M50 44l10 3-10 2z"))
                      + P("M24 28c0-4 12-6 26-6s26 2 26 6-12 4-26 4-26 0-26-4z") + P("M36 26c0-14 6-22 14-22s14 8 14 22z")
                      + stroke("M28 68 6 54M10 48l4 8M72 68l22-14M90 48l-4 8", 4),
    "jokerBerserker": P("M12 38 30 46 38 34 50 48 62 34 70 46 88 38 82 60 92 72 74 70 66 94 58 76 50 92 42 76 34 94 26 70 8 72 18 60z")
                      + star_points(28, 16, 6, 11, 8) + star_points(72, 16, 6, 11, 8),
    "jokerBloodLust": at(G["fist_front"], 44, 44, .8, -24) + at(G["drop"], 78, 74, .26) + at(G["drop"], 64, 88, .2)
                      + stroke("M74 52v14", 5),
    "jokerCheapSkate": cut(at(G["heart"], 50, 50, 1.06), ring(50, 46, 22, 6) + stroke("M58 38A10 10 0 1 0 60 52H50", 6)),
    "jokerChonky": cut(P("M34 32h32v14c0 8-8 14-16 14s-16-6-16-14z"), P("M34 38h32v4H34z"))
                   + P("M14 28c0-4 16-6 36-6s36 2 36 6-16 4-36 4-36 0-36-4z") + P("M32 26c0-14 8-22 18-22s18 8 18 22z")
                   + cut(P("M6 64c0-8 12-12 24-12h40c12 0 24 4 24 12v20H76v12H24V84H6z"), P("M24 76h52v4H24z") + P("M46 68h8v8h-8z")),
    "jokerDestroyer": at(G["knuckles"], 38, 62, .82, -40)
                      + P("M62 6 70 22 84 8 82 28 98 26 86 40 96 50 78 50 70 38 58 40 64 24z"),
    "jokerDisgrace": cut(stroke("M22 6v38c0 18 8 30 20 36", 15, "butt") + stroke("M78 6v38c0 18-8 30-20 36", 15, "butt"),
                         circle(22, 18, 3) + circle(22, 34, 3) + circle(78, 18, 3) + circle(78, 34, 3))
                     + P("M44 86 50 74 54 90zM40 58l8 4-6 6z"),
    "jokerExplosiveRoundsAcid": explosion("itemAcid"),
    "jokerExplosiveRoundsElec": explosion("itemElec"),
    "jokerExplosiveRoundsFrost": explosion("itemIce"),
    "jokerExplosiveRounds": explosion("itemFire"),
    "jokerGreatWall": P("M4 6h28v18H4zM36 6h28v18H36zM68 6h28v18H68zM4 28h12v18H4zM20 28h28v18H20zM52 28h28v18H52zM84 28h12v18H84zM4 50h28v18H4zM36 50h28v18H36zM68 50h28v18H68zM4 72h12v18H4zM20 72h28v18H20zM52 72h28v18H52zM84 72h12v18H84z"),
    "jokerHealthyBoi": at(G["heart"], 50, 52, .56) + stroke("".join(
        f"M{50 + 32 * math.cos(math.radians(a)):.1f} {52 + 32 * math.sin(math.radians(a)):.1f}"
        f"L{50 + 46 * math.cos(math.radians(a)):.1f} {52 + 46 * math.sin(math.radians(a)):.1f}" for a in range(0, 360, 30)), 7),
    "jokerFreezeOver": cut(P("M22 30h10v8h10v-8h16v8h10v-8h10v20l-6 6v40H28V56l-6-6z"), P("M42 94V78a8 8 0 0 1 16 0v16z"))
                       + stroke("M50 30V4", 4) + P("M52 4h20l-6 6 6 6H52z"),
    "jokerMagicFriendship": P("M10 96 28 50h22L40 96z") + P("M90 96 72 50H50l10 46z")
                            + cut(P("M24 26c0-12 10-20 26-20s26 8 26 20v18c0 8-6 14-14 14H38c-8 0-14-6-14-14z"),
                                  stroke("M34 18v22M44 14v26M56 14v26M66 18v22", 4) + stroke("M22 44c10 6 24 6 30 0", 5)),
    "jokerPewPewPew": cut(circle(50, 58, 34), circle(36, 50, 9) + circle(64, 50, 9) + circle(50, 76, 9) + circle(50, 58, 3))
                      + stroke("M12 34C24 8 66 2 86 24", 9) + P("M74 24h24l-8 20z"),
    "jokerRampage": at(demon(), 36, 52, .7) + P("M62 16h18l18 34-18 34H62l18-34z"),
    "jokerReloadMastery": cycle_arrows(4),
    "jokerScrubBullet": stroke("M24 24 76 76M76 24 24 76", 10) + "".join(
        at(P("M50 2 64 20H36z"), 50 + 34 * math.cos(math.radians(a)), 50 + 34 * math.sin(math.radians(a)), .8, a + 90)
        for a in (45, 135, 225, 315)) + "".join(
        at(P("M50 30 60 14H40z"), 50, 50, 1, a) for a in (0, 90, 180, 270)),
    "jokerSharpShooter": cut(at(G["bone"], 50, 50, 1.25, -30), P("M46 30 54 44 44 52 56 62 50 72 48 72 52 62 40 52 50 44 44 30z"))
                         + P("M50 20l4 6h-6zM46 80l6 2-4 4z"),
    "jokerSoulEater": demon(),
    "jokerStonks": cut(P("M10 46h80v46H10z") + P("M10 42c0-16 12-28 28-28h24c16 0 28 12 28 28z"),
                       P("M6 42h88v5H6z") + P("M43 38h14v18H43z") + stroke("M28 16v24M72 16v24M28 50v40M72 50v40", 3)),
    "jokerWeakLink": cut(group(stroke("M50 4v90", 9) + "".join(rib(y, w, side) for y, w in ((14, 30), (34, 38), (54, 40), (74, 32))
                                                             for side in (-1, 1)), "rotate(-12 50 50)"),
                         P("M0 46 30 40 44 52 58 42 72 54 100 46v8L72 62 58 50 44 60 30 48 0 54z")),
    "jokerHeadshotRefund": at(G["bullet"], 26, 56, .72, -15) + stroke("M36 22C58 4 92 16 88 50S60 88 44 80", 10)
                           + P("M30 80 50 66 50 94z"),
    "jokerCdrAcid": mastery("itemAcid"),
    "jokerCdrCactus": mastery("itemCactus"),
    "jokerColdBlooded": at(cut(P("M30 24a20 20 0 0 1 40 0v46H30z"), circle(70, 8, 10) + stroke("M42 30v28M58 30v28", 3))
                           + P("M44 70h12v26a6 6 0 0 1-12 0z"), 52, 48, .96, 40) + at(G["drop"], 84, 70, .22) + at(G["drop"], 76, 86, .16),
    "jokerConsumer": cut(stroke("M90.6 66.9A42 42 0 0 1 12 70", 11, "butt") + P("M5 48 24 66 2 76z"), at(G["bin"], 50, 64, .74))
                     + cut(at(G["bin"], 50, 64, .62), stroke("M9.4 45.1A42 42 0 0 1 71 19.6C84 28 62 30 53 43", 18)
                                                     + P("M45 58 61 49 44 39z"))
                     + stroke("M9.4 45.1A42 42 0 0 1 71 19.6C84 28 62 30 53 43", 11) + P("M45 60 62 49 43 38z"),
    "jokerDeathsDance": cut(G["shield"], P("M24 34 46 44 28 52z") + P("M76 34 54 44 72 52z") + P("M50 54 56 64H44z")
                            + P("M30 68h40l-4 10H34z") + stroke("M40 68v10M50 68v10M60 68v10", 3)),
    "jokerEatAPunch": cut(at(G["heart"], 50, 50, 1.06), at(G["fist_front"], 50, 46, .5)),
    "jokerCdrElec": mastery("itemElec"),
    "jokerExecute": cut(P("M8 6h84v12H8zM14 18h12v70H14zM74 18h12v70H74zM4 88h92v8H4z") + P("M26 22h48v14L26 48z")
                        + P("M26 62h48v18H26z"), circle(50, 71, 7) + P("M26 70h48v2H26z")),
    "jokerExtraJump": stroke("M8 94C14 62 22 50 34 40", 10) + P("M24 30 46 24 40 48z") + stroke("M40 94C48 60 60 40 74 26", 10)
                      + P("M62 20 90 10 80 38z") + at(G["plus"], 20, 16, .3),
    "jokerCdrFrost": mastery("itemIce"),
    "jokerHeadBang": cut(P("M26 24 44 12l26 4 18 18 4 20-6 8 4 10-12 4-2 12-16 2v8H34V82L20 70 14 50z"),
                         circle(68, 48, 10) + P("M44 12 54 32 42 42 56 58 46 66 54 94h-12l-6-26 8-10-12-14 8-12-6-20z"))
                     + P("M14 6l12 6-8 8zM4 24l10 2-6 8zM30 2l6 6-8 2z"),
    "jokerHitMe": P("M6 52h88c0 24-20 42-44 42S6 76 6 52z") + stroke("M14 14l20 20M34 14 14 34", 8) + circle(72, 28, 16),
    "jokerHoarder": cut(at(P("M22 6h56v88H22z"), 68, 44, .76, 10), at(P("M22 6h56v88H22z"), 38, 54, .9, -4))
                    + at(G["jester"], 68, 30, .3, 10)
                    + cut(at(P("M22 6h56v88H22z"), 38, 54, .82, -4), at(G["jester"], 38, 52, .5, -4)),
    "jokerTweakDealer": cut(G["jester"], at(G["plus"], 50, 52, .3)) + at(G["plus"], 50, 52, .2),
    "jokerLastStand": cut(stroke("M88 30H18M90 44H12M88 58H14M84 72H22", 10) + P("M78 22h22v58H78z"),
                          at(G["heart"], 44, 52, .78))
                      + at(G["heart"], 44, 52, .66),
    "jokerLazy": P("M4 48h44v10L20 84h30v12H4V86l28-26H4z") + P("M50 22h30v8L60 52h22v8H48v-8l20-22H50z")
                 + P("M78 6h18v6L84 22h12v6H76v-6l12-10H78z"),
    "jokerLifePact": cut(ring(50, 50, 38, 8), P("M44 0h12v100H44zM0 44h100v12H0z")) + P("M44 4h12v16H44zM4 44h16v12H4zM80 44h16v12H80zM44 80h12v16H44z")
                     + cut(at(G["heart"], 50, 52, .56), at(G["bolt"], 50, 52, .3, 10)),
    "jokerLowGravity": at(G["moon"], 44, 56, .86) + at(G["sparkle"], 76, 20, .4) + at(G["sparkle"], 60, 48, .2),
    "jokerCdrFire": mastery("itemFire"),
    "jokerRiposte": cut(P("M6 8 26 30 50 4 74 30 94 8 92 56C88 76 70 90 50 96 30 90 12 76 8 56z"),
                        P("M18 34 30 44 50 22 70 44 82 34 80 56C76 70 64 80 50 84 36 80 24 70 20 56z"))
                    + P("M24 46 36 52 38 36 48 50 50 32 56 48 66 38 64 54 76 50 66 64 70 74 52 70 50 80 44 70 30 72 34 62z"),
    "jokerSecondWind": G["wing"] + group(G["wing"], "translate(100 0) scale(-1 1)"),
    "jokerSnackAPunch": cut(G["shield"], at(G["fist_front"], 50, 50, .52)),
    "jokerThickSkin": stroke("M10 22 40 64 72 30", 11) + P("M60 22 90 10 82 42z") + P("M4 78h92v14H4z")
                      + P("M30 74 36 66 42 74zM48 74l4-6 4 6z"),
    "jokerTinMan": cut(P("M12 50 50 88 78 40 60 22z") + stroke("M66 34 92 8", 13, "butt")
                       + '<ellipse cx="31" cy="69" rx="28" ry="11" transform="rotate(45 31 69)"/>',
                       '<ellipse cx="31" cy="69" rx="21" ry="5" transform="rotate(45 31 69)"/>') + ring(84, 66, 9, 6),
    "jokerCdrVoodoo": mastery("itemVoodoo", "candle"),
    "jokerWestWizard": cut(at(G["heart"], 50, 50, 1.06), ring(50, 44, 20, 6) + stroke("M50 32v12h10", 5)),
    "jokerAllMighty": cut(G["shield"], stroke("M30 30 70 70M70 30 30 70", 9) + circle(28, 26, 6) + circle(24, 32, 6)
                          + circle(72, 26, 6) + circle(76, 32, 6) + circle(28, 74, 6) + circle(24, 68, 6) + circle(72, 74, 6)
                          + circle(76, 68, 6)),
    "jokerBattleMage": cut(P("M2 26c16-6 32-4 48 6 16-10 32-12 48-6v62c-16-6-32-4-48 6-16-10-32-12-48-6z"),
                           at(G["skull"], 50, 58, .62)) + at(G["skull"], 50, 58, .5),
    "jokerCamper": cut(P("M50 16 90 94H10z"), P("M50 52 64 94H36z")) + stroke("M38 4 58 32M62 4 42 32", 4),
    "jokerCantRipOneTrick": cut(P("M28 64C34 40 40 18 64 4c-6 14-6 26 4 36l6 24z")
                                + P("M2 72c0-8 20-12 48-12s48 4 48 12-20 14-48 14S2 80 2 72z"),
                                circle(50, 64, 12)) + ring(50, 64, 8, 4) + stroke("M50 60v4h3", 2.5),
    "jokerCastAway": cut(star_points(50, 50, 4, 48, 20, -45) + star_points(50, 50, 4, 30, 14), circle(50, 50, 18))
                     + ring(50, 50, 12, 5) + stroke("M50 42v8h6", 4),
    "jokerCoinFlip": ring(50, 50, 44, 7) + cut(circle(50, 50, 32), P("M48 10h4v80h-4z") + P("M30 38 42 44 32 48z")
                                                + P("M70 38 58 44 68 48z") + P("M28 60 36 56 42 64 50 56 58 64 64 56 72 60 64 74H36z")),
    "jokerDoubleDown": stroke("M52 52a5 5 0 0 1 5 5 11 11 0 0 1-11 11 17 17 0 0 1-17-17 23 23 0 0 1 23-23 29 29 0 0 1 29 29"
                              " 35 35 0 0 1-35 35 41 41 0 0 1-41-41", 11),
    "jokerDwarf": cut(P("M50 2 66 36H34z") + circle(50, 42, 12) + P("M32 44c4 12 8 24 18 28 10-4 14-16 18-28z")
                      + P("M28 64h44v22H60v10H40V86H28z"), circle(45, 40, 2.5) + circle(55, 40, 2.5) + P("M28 34h44v3H28z")),
    "jokerExtraDash": "".join(at(P("M10 30h34l26 20-26 20H10l26-20z"), x, y, .8, -25) for x, y in ((38, 74), (56, 56), (74, 38)))
                      + at(G["plus"], 20, 18, .3),
    "jokerGiant": cut(P("M18 54c0-26 14-42 32-42s32 16 32 42v34H18z") + P("M44 2h12l2 16H42z") + P("M8 50h12v20H8zM80 50h12v20H80z"),
                      circle(36, 52, 10) + circle(64, 52, 10) + stroke("M36 74h28M36 82h28", 4)) + circle(36, 52, 4) + circle(64, 52, 4),
    "jokerGlassCannon": cut(at(G["skull"], 50, 50, 1.04), stroke("M30 4 42 30 30 44 48 62 40 96", 4)
                            + stroke("M70 0 60 24 72 40", 4)),
    "jokerGoliath": cut(P("M44 2h12l2 12c18 4 30 20 30 40v20l-12 22H24L12 74V54c0-20 12-36 30-40z"),
                        P("M22 40h56v42l-10 12H32L22 82z"))
                    + cut(P("M28 46h44v34l-8 10H36l-8-10z"),
                          P("M30 52 46 58 32 62zM70 52 54 58 68 62z") + P("M44 64h12l4 10H40z") + P("M38 80h24v4H38z")),
    "jokerOneTrick": cut(P("M30 38h46l-4 40H34z"), P("M32 66h42v6H32z")) + P("M8 80c0-6 18-8 42-8s42 2 42 8-18 10-42 10-42-4-42-10z")
                     + stroke("M34 18 84 34", 7) + at(G["sparkle"], 18, 26, .34),
    "jokerMachineGun": at(G["bullet_h"], 62, 50, .86)
                       + P("M4 8h18l20 26H22zM26 4h16l20 26H46zM4 92h18l20-26H22zM26 96h16l20-26H46z"),
    "jokerRicochet": stroke("M40 6 14 64 58 82 80 26", 7) + P("M66 26 88 6 92 34z"),
    "jokerSpeedster": stroke("M14 86A42 42 0 0 1 90 44", 12, "butt") + stroke("M32 82 78 26", 7) + circle(32, 82, 9),
    "jokerSpellRoulette": cut(P("M50 4 92 24v50L50 96 8 74V24z"),
                              stroke("M8 24 50 46 92 24M50 46v50", 4) + circle(50, 24, 5) + circle(34, 18, 4) + circle(66, 30, 4)
                              + at(G["sparkle"], 29, 62, .36) + circle(64, 60, 5) + circle(78, 74, 5) + circle(78, 46, 5)),
    "jokerToolBox": cut(P("M8 50h84v42H8z") + stroke("M34 50V38h32v12", 7), stroke("M10 10 90 90", 20, "butt") + P("M8 64h84v4H8z"))
                    + stroke("M12 12 88 88", 9),
    "jokerVampire": P("M2 4h96l-6 12-6 10-6 34-8-26-6 8-6-8-6 8-6-8-6 8-6-8-8 26-6-34-6-10z") + at(G["drop"], 26, 82, .28),
    "jokerAimingBurst": cut(star_points(50, 50, 16, 49, 42), circle(50, 50, 36)) + ring(50, 50, 24, 6)
                        + P("M46 4h8v24h-8zM46 72h8v24h-8zM4 46h24v8H4zM72 46h24v8H72z") + at(G["plus"], 50, 50, .2),
    "jokerBardbarian": at(EQUIPMENT_SILHOUETTES["itemBanjo"], 56, 56, 1) + at(G["bolt"], 22, 30, .48, -20),
    "jokerChonkyThrow": at(G["horseshoe"], 48, 52, .92, -45),
    "jokerEagleLever": cut(P("M6 94C4 56 16 22 48 12c20-6 36 2 44 16l6 18c-6-4-12-5-16-3l-14 4c4 8 4 20-2 30L56 94z"),
                           circle(62, 30, 5) + P("M46 22 70 22 64 26z") + stroke("M14 60c8 4 18 6 28 4M18 76c8 4 16 4 24 2", 3)),
    "jokerEcoTrick": at(cycle_arrows(2, 34, 13), 50, 50, 1, 30),
    "jokerElementalSpin": cut(circle(50, 50, 46), "".join(
        circle(round(50 + 26 * math.cos(math.radians(a)), 1), round(50 + 26 * math.sin(math.radians(a)), 1), 10)
        for a in range(30, 360, 60)) + circle(50, 50, 5) + at(G["sparkle"], 50, 24, .22)),
    "jokerFanningAce": cut(circle(60, 58, 34), "".join(
        circle(round(60 + 20 * math.cos(math.radians(a)), 1), round(58 + 20 * math.sin(math.radians(a)), 1), 7) for a in range(0, 360, 72)))
                       + P("M4 22c16-4 34 2 42 14-14-2-26 0-34 8 2-8-2-16-8-22zM2 52c10 0 20 4 24 12-8 0-14 4-18 10 0-8-2-16-6-22z"),
    "jokerFistRage": at(G["fist_front"], 50, 64, .72) + P("M18 36C10 22 16 10 26 4c-2 10 4 14 8 20 2-8 6-14 14-18-2 10 2 16 6 22"
                                                         " 2-8 8-14 16-16-4 10 0 16 4 22 2-6 6-10 12-12-2 8-2 14-4 20z"),
    "jokerFistRoDah": cut(P("M22 40c0-18 12-30 28-30s28 12 28 30v14H22z") + P("M24 44 4 14l22 10zM76 44 96 14 74 24z")
                          + P("M20 56h26v26L32 96 20 80zM54 56h26v24L68 96 54 82z"),
                          P("M30 40h14v8H30zM56 40h14v8H56z") + P("M47 16h6v40h-6z")),
    "jokerFocusShot": cut(ring(50, 50, 38, 9), P("M44 0h12v100H44zM0 44h100v12H0z"))
                      + P("M44 4h12v16H44zM4 44h16v12H4zM80 44h16v12H80zM44 80h12v16H44z") + stroke("M50 28v22l14 12", 7),
    "jokerFrenzySpin": cut(ring(50, 50, 40, 8), P("M44 0h12v100H44zM0 44h100v12H0z"))
                       + P("M44 2h12v14H44zM2 44h14v12H2zM84 44h14v12H84zM44 84h12v14H44z")
                       + P("M24 34l10-6h6v44h-10V40l-6 3z") + P(hole(62, 50, 16) + hole(62, 50, 8), "evenodd"),
    "jokerHomingBurst": spiral(2.6, 44, 7) + at(G["bullet"], 74, 18, .5, 45),
    "jokerJumpStar": at(G["sheriff"], 66, 30, .56) + P("M4 92C10 60 26 44 50 40c-10 10-14 22-16 36-4-8-10-10-16-6-4 6-8 14-14 22z"),
    "jokerLingeringThrow": "".join(at(P("M44 4h12l6 92H38z"), 52 + 40 * math.cos(math.radians(a)), 60 + 40 * math.sin(math.radians(a)), .6, a + 90)
                                   for a in (180, 210, 240, 270)) + at(G["plus"], 84, 18, .3),
    "jokerLullabard": at(G["note"], 50, 56, .76) + stroke("M10 46C10 22 28 6 50 6s40 16 40 40", 7),
    "jokerMarkAce": cut(P("M50 6c16 0 28 12 28 28 0 20-28 56-28 56S22 54 22 34C22 18 34 6 50 6z"), circle(50, 34, 10))
                    + stroke("M14 36A38 38 0 0 0 30 84M86 36a38 38 0 0 1-16 48", 7),
    "jokerMindShot": cut(at(G["skull"], 50, 62, .74), P("M32 56 46 62 34 68zM68 56 54 62 66 68z"))
                     + P("M14 40 20 22l10 10 8-28 10 24 10-26 6 26 12-12 2 18 12-6-6 14z"),
    "jokerOverBlast": circle(76, 22, 16) + circle(38, 76, 14) + circle(74, 68, 12) + circle(52, 42, 9) + circle(20, 48, 8)
                      + stroke("M4 20l28 12M4 38l14 4", 6),
    "jokerOverDraw": arrow(12, 88, 52, 10, 6, 18) + arrow(12, 88, 90, 14, 6, 18) + arrow(12, 88, 92, 58, 6, 18)
                     + P("M2 84 14 80 10 92zM6 96l10-12"),
    "jokerRushBlast": P("M34 52h32v36H34z") + P("M28 86h44v10H28z") + P("M14 46 20 24l10 12 6-26 12 22 10-26 6 26 14-16 2 22 12-4-10 16z"),
    "jokerScavengerStar": cut(at(P("M14 14h72v72H14z"), 50, 50, .96, 15), at(star_points(50, 50, 5, 46, 20), 50, 50, 1.02, 15))
                          + cut(at(star_points(50, 50, 5, 46, 20), 50, 50, .86, 15), circle(50, 52, 9)),
    "jokerSkyLash": P("M8 50h30v24l34 6c10 2 16 8 16 16H8z") + P("M4 42h38v8H4z")
                    + group(at(G["wing"], 34, 40, .8, 10), "translate(100 0) scale(-1 1)"),
    "jokerSpellLash": cut(at(P("M24 8h52v84H24z"), 50, 44, .8, -12), at(G["sparkle"], 50, 44, .3)) + stroke("M8 64c10 28 74 30 84 4", 8)
                      + P("M80 54h20L88 76z"),
    "jokerStackedLever": "".join(at(stroke("M50 18v64", 12) + circle(42, 14, 9) + circle(58, 14, 9) + circle(42, 86, 9) + circle(58, 86, 9),
                                    x, 50, .86, r) for x, r in ((16, -6), (50, 0), (84, 6))),
    "jokerSwampTrick": circle(44, 60, 30) + circle(70, 38, 18) + circle(22, 30, 12) + circle(80, 76, 10) + circle(88, 14, 7)
                       + circle(12, 82, 6),
    "jokerUltraDraw": cut(P("M62 98C40 92 34 72 44 56c4 10 10 12 16 12-6-14-2-30 12-42 0 12 6 18 12 24 4-8 2-16-2-26 14 10 22 28 18 46"
                            "-4 18-18 28-38 28z"),
                          stroke("M8 8 66 66", 16) + P("M100 100 44 86 86 44z"))
                      + stroke("M8 8 64 64", 8) + cut(P("M96 96 50 84 84 50z"), P("M84 84 64 78 78 64z"))
                      + stroke("M4 36 36 4", 8),
}

def load(name):
    return json.load(open(os.path.join(data_dir, name)))


def require(ids, table, what):
    missing = sorted(set(ids) - table.keys())
    if missing:
        raise SystemExit(f"no icon for {what} {missing}: add them to the tables of build_icons.py")


_check_glyphs()
equipment, spells, jokers, upgrades = load("equipment.json"), load("spells.json"), load("jokers.json"), load("upgrades.json")
require([e["id"] for e in equipment], EQUIPMENT_SILHOUETTES, "equipment")
require([s["id"] for s in spells["schools"]], SCHOOL_GLYPHS, "spell schools")
require([s["id"] for s in spells["schools"]], SCHOOL_COLORS, "spell schools (school_colors in manual.json)")
require([s["id"] for s in spells["spells"]], SPELL_GLYPHS, "spells")
require([j["id"] for j in jokers], JOKER_ART, "jokers")
require([u["id"] for u in upgrades], UPGRADE_GLYPHS, "upgrades")

icons = {"itemHero": tile_icon(EQUIPMENT_SILHOUETTES["itemHero"], "Hero")}
icons.update({e["id"]: tile_icon(EQUIPMENT_SILHOUETTES[e["id"]], e["name"]) for e in equipment})
icons.update({s["id"]: badge_icon(SCHOOL_COLORS[s["id"]], SCHOOL_GLYPHS[s["id"]], s["name"], double_ring=True)
              for s in spells["schools"]})
icons.update({s["id"]: badge_icon(SCHOOL_COLORS[s["school"]], SPELL_GLYPHS[s["id"]], s["name"]) for s in spells["spells"]})
icons.update({j["id"]: joker_icon(j, JOKER_ART[j["id"]], JOKER_SCHOOLS.get(j["id"])) for j in jokers})
icons.update({u["id"]: upgrade_icon(UPGRADE_GLYPHS[u["id"]], u["color"], u["name"]) for u in upgrades})

os.makedirs(out_dir, exist_ok=True)
for stale in os.listdir(out_dir):
    if stale.endswith(".svg") and stale[:-4] not in icons:
        os.remove(os.path.join(out_dir, stale))
for icon_id, svg in icons.items():
    with open(os.path.join(out_dir, icon_id + ".svg"), "w") as f:
        f.write(svg)
print(f"{len(icons)} icons written to {out_dir}")
