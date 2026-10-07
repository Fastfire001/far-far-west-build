"""Builds data/equipment.json and data/spells.json from a farfarwest.wiki.gg dump
(Cargo query results + raw page wikitext). Jokers and upgrades come from the game files instead
(scripts/build_game_data.py).

Usage: python3 scripts/build_data.py <cargo_dir> <wiki_ns0_dir> <out_dir>
"""
import json, os, re, sys

cargo_dir, wiki_dir, out_dir = sys.argv[1:4]


def load(name):
    return json.load(open(os.path.join(cargo_dir, name)))


def num(v):
    if v in ("", None):
        return None
    f = float(v)
    return int(f) if f.is_integer() else f


def infobox(page, name):
    path = os.path.join(wiki_dir, page + ".wiki")
    if not os.path.exists(path):
        return {}
    m = re.search(r"\{\{" + name + r"(.*?)\n\}\}", open(path).read(), re.S)
    fields = {}
    for line in (m.group(1) if m else "").splitlines():
        if line.startswith("|") and "=" in line:
            k, v = line[1:].split("=", 1)
            v = re.sub(r"<!--.*?-->", "", v).strip()
            if v:
                fields[k.strip()] = v
    return fields


WEAPON_FIELDS = ["clip_size", "total_ammo", "primary_damage", "primary_count", "secondary_damage",
                 "secondary_count", "weakspot_mult", "xp_mult"]
equipment = []
for row in load("equipment.json"):
    if row["type"] == "Melee":
        continue
    box = infobox(row["page"], "Infobox Equipment")
    item = {"name": row["title"], "type": row["type"]}
    for f in WEAPON_FIELDS:
        v = num(row.get(f.replace("_", " ")))
        if v is not None:
            item[f] = v
    for f in ("fire_interval_min", "fire_interval_max", "range", "charge_rate", "description"):
        if f in box:
            item[f] = box[f] if f in ("charge_rate", "description") else num(box[f])
    equipment.append(item)

spells = []
for row in load("spells.json"):
    box = infobox(row["page"], "Infobox Spell")
    spell = {
        "name": row["title"],
        "element": row["element"],
        "type": row["type"],
        "unlock_level": num(row["level requirement"]),
        "cooldown": num(row["cooldown"]),
        "description": row["description"],
        "xp_multiplier": num(row["xp multiplier"]),
        "creates_puddles": row["creates puddles"] == "1",
    }
    for f in ("damage", "area_of_effect", "duration"):
        if f in box:
            spell[f] = box[f]
    spells.append(spell)


out = {
    "equipment.json": sorted(equipment, key=lambda e: (e["type"], e["name"])),
    "spells.json": sorted(spells, key=lambda s: (s["element"], s["unlock_level"] or 0)),
}
os.makedirs(out_dir, exist_ok=True)
for name, data in out.items():
    with open(os.path.join(out_dir, name), "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(name, len(data) if isinstance(data, list) else "")
