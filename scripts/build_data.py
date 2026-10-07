"""Builds data/*.json from a farfarwest.wiki.gg dump (Cargo query results + raw page wikitext).

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


def split_list(v):
    return [s.strip() for s in (v or "").split(",") if s.strip()]


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
upgrades = load("upgrades.json")
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
    item["upgrades"] = [
        {"stat": u["title"], "pct_per_slot": num(u["pct step"]), "max_slots": num(u["max slots"])}
        for u in upgrades if u["equipment title"] == row["title"]
    ]
    equipment.append(item)

hero = {"upgrades": [
    {"stat": u["title"], "pct_per_slot": num(u["pct step"]), "max_slots": num(u["max slots"])}
    for u in upgrades if u["equipment title"] == "Hero"
]}

jokers = []
for row in load("jokers.json"):
    jokers.append({
        "name": row["title"],
        "rarity": row["rarity"],
        "slot_cost": num(row["slots"]),
        "max_equip": num(row["max equip"]),
        "buy_price": num(row["buy price"]),
        "sell_price": num(row["sell price"]),
        "effect": row["effect"],
        # "Hero" = equipped on the hero; otherwise the list of weapons it can go on.
        "available_on": sorted({w.title() for w in split_list(row["available on"])}),
        "obtainable_from": split_list(row["obtainable from"]),
        "droppable": row["droppable"] == "1",
    })

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


def strip_wikitext(s):
    s = re.sub(r"\[\[File:[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\{\{[^}]*\}\}", "", s)
    return re.sub(r"\s+", " ", s).strip()


options = load("combo_options.json")
combos = [{
    "name": c["title"],
    "elements": [strip_wikitext(a) for a in split_list(c["archetype"])],
    "description": strip_wikitext(c["description"]),
    "triggers": [{"a": split_list(o["spell 1"]), "b": split_list(o["spell 2"])}
                 for o in options if o["combo title"] == c["title"]],
} for c in load("combos.json")]

out = {
    "equipment.json": sorted(equipment, key=lambda e: (e["type"], e["name"])),
    "hero.json": hero,
    "jokers.json": sorted(jokers, key=lambda j: (j["rarity"], j["name"])),
    "spells.json": sorted(spells, key=lambda s: (s["element"], s["unlock_level"] or 0)),
    "spell_combos.json": combos,
}
os.makedirs(out_dir, exist_ok=True)
for name, data in out.items():
    with open(os.path.join(out_dir, name), "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(name, len(data) if isinstance(data, list) else "")
