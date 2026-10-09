"""Generates one SVG icon per element of data/ in assets/icons/<id>.svg: jokers, upgrades, equipment, spell
schools and spells, plus the hero (itemHero).

Usage: python3 scripts/build_icons.py <data_dir> <out_dir>

The icons are original drawings that follow the game's visual codes without copying its assets:
- jokers: a card in the colour of their rarity, one dot per slot they cost, a white pictogram;
- spells and spell schools: a round badge in the colour of their school;
- equipment and the hero: a light silhouette on a dark tile;
- upgrades: a gold hexagon.

Pictograms are drawn in a 100x100 box with fill="currentColor". Every id found in data/ must have an entry in the
tables below: a new joker or item after a game update makes the script fail until it gets one.
"""
import html, json, math, os, sys

data_dir, out_dir = sys.argv[1:3]

RARITY_COLORS = {
    "Normal": "#8c7b5e", "Fine": "#6a8a2b", "Prime": "#2f6fae",
    "Mythic": "#7b3fa3", "Legendary": "#c9821a", "Unique": "#a3232e",
}
SCHOOL_COLORS = {
    "itemFire": "#e2531d", "itemElec": "#e0a91f", "itemAcid": "#8cbf26",
    "itemVoodoo": "#8b4bb8", "itemCactus": "#2f8a4c", "itemIce": "#4fb6de",
}
TILE_COLOR, SILHOUETTE_COLOR = "#2b211b", "#ecd9b2"
UPGRADE_COLOR = "#b4842b"


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
G["drop"] = P("M50 6c14 24 32 42 32 60 0 18-14 30-32 30S18 84 18 66c0-18 18-36 32-60z")
G["snowflake"] = "".join(group(P("M45 6h10v88H45z") + P("M50 22 36 10l6-6 8 8 8-8 6 6zM50 78 36 90l6 6 8-8 8 8 6-6z"),
                               f"rotate({a} 50 50)") for a in (0, 60, 120))
G["cactus"] = (P("M40 94V22c0-14 20-14 20 0v72z") + P("M40 60H28c-8 0-10-6-10-12V34c0-8 12-8 12 0v14h10z")
               + P("M60 48h12V30c0-8 12-8 12 0v16c0 8-4 14-12 14H60z"))
G["skull"] = P("M50 8C26 8 12 24 12 46c0 14 7 22 16 26v18h44V72c9-4 16-12 16-26C88 24 74 8 50 8z"
               + hole(34, 46, 9) + hole(66, 46, 9) + "M44 64h12v8H44z", "evenodd")
G["ghost"] = P("M50 6C28 6 16 24 16 46v48l12-10 11 10 11-10 11 10 11-10 12 10V46C84 24 72 6 50 6z"
               + hole(38, 42, 7) + hole(62, 42, 7), "evenodd")
G["coin"] = circle(50, 50, 44) + ring(50, 50, 32, 5).replace('stroke="currentColor"', 'stroke="#000" stroke-opacity=".3"') + star_points(50, 51, 5, 18, 8).replace("<polygon", '<polygon fill="#000" fill-opacity=".3"')
G["nugget"] = P("M14 66 26 34l24-14 30 12 8 30-16 22H32z") + P("M34 40l14-8 10 4-12 10z").replace(
    "<path", '<path fill="#000" fill-opacity=".3"')
G["hourglass"] = P("M22 6h56v10c0 20-20 28-20 34s20 14 20 34v10H22V84c0-20 20-28 20-34S22 36 22 16z"
                   "M32 16c0 14 18 22 18 30 0-8 18-16 18-30z", "evenodd")
G["chevrons"] = P("M10 18h22l28 32-28 32H10l28-32zM46 18h22l28 32-28 32H46l28-32z")
G["feather"] = P("M84 6C44 12 20 48 16 94h9c4-22 14-36 30-46H42c12-8 22-16 26-24H56C68 18 78 12 84 6z")
G["weight"] = P("M30 44c0-16 8-28 20-28s20 12 20 28h-9c0-11-4-19-11-19s-11 8-11 19z") + circle(50, 66, 28)
G["reload"] = stroke("M82 52a32 32 0 1 1-14-28", 12) + P("M58 6 90 22 62 40z")
G["clover"] = circle(36, 36, 17) + circle(64, 36, 17) + circle(36, 64, 17) + circle(64, 64, 17) + P("M47 60h6v36h-6z")
G["fist"] = P("M22 30a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v40c0 12-10 22-22 22H38c-9 0-16-7-16-16z") + stroke("M35 26v14M50 26v14M65 26v14", 4).replace(
              'stroke="currentColor"', 'stroke="#000" stroke-opacity=".35"') + P("M10 48h22v18H18a8 8 0 0 1-8-8z")
G["note"] = P("M36 16 84 6v62a12 10 0 1 1-8-9V24L44 31v49a12 10 0 1 1-8-9z")
G["boomerang"] = stroke("M10 34Q40 38 50 72 60 38 90 34", 17)
G["star"] = star_points(50, 52, 5, 46, 20)
G["sheriff"] = star_points(50, 50, 6, 46, 24) + "".join(
    circle(round(50 + 44 * math.cos(math.radians(-90 + i * 60)), 1), round(50 + 44 * math.sin(math.radians(-90 + i * 60)), 1), 7)
    for i in range(6))
G["pig"] = circle(50, 54, 36) + P("M18 30 26 8l16 16zM82 30 74 8 58 24z") + P(
    "M38 58a12 9 0 1 0 24 0 12 9 0 1 0-24 0z" + hole(45, 58, 3) + hole(55, 58, 3), "evenodd").replace(
    "<path", '<path fill="#000" fill-opacity=".35"') + P(hole(38, 42, 4) + hole(62, 42, 4)).replace(
    "<path", '<path fill="#000" fill-opacity=".35"')
G["drumstick"] = P("M60 8c18 0 32 14 32 30 0 18-16 30-34 26L36 86a10 10 0 1 1-14-6 10 10 0 1 1-6-14l22-22C34 26 44 8 60 8z")
G["duck"] = P("M30 50c0-16 10-28 26-28s24 12 24 24c0 6-2 10-4 13h20c0 20-16 33-40 33-20 0-34-10-36-26 4 4 10 6 16 6-4-6-6-14-6-22z"
              "M56 40a4 4 0 1 0 0.1 0z", "evenodd") + P("M76 44h18l-10 10H76z")
G["bell"] = P("M50 8c-18 0-26 18-26 38v20L12 80h76L76 66V46C76 26 68 8 50 8z") + circle(50, 88, 8)
G["mushroom"] = P("M8 52C8 28 28 10 50 10s42 18 42 42z") + P("M38 52h24v34a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8z")
G["pickaxe"] = group(stroke("M14 34C32 14 68 14 86 34", 12) + P("M45 22h10v72H45z"), "rotate(-35 50 50)")
G["card"] = P("M22 6h56a8 8 0 0 1 8 8v72a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8z"
              "M26 18v64h48V18zM50 34 62 50 50 66 38 50z", "evenodd")
G["cards"] = group(G["card"], "rotate(-16 50 50) translate(-8 0) scale(.9)") + group(G["card"], "rotate(14 50 50) translate(14 4) scale(.9)")
G["chest"] = P("M10 44h80v42a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z") + P("M10 40c0-16 12-28 28-28h24c16 0 28 12 28 28z") + P(
    "M42 40h16v18H42z").replace("<path", '<path fill="#000" fill-opacity=".35"')
G["horseshoe"] = stroke("M24 14v34a26 26 0 0 0 52 0V14", 16, "butt")
G["moon"] = P("M60 6A44 44 0 1 0 94 64 34 34 0 1 1 60 6z")
G["sun"] = circle(50, 50, 20) + "".join(group(P("M46 4h8v18h-8z"), f"rotate({a} 50 50)") for a in range(0, 360, 45))
G["dash"] = P("M4 28h40v10H4zM12 46h40v10H12zM4 64h40v10H4z") + P("M56 14 96 50 56 86z")
G["crown"] = P("M8 82 14 24l22 26 14-34 14 34 22-26 6 58z")
G["bomb"] = circle(44, 58, 34) + stroke("M64 30c6-10 14-14 22-12", 7) + star_points(88, 14, 5, 10, 4)
G["arrow"] = group(P("M10 46h62v8H10z") + P("M68 32 96 50 68 68z") + P("M4 34h16l10 12H14zM4 66h16l10-12H14z"), "rotate(-40 50 50)")
G["lasso"] = stroke("M30 52c-14-6-20-18-12-28 10-12 40-14 56-2 12 10 8 24-8 28-12 3-26 2-36 2", 8) + stroke(
    "M30 52c2 14 6 26 18 40", 8)
G["ring"] = ring(50, 60, 28, 10) + P("M36 24 44 10h12l8 14-14 14z")
G["eye"] = P("M4 50C18 28 34 18 50 18s32 10 46 32C82 72 66 82 50 82S18 72 4 50z" + hole(50, 50, 18), "evenodd") + circle(50, 50, 9)
G["chain"] = stroke("M44 56 28 72a14 14 0 0 1-20-20l16-16a14 14 0 0 1 20 0", 10) + stroke(
    "M56 44l16-16a14 14 0 0 1 20 20L76 64a14 14 0 0 1-20 0", 10)
G["wheel"] = ring(50, 50, 38, 10) + "".join(group(P("M47 14h6v72h-6z"), f"rotate({a} 50 50)") for a in (0, 45, 90, 135)) + circle(50, 50, 10)
G["wrench"] = P("M72 6a22 22 0 0 0-20 30L10 78a8 8 0 0 0 12 12l42-42A22 22 0 0 0 94 28L80 42 64 38 60 22 74 8z")
G["tooth"] = P("M26 10c10-4 18 2 24 2s14-6 24-2c12 6 14 22 8 38-4 12-4 24-8 38-2 6-10 6-12 0l-6-22c-2-6-10-6-12 0l-6 22c-2 6-10 6-12 0-4-14-4-26-8-38-6-16-4-32 8-38z")
G["bottle"] = P("M42 6h16v8h-2v18c12 4 18 14 18 26v28a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V58c0-12 6-22 18-26V14h-2z")
G["pear"] = P("M50 22c10 0 14 10 14 18 0 10 18 16 18 34 0 14-14 22-32 22S18 88 18 74c0-18 18-24 18-34 0-8 4-18 14-18z") + P(
    "M50 22c2-8 10-16 20-16-2 10-10 16-20 16z")
G["wall"] = P("M6 20h88v62H6zM8 40h84M8 60h84", "nonzero") + stroke("M8 40h84M8 60h84M30 22v18M70 22v18M50 40v20M18 60v20M82 60v20", 5).replace(
    'stroke="currentColor"', 'stroke="#000" stroke-opacity=".35"')
G["cube"] = P("M50 6 90 28v44L50 94 10 72V28z") + P("M50 50 90 28M50 50v44M50 50 10 28", "nonzero").replace(
    "<path", '<path fill="none" stroke="#000" stroke-opacity=".35" stroke-width="5"')
G["portal"] = (f'<ellipse cx="30" cy="50" rx="14" ry="38" fill="none" stroke="currentColor" stroke-width="9"/>'
               f'<ellipse cx="70" cy="50" rx="14" ry="38" fill="none" stroke="currentColor" stroke-width="9"/>')
G["beam"] = circle(20, 50, 16) + P("M30 38h66v24H30z") + P("M30 30 46 50 30 70z")
G["cloud"] = P("M26 70a18 18 0 0 1 0-36 24 24 0 0 1 46-6 20 20 0 0 1 4 42z")
G["spring"] = stroke("M30 90h40M34 78l32-10-32-10 32-10-32-10 32-10", 8) + P("M50 2 70 22H30z")
G["candle"] = P("M38 40h24v54H38z") + P("M50 6c6 10 10 14 10 22a10 10 0 0 1-20 0c0-8 4-12 10-22z")
G["swirl"] = stroke("M52 50a4 4 0 0 1 4 4 10 10 0 0 1-10 10 16 16 0 0 1-16-16 22 22 0 0 1 22-22 28 28 0 0 1 28 28 34 34 0 0 1-34 34", 9)
G["wind"] = stroke("M8 34h52a12 12 0 1 0-12-12M8 54h70a12 12 0 1 1-12 12M8 74h32", 9)
G["spikes"] = P("M4 92 18 40l14 52zM34 92 50 14l16 78zM68 92 82 40l14 52z")
G["swap"] = P("M10 30h56V14l26 26-26 26V50H10z") + P("M90 70H34v16L8 60l26-26v16h56z").replace("<path", '<path fill-opacity=".85"')
G["geyser"] = P("M38 94V40h24v54z") + P("M50 4c10 10 26 14 26 28 0 8-6 12-12 12-4 0-8-2-10-6-2 6-6 8-8 8s-6-2-8-8c-2 4-6 6-10 6-6 0-12-4-12-12 0-14 16-18 26-28z")
G["bubble"] = P(hole(50, 50, 42) + hole(50, 50, 32), "evenodd") + P("M30 40c2-10 10-16 18-16v8c-6 0-10 4-10 8z")
G["rain"] = group(G["cloud"], "translate(0 -16)") + P("M28 70l-6 16h8l6-16zM48 70l-6 16h8l6-16zM68 70l-6 16h8l6-16z")
G["spray"] = P("M4 40h26v20H4z") + circle(46, 50, 7) + circle(62, 38, 7) + circle(62, 62, 7) + circle(80, 26, 8) + circle(
    80, 50, 8) + circle(80, 74, 8)
G["biohazard"] = circle(50, 28, 18) + circle(30, 64, 18) + circle(70, 64, 18) + P(hole(50, 52, 10)).replace(
    "<path", '<path fill="#000" fill-opacity=".35"')
G["doll"] = (circle(50, 26, 20) + P("M36 46h28l6 20 18 6-4 10-20-6v24H48V78H42v22H32V76l-20 6-4-10 18-6z")
             + P("M38 20l8 8M46 20l-8 8M54 20l8 8M62 20l-8 8", "nonzero").replace(
                 "<path", '<path fill="none" stroke="#000" stroke-opacity=".45" stroke-width="4"'))
G["sombrero"] = P("M4 70c0-6 20-10 46-10s46 4 46 10-20 10-46 10S4 76 4 70z") + P("M32 62c0-26 8-40 18-40s18 14 18 40z")
G["hat"] = P("M4 64c0-6 10-6 18-4 6-26 14-40 28-40s22 14 28 40c8-2 18-2 18 4 0 10-20 16-46 16S4 74 4 64z")
G["magnet"] = stroke("M24 12v38a26 26 0 0 0 52 0V12", 16, "butt") + P("M16 6h16v14H16zM68 6h16v14H68z").replace(
    "<path", '<path fill="#000" fill-opacity=".35"')
G["expand"] = P("M4 50 24 30v12h18v16H24v12zM96 50 76 30v12H58v16h18v12z") + circle(50, 50, 7)
G["magazine"] = P("M34 8h32l6 84H28z" "M40 20h20v8H40zM40 36h20v8H40zM40 52h20v8H40z", "evenodd")
G["pouch"] = P("M32 24h36l-6 12c16 8 26 22 26 38 0 14-14 20-38 20S12 88 12 74c0-16 10-30 26-38z") + P("M34 34h32v7H34z").replace("<path", '<path fill="#000" fill-opacity=".3"')
G["hand"] = P("M20 44h22a8 8 0 0 1 8 8v24a10 10 0 0 1-10 10H22A10 10 0 0 1 12 76V52a8 8 0 0 1 8-8z") + P("M38 44h48a7 7 0 0 1 0 14H38z") + P("M22 18a7 7 0 0 1 14 0v28H22z") + stroke("M14 62h32M14 72h32", 4).replace('stroke="currentColor"', 'stroke="#000" stroke-opacity=".35"')
G["tornado"] = P("M8 14h84l-8 12H16zM20 34h64l-10 12H30zM30 54h44l-10 12H40zM40 74h22l-8 12H48z")
G["arch"] = P("M4 80V60c0-24 20-42 46-42s46 18 46 42v20H78V62c0-16-12-28-28-28S22 46 22 62v18z")
G["target_burst"] = group(G["burst"], "translate(14 14) scale(.72)") + ring(50, 50, 44, 6)
G["hero"] = (P("M28 30c0-14 10-22 22-22s22 8 22 22v8H28z") + P("M10 40c0-4 10-6 18-4h44c8-2 18 0 18 4s-16 8-40 8-40-4-40-8z")
             + P("M34 52h32v8c0 10-7 18-16 18s-16-8-16-18z") + P("M22 96c0-14 12-22 28-22s28 8 28 22z"))
G["allies"] = group(G["hero"], "translate(-4 14) scale(.62)") + group(G["hero"], "translate(42 14) scale(.62)")
G["golem"] = G["cactus"] + group(G["sombrero"], "translate(14 -6) scale(.72)")
G["bullet_h"] = P("M14 38h44c16 0 30 12 30 12S74 62 58 62H14z") + P("M6 34h10v32H6z")
G["pew"] = group(G["bullet_h"], "translate(22 10) scale(.8)") + P("M2 26h22v7H2zM2 47h16v7H2zM2 68h22v7H2z")
G["mine"] = star_points(50, 56, 10, 42, 30) + circle(50, 56, 26)
G["turret"] = G["cactus"] + P("M58 40h36v12H58z")
G["vampire"] = P("M50 92C26 76 10 58 10 36 30 44 40 30 50 10c10 20 20 34 40 26 0 22-16 40-40 56z") + P(
    "M38 50 44 70l6-20zM50 50l6 20 6-20z").replace("<path", '<path fill="#000" fill-opacity=".4"')
G["glass"] = P("M22 8h56l-6 40c-2 14-12 22-22 22S30 62 28 48zM46 70h8v16h14v8H32v-8h14z") + P(
    "M40 16 58 40", "nonzero").replace("<path", '<path fill="none" stroke="#000" stroke-opacity=".4" stroke-width="5"')
G["tin"] = P("M34 6h32v18H34zM28 28h44v40H28zM12 30h14v34H12zM74 30h14v34H74zM32 72h14v22H32zM54 72h14v22H54z")
G["eagle"] = P("M4 30c20-6 32 0 40 10 4-14 18-24 38-22l14 8-16 6c-6 14-14 30-34 40l-6 20-8-16C18 70 8 52 4 30z")
G["confetti"] = P("M12 92 36 30l34 34z") + P("M60 12h8v8h-8zM78 28h8v8h-8zM70 46h8v8h-8zM48 22h6v6h-6zM84 54h6v6h-6z")
G["skull_x"] = G["skull"] + P("M70 8l8-8 22 22-8 8z")
G["flex"] = P("M14 70c0-24 10-40 22-46l8 14c-6 4-10 10-10 18 8-10 22-14 36-10 14 4 20 18 18 30-2 14-14 20-30 20H30c-10 0-16-10-16-26z")
G["campsite"] = P("M50 10 92 86H8z" "M50 46 66 86H34z", "evenodd")
G["dart"] = P("M50 4 64 50 50 96 36 50z")


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


def joker_icon(joker, spec, school=None):
    color = RARITY_COLORS[joker["rarity"]]
    dots = joker["slot_cost"]
    spacing = 9
    first = 50 - (dots - 1) * spacing / 2
    content = (
        f'<rect x="2" y="2" width="96" height="136" rx="10" fill="{color}"/>'
        f'<rect x="8" y="8" width="84" height="124" rx="6" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>'
        + "".join(f'<circle cx="{first + i * spacing:.1f}" cy="18" r="3.2" fill="#fff"/>' for i in range(dots))
        + group(f'<g fill="#fff" color="#fff">{glyph(spec)}</g>', "translate(18 44) scale(.64)")
    )
    if school:
        content += (f'<circle cx="80" cy="120" r="13" fill="{SCHOOL_COLORS[school]}" stroke="#fff" stroke-width="2.5"/>'
                    + group(f'<g fill="#fff" color="#fff">{G[SCHOOL_GLYPHS[school]]}</g>', "translate(71 111) scale(.18)"))
    return document("0 0 100 140", content, joker["name"])


def badge_icon(color, spec, title, double_ring=False):
    content = (f'<circle cx="50" cy="50" r="48" fill="{color}"/>'
               f'<circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="3"/>')
    if double_ring:
        content += '<circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>'
    content += group(f'<g fill="#fff" color="#fff">{glyph(spec)}</g>', "translate(21 21) scale(.58)")
    return document("0 0 100 100", content, title)


def tile_icon(svg, title):
    content = (f'<rect x="2" y="2" width="96" height="96" rx="14" fill="{TILE_COLOR}"/>'
               + group(f'<g fill="{SILHOUETTE_COLOR}" color="{SILHOUETTE_COLOR}">{svg}</g>', "translate(10 10) scale(.8)"))
    return document("0 0 100 100", content, title)


def upgrade_icon(spec, title):
    hexagon = " ".join(f"{50 + 48 * math.cos(math.radians(90 + i * 60)):.1f},{50 + 48 * math.sin(math.radians(90 + i * 60)):.1f}"
                       for i in range(6))
    content = (f'<polygon points="{hexagon}" fill="{UPGRADE_COLOR}"/>'
               + group(f'<g fill="#fff" color="#fff">{glyph(spec)}</g>', "translate(24 24) scale(.52)"))
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
    "itemSpellFireBall": "flame", "itemSpellFireBeam": "beam", "itemSpellFireSurcharge": "target_burst",
    "itemSpellFireWisp": "ghost", "itemSpellFireFingergun": "hand",
    "itemSpellElecStrike": "bolt", "itemSpellElecSuperJump": "spring", "itemSpellElecPortal": "portal",
    "itemSpellElecSwap": "swap", "itemSpellElecThunderstrike": "bolt+down",
    "itemSpellAcidThrower": "spray", "itemSpellAcidGeyser": "geyser", "itemSpellAcidBubble": "bubble",
    "itemSpellAcidContagion": "biohazard", "itemSpellAcidRain": "rain",
    "itemSpellVoodooDrain": "heart+down", "itemSpellVoodooHeal": "heart+plus", "itemSpellVoodooCorruption": "swirl",
    "itemSpellVoodooHealArea": "candle", "itemSpellVoodooDoll": "doll",
    "itemSpellCactusBetty": "mine", "itemSpellCactusTurret": "turret", "itemSpellCactusWall": "spikes",
    "itemSpellCactusDecoy": "cactus+note", "itemSpellCactusUlti": "golem",
    "itemSpellIceBreeze": "wind", "itemSpellIceLance": "arch", "itemSpellIceCube": "cube",
    "itemSpellIceGlaze": "snowflake+shield", "itemSpellIceBlizzard": "cloud+snowflake",
}

UPGRADE_GLYPHS = {
    "jokerUpgradeAccuracy": "crosshair", "jokerUpgradeTotalAmmoBag": "pouch", "jokerUpgradeTotalAmmoBagC": "pouch",
    "jokerUpgradeFirerate": "pew", "jokerUpgradeFirerateB": "pew", "jokerUpgradeFirerateC": "pew",
    "jokerUpgradeClipSize": "magazine", "jokerUpgradeDamage": "burst", "jokerUpgradeDrawSpeed": "hand+chevrons",
    "jokerUpgradeHeal": "heart", "jokerUpgradeJumpHeight": "up", "jokerUpgradeLifesteal": "vampire",
    "jokerUpgradeBoomerangLingeringTime": "hourglass", "jokerUpgradeSherrifStarPickUpRange": "magnet",
    "jokerUpgradeBoomerangRange": "expand", "jokerUpgradeWeaponMeleeRange": "expand", "jokerUpgradeReloadSpeed": "reload",
    "jokerUpgradeHeroSpeed": "chevrons", "jokerUpgradeSpellCooldownReduction": "hourglass+minus",
}

# Jokers: pictogram, and for elemental jokers the spell school shown in a corner badge.
JOKER_GLYPHS = {
    # Normal
    "jokerBracing": "reload+plus", "jokerChickshot": "drumstick", "jokerDeadlyStrong": "ghost+plus",
    "jokerFreeCocktail": "bottle+plus", "jokerGoldTooth": "tooth", "jokerHeavyDrinker": "bottle",
    "jokerHeavyWeapon": "weight", "jokerHelpingHand": "allies+chevrons", "jokerKnuckleDown": "fist",
    "jokerLastDance": "skull+chevrons", "jokerLightWeight": "feather", "jokerMagicReload": "reload+star",
    "jokerPanicAttack": "heart+burst", "jokerPartyShot": "confetti", "jokerPigshot": "pig",
    "jokerQuickDraw": "hand+chevrons", "jokerRelentless": "skull+burst", "jokerPlasticDuck": "duck",
    "jokerShineBright": "sun", "jokerSpareBullets": "bullets+plus", "jokerFocusedFeet": "crosshair+chevrons",
    # Fine
    "jokerAntiGravityFalls": "feather+up", "jokerBellShot": "bell", "jokerBouncingBall": "spring+burst",
    "jokerCactusDay": "cactus", "jokerCarePackage": "chest+plus", "jokerChad": "hat",
    "jokerClutch": "bomb", "jokerCrackShot": "burst+plus", "jokerFastHands": "reload+chevrons",
    "jokerFightOrFlight": "fist+chevrons", "jokerFistFight": "fist+burst", "jokerFrostBite": "fist+snowflake",
    "jokerGoldProspector": "nugget", "jokerHop": "up", "jokerLuckyStrike": "clover",
    "jokerLunge": "fist+expand", "jokerJokheal": "card+heart", "jokerPickPick": "pickaxe",
    "jokerPreciousRush": "ring", "jokerPricklyPear": "pear", "jokerRage": "flame+skull",
    "jokerRunAndGun": "chevrons+bullet", "jokerRunAndReload": "chevrons+reload", "jokerScoutsHonor": "shield+star",
    "jokerShroomGrave": "mushroom", "jokerSlowAndSteady": "crosshair+minus", "jokerSoulReaper": "ghost+plus",
    "jokerSoulSiphon": "ghost+heart", "jokerSpeedyGunzales": "chevrons", "jokerFastDraw": "hand+burst",
    "jokerWellFed": "heart+plus",
    # Prime
    "jokerAmmoSupply": "chest+bullet", "jokerApprentice": "hourglass+minus", "jokerAvalanche": "shield+burst",
    "jokerBerserker": "skull+fist", "jokerBloodLust": "fist+drop", "jokerCheapSkate": "coin+heart",
    "jokerChonky": "weight+burst", "jokerDestroyer": "magazine+burst", "jokerDisgrace": "horseshoe+chevrons",
    "jokerExplosiveRoundsAcid": "bomb", "jokerExplosiveRoundsElec": "bomb", "jokerExplosiveRoundsFrost": "bomb",
    "jokerExplosiveRounds": "bomb", "jokerGreatWall": "wall", "jokerHealthyBoi": "heart+chevrons",
    "jokerFreezeOver": "shield+snowflake", "jokerMagicFriendship": "allies+heart", "jokerPewPewPew": "pew",
    "jokerRampage": "reload+skull", "jokerReloadMastery": "reload", "jokerScrubBullet": "bullet+minus",
    "jokerSharpShooter": "crosshair+plus", "jokerSoulEater": "ghost+burst", "jokerStonks": "chest+card",
    "jokerWeakLink": "chain", "jokerHeadshotRefund": "crosshair+bullet",
    # Mythic
    "jokerCdrAcid": "hourglass", "jokerCdrCactus": "hourglass", "jokerColdBlooded": "fist+snowflake",
    "jokerConsumer": "magazine+minus", "jokerDeathsDance": "shield+hourglass", "jokerEatAPunch": "fist+heart",
    "jokerCdrElec": "hourglass", "jokerExecute": "skull_x", "jokerExtraJump": "up+plus",
    "jokerCdrFrost": "hourglass", "jokerHeadBang": "crosshair+burst", "jokerHitMe": "heart+hourglass",
    "jokerHoarder": "cards", "jokerTweakDealer": "card+plus", "jokerLastStand": "shield+skull",
    "jokerLazy": "bullets+hourglass", "jokerLifePact": "heart+skull", "jokerLowGravity": "moon",
    "jokerCdrFire": "hourglass", "jokerRiposte": "shield+fist", "jokerSecondWind": "heart+reload",
    "jokerSnackAPunch": "fist+shield", "jokerThickSkin": "shield+minus", "jokerTinMan": "tin",
    "jokerCdrVoodoo": "hourglass", "jokerWestWizard": "hat+star",
    # Legendary
    "jokerAllMighty": "crown", "jokerBattleMage": "skull+hourglass", "jokerCamper": "campsite",
    "jokerCantRipOneTrick": "hourglass+star", "jokerCastAway": "star+hourglass", "jokerCoinFlip": "coin",
    "jokerDoubleDown": "shield+plus", "jokerDwarf": "down", "jokerExtraDash": "dash+plus",
    "jokerGiant": "flex", "jokerGlassCannon": "glass", "jokerGoliath": "flex+heart",
    "jokerOneTrick": "cards+star", "jokerMachineGun": "pew+up", "jokerRicochet": "bullet+swap",
    "jokerSpeedster": "chevrons+burst", "jokerSpellRoulette": "wheel", "jokerToolBox": "wrench",
    "jokerVampire": "vampire",
    # Unique
    "jokerAimingBurst": "crosshair+bullets", "jokerBardbarian": "note+fist", "jokerChonkyThrow": "boomerang+plus",
    "jokerEagleLever": "eagle", "jokerEcoTrick": "reload+bullet", "jokerElementalSpin": "tornado",
    "jokerFanningAce": "hand+bullets", "jokerFistRage": "fist+flame", "jokerFistRoDah": "fist+snowflake",
    "jokerFocusShot": "crosshair+hourglass", "jokerFrenzySpin": "tornado+skull", "jokerHomingBurst": "dart",
    "jokerJumpStar": "sheriff+up", "jokerLingeringThrow": "boomerang+hourglass", "jokerLullabard": "note+heart",
    "jokerMarkAce": "eye", "jokerMindShot": "crosshair+bomb", "jokerOverBlast": "bullets+burst",
    "jokerOverDraw": "arrow+plus", "jokerRushBlast": "bullet+crosshair", "jokerScavengerStar": "sheriff+magnet",
    "jokerSkyLash": "lasso+up", "jokerSpellLash": "lasso+star", "jokerStackedLever": "bullets+reload",
    "jokerSwampTrick": "drop+burst", "jokerUltraDraw": "arrow+bomb",
}
JOKER_SCHOOLS = {
    "jokerExplosiveRounds": "itemFire", "jokerExplosiveRoundsAcid": "itemAcid", "jokerExplosiveRoundsElec": "itemElec",
    "jokerExplosiveRoundsFrost": "itemIce", "jokerCdrFire": "itemFire", "jokerCdrElec": "itemElec",
    "jokerCdrAcid": "itemAcid", "jokerCdrVoodoo": "itemVoodoo", "jokerCdrCactus": "itemCactus", "jokerCdrFrost": "itemIce",
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
require([s["id"] for s in spells["spells"]], SPELL_GLYPHS, "spells")
require([j["id"] for j in jokers], JOKER_GLYPHS, "jokers")
require([u["id"] for u in upgrades], UPGRADE_GLYPHS, "upgrades")

icons = {"itemHero": tile_icon(EQUIPMENT_SILHOUETTES["itemHero"], "Hero")}
icons.update({e["id"]: tile_icon(EQUIPMENT_SILHOUETTES[e["id"]], e["name"]) for e in equipment})
icons.update({s["id"]: badge_icon(SCHOOL_COLORS[s["id"]], SCHOOL_GLYPHS[s["id"]], s["name"], double_ring=True)
              for s in spells["schools"]})
icons.update({s["id"]: badge_icon(SCHOOL_COLORS[s["school"]], SPELL_GLYPHS[s["id"]], s["name"]) for s in spells["spells"]})
icons.update({j["id"]: joker_icon(j, JOKER_GLYPHS[j["id"]], JOKER_SCHOOLS.get(j["id"])) for j in jokers})
icons.update({u["id"]: upgrade_icon(UPGRADE_GLYPHS[u["id"]], u["name"]) for u in upgrades})

os.makedirs(out_dir, exist_ok=True)
for stale in os.listdir(out_dir):
    if stale.endswith(".svg") and stale[:-4] not in icons:
        os.remove(os.path.join(out_dir, stale))
for icon_id, svg in icons.items():
    with open(os.path.join(out_dir, icon_id + ".svg"), "w") as f:
        f.write(svg)
print(f"{len(icons)} icons written to {out_dir}")
