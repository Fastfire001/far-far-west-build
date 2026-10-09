"""Builds data/*.json (equipment, spells, jokers, upgrades, progression) and their translations (data/i18n/) from
assets extracted from the game by tools/game-extract (see bin/extract-game).

Usage: python3 scripts/build_game_data.py <extract_dir> <out_dir>

The game's assets use unversioned property serialization: values are written without names or types, in the
order of the row struct's fields. That order and the field types are hard-coded in JOKER_ROW and ITEM_ROW below;
they come from the Blueprint structs /Game/Progress/S_PlayerJokers and S_PlayerItems. If a game update changes
those structs, decoding stops with an error and the layouts must be updated (see docs/game-mechanics.md,
"Extraction depuis le jeu"). The same goes for a new item: it must be added to EQUIPMENT, SPELLS or IGNORED_ITEMS.
"""
import glob, json, os, re, struct, sys

extract_dir, out_dir = sys.argv[1:3]

# Fields of S_PlayerJokers, in serialization order.
JOKER_ROW = [
    ("name", "text"), ("description", "text"), ("epic", "bool"), ("value", "double"),
    ("displayValueAsFlat", "bool"), ("maxAvailable", "int"), ("rarity", "byte"), ("requiredAmountSlots", "int"),
    ("buyPrice", "int"), ("sellPrice", "int"), ("associatedChallenge", "name"), ("canBeBought", "bool"),
    ("canBeGambled", "bool"), ("canBeRandomlyLooted", "bool"), ("canBeLootedInSolo", "bool"),
    ("canBeDroppedInGame", "bool"), ("icon", "object"), ("upgradeColor", "linear_color"),
    ("availableOnItems", "array_name"), ("updatePlayerHealValueInGame", "double"),
    ("updatePlayerShieldPointsValueInGame", "double"), ("isEnabled", "bool"),
]
# Fields of S_PlayerItems, in serialization order.
ITEM_ROW = [("associatedItemBlueprint", "object")]
# E_Rarity, in enum order.
RARITIES = ["Normal", "Fine", "Prime", "Mythic", "Legendary", "Unique"]
# Items of DT_PlayerItems that can be equipped in a build: id → (type, key prefix in the ST_Weapons string table).
EQUIPMENT = {
    "itemQuadCylinder": ("main", "ST_Weapon_QuadBarrel"), "itemShotgun": ("main", "ST_Weapon_Shotgun"),
    "itemLongRanger": ("main", "ST_Weapon_Kwartsman"), "itemMinigun": ("main", "ST_Weapon_Minigun"),
    "itemWinchester": ("main", "ST_Weapon_Winchester"), "itemKnuckles": ("main", "ST_Weapons_Knuckles"),
    "itemLasso": ("main", "ST_Weapon_Whip"),
    "itemPistol": ("sidearm", "ST_Weapon_Pistol"), "itemBow": ("sidearm", "ST_Weapon_Bow"),
    "itemDualRevolver": ("sidearm", "ST_Weapon_DualRevolver"), "itemBoomerang": ("sidearm", "ST_Weapon_Boomerang"),
    "itemSheriffStar": ("sidearm", "ST_Weapon_SheriffStar"), "itemBanjo": ("sidearm", "ST_Weapons_Banjo"),
    "itemUtilityAmmo": ("utility", "ST_Grenade_Ammo"), "itemUtilityBottleCrate": ("utility", "ST_Grenade_BottleCrate"),
    "itemUtilityHealBottle": ("utility", "ST_Grenade_Heal"), "itemUtilityImpulse": ("utility", "ST_Grenade_Impulse"),
}
# Spell schools: item id → key of the school name in the ST_Spells string table.
SCHOOLS = {
    "itemFire": "ST_Elements_Pyro", "itemElec": "ST_Elements_Electric", "itemAcid": "ST_Elements_Acid",
    "itemVoodoo": "ST_Elements_Vooodoo", "itemCactus": "ST_Elements_Cactus", "itemIce": "ST_Elements_Frost",
}
# Spells: item id → (school item id, key prefix in ST_Spells). The internal names often differ from the displayed
# ones (CactusUlti = Bandito, ElecSuperJump = Boing...). IceLance = Bridge is deduced by elimination: it is the
# only Frost spell id left and Bridge the only Frost name left.
SPELLS = {
    "itemSpellFireBall": ("itemFire", "ST_Spell_Fire_Fireball"), "itemSpellFireBeam": ("itemFire", "ST_Spell_Fire_Firebeam"),
    "itemSpellFireSurcharge": ("itemFire", "ST_Spell_Fire_Surcharge"), "itemSpellFireWisp": ("itemFire", "ST_Spell_Fire_Wisp"),
    "itemSpellFireFingergun": ("itemFire", "ST_Spell_Fire_FingerGuns"),
    "itemSpellElecStrike": ("itemElec", "ST_Spell_Electric_Strikes"), "itemSpellElecSuperJump": ("itemElec", "ST_Spell_Electric_Boing"),
    "itemSpellElecPortal": ("itemElec", "ST_Spell_Electric_Portal"), "itemSpellElecSwap": ("itemElec", "ST_Spell_Electric_TP"),
    "itemSpellElecThunderstrike": ("itemElec", "ST_Spell_Electric_Might"),
    "itemSpellAcidThrower": ("itemAcid", "ST_Spell_Acid_Thrower"), "itemSpellAcidGeyser": ("itemAcid", "ST_Spell_Acid_Geyser"),
    "itemSpellAcidBubble": ("itemAcid", "ST_Spell_Acid_Bubble"), "itemSpellAcidContagion": ("itemAcid", "ST_Spell_Acid_Contagion"),
    "itemSpellAcidRain": ("itemAcid", "ST_Spell_Acid_Rain"),
    "itemSpellVoodooDrain": ("itemVoodoo", "ST_Spell_Voodoo_Drain"), "itemSpellVoodooHeal": ("itemVoodoo", "ST_Spell_Voodoo_Rescue"),
    "itemSpellVoodooCorruption": ("itemVoodoo", "ST_Spell_Voodoo_Corruption"),
    "itemSpellVoodooHealArea": ("itemVoodoo", "ST_Spell_Voodoo_Ritual"), "itemSpellVoodooDoll": ("itemVoodoo", "ST_Spell_Voodoo_Doll"),
    "itemSpellCactusBetty": ("itemCactus", "ST_Spell_Cactus_Mine"), "itemSpellCactusTurret": ("itemCactus", "ST_Spell_Cactus_Turret"),
    "itemSpellCactusWall": ("itemCactus", "ST_Spell_Cactus_Wall"), "itemSpellCactusDecoy": ("itemCactus", "ST_Spell_Cactus_Decoy"),
    "itemSpellCactusUlti": ("itemCactus", "ST_Spell_Cactus_Bandito"),
    "itemSpellIceBreeze": ("itemIce", "ST_Spell_Frost_Breeze"), "itemSpellIceLance": ("itemIce", "ST_Spell_Frost_Bridge"),
    "itemSpellIceCube": ("itemIce", "ST_Spell_Frost_Cube"), "itemSpellIceGlaze": ("itemIce", "ST_Spell_Frost_Glaze"),
    "itemSpellIceBlizzard": ("itemIce", "ST_Spell_Frost_Blizzard"),
}
# Items of DT_PlayerItems that are not build choices.
IGNORED_ITEMS = {"itemHero", "itemAxe", "itemDefaultGun", "itemMelee"}


def read(name):
    return open(os.path.join(extract_dir, name), "rb").read()


class Reader:
    def __init__(self, data, names):
        self.data, self.names, self.pos = data, names, 0

    def unpack(self, fmt):
        value = struct.unpack_from("<" + fmt, self.data, self.pos)
        self.pos += struct.calcsize("<" + fmt)
        return value[0]

    def name(self):
        index, number = self.unpack("I"), self.unpack("I")
        if index >= len(self.names):
            raise ValueError(f"name index {index} out of range at {self.pos}")
        return self.names[index] + (f"_{number - 1}" if number else "")

    def fstring(self):
        length = self.unpack("i")
        if length >= 0:
            text = self.data[self.pos:self.pos + max(length - 1, 0)].decode("latin-1")
            self.pos += length
        else:
            text = self.data[self.pos:self.pos - 2 * length - 2].decode("utf-16le")
            self.pos += -2 * length
        return text

    def text(self):
        self.unpack("I")  # flags
        history = self.unpack("b")
        if history == -1:  # culture invariant string
            return self.fstring() if self.unpack("i") else ""
        if history == 11:  # string table entry
            return {"table": self.name(), "key": self.fstring()}
        raise ValueError(f"unsupported FText history type {history} at {self.pos}")

    def value(self, kind):
        if kind == "array_name":
            return [self.name() for _ in range(self.unpack("i"))]
        return {
            "text": self.text, "name": self.name, "bool": lambda: bool(self.unpack("B")),
            "int": lambda: self.unpack("i"), "byte": lambda: self.unpack("B"), "double": lambda: self.unpack("d"),
            "object": lambda: self.unpack("i"), "linear_color": lambda: [self.unpack("f") for _ in range(4)],
        }[kind]()

    def unversioned(self, fields):
        """Reads an unversioned struct: a header listing which fields are serialized, then their values."""
        fragments = []
        while True:
            packed = self.unpack("H")
            fragments.append((packed & 0x7F, bool(packed & 0x80), packed >> 9))
            if packed & 0x100:
                break
        zero_count = sum(count for _, has_zeroes, count in fragments if has_zeroes)
        zero_mask = 0
        if zero_count:
            size = 1 if zero_count <= 8 else 2 if zero_count <= 16 else 4 * ((zero_count + 31) // 32)
            zero_mask = int.from_bytes(self.data[self.pos:self.pos + size], "little")
            self.pos += size
        row, index, zero_bit = {}, 0, 0
        for skip, has_zeroes, count in fragments:
            index += skip
            for _ in range(count):
                if index >= len(fields):
                    raise ValueError(f"field index {index} out of range: the row struct has changed")
                field, kind = fields[index]
                is_zero = has_zeroes and (zero_mask >> zero_bit) & 1
                zero_bit += has_zeroes
                row[field] = None if is_zero else self.value(kind)
                index += 1
        return row


def decode_data_table(asset, row_prefix, fields):
    names = read(asset + ".names.txt").decode().split("\n")
    reader = Reader(read(asset + ".uasset"), names)
    # The rows follow an int32 row count. Candidates are an int32 followed by a name starting with row_prefix (the
    # package header can contain such false positives); the right one is the one whose rows decode up to the end
    # of the export. A wrong field layout desynchronizes the reader long before that.
    for start in range(len(reader.data) - 12):
        count = struct.unpack_from("<i", reader.data, start)[0]
        index = struct.unpack_from("<I", reader.data, start + 4)[0]
        if not (0 < count < 10000 and index < len(names) and names[index].startswith(row_prefix)):
            continue
        reader.pos = start + 4
        try:
            rows = {}
            for _ in range(count):
                key = reader.name()
                rows[key] = reader.unversioned(fields)
        except (ValueError, IndexError, KeyError, struct.error, UnicodeDecodeError):
            continue
        if len(reader.data) - reader.pos <= 16:
            return rows
    raise SystemExit(f"{asset}: no row list decodes up to the end of the export, the row struct has probably changed")


def decode_curve(asset):
    """Reads the keys of a cubic FRichCurve from a raw CurveFloat asset."""
    data = read(asset + ".uasset")
    key_size = 3 + 6 * 4
    for start in range(len(data) - 4):
        count = struct.unpack_from("<i", data, start)[0]
        if not 2 <= count <= 100 or start + 4 + count * key_size > len(data):
            continue
        keys = []
        for i in range(count):
            offset = start + 4 + i * key_size
            interp = data[offset]
            time, value, arrive, _, leave, _ = struct.unpack_from("<6f", data, offset + 3)
            keys.append((interp, time, value, arrive, leave))
        if all(k[0] <= 3 for k in keys) and all(a[1] < b[1] for a, b in zip(keys, keys[1:])):
            return keys
    raise SystemExit(f"{asset}: curve keys not found")


def evaluate_curve(keys, x):
    for (_, x0, y0, _, leave), (_, x1, y1, arrive, _) in zip(keys, keys[1:]):
        if x0 <= x <= x1:
            dt, s = x1 - x0, (x - x0) / (x1 - x0)
            return ((2 * s**3 - 3 * s**2 + 1) * y0 + (s**3 - 2 * s**2 + s) * leave * dt
                    + (-2 * s**3 + 3 * s**2) * y1 + (s**3 - s**2) * arrive * dt)
    raise ValueError(f"{x} is outside the curve")


def string_table(name):
    return json.load(open(os.path.join(extract_dir, name + ".json")))[0]["StringTable"]


# English source texts, by string table. Translations are indexed by the table's namespace and the same keys.
STRING_TABLES = {name: string_table(name) for name in ("ST_Tweaks", "ST_Weapons", "ST_Spells")}
# Text keys of every item: {id: {"name": (table, key), "description": (table, key)}}.
text_keys = {}


def text(item_id, field, table, key):
    """Records the text key of an item's field and returns its English text."""
    if key not in STRING_TABLES[table]["KeysToEntries"]:
        raise SystemExit(f"string {key} not found in {table}: the game's text keys have changed")
    text_keys.setdefault(item_id, {})[field] = (table, key)
    return clean(STRING_TABLES[table]["KeysToEntries"][key])


def clean(value):
    return value.replace("\r\n", "\n")


def row_text(item_id, field, value):
    """Text of a DataTable row field: an FText pointing to a string table entry."""
    if not isinstance(value, dict):
        return value or ""
    table = next(t for t, st in STRING_TABLES.items() if value["table"].endswith("." + t))
    return text(item_id, field, table, value["key"])


item_ids = set(decode_data_table("DT_PlayerItems", "item", ITEM_ROW))
unknown = item_ids - EQUIPMENT.keys() - SPELLS.keys() - SCHOOLS.keys() - IGNORED_ITEMS
missing = (EQUIPMENT.keys() | SPELLS.keys() | SCHOOLS.keys()) - item_ids
if unknown or missing:
    raise SystemExit(f"DT_PlayerItems changed: unknown items {sorted(unknown)}, missing items {sorted(missing)}")

equipment = [{
    "id": key,
    "name": text(key, "name", "ST_Weapons", prefix + "_Name"),
    "type": kind,  # main, sidearm or utility
    "description": text(key, "description", "ST_Weapons", prefix + "_Description"),
} for key, (kind, prefix) in EQUIPMENT.items()]

spell_schools = [{
    "id": key,
    "name": text(key, "name", "ST_Spells", name_key),
    "description": text(key, "description", "ST_Spells", name_key + "_Description"),
} for key, name_key in SCHOOLS.items()]
spells = [{
    "id": key,
    "name": text(key, "name", "ST_Spells", prefix + "_Name"),
    "school": school,
    "description": text(key, "description", "ST_Spells", prefix + "_Description"),
} for key, (school, prefix) in SPELLS.items()]


def items(ids):
    """Checks that the item ids a joker or an upgrade refers to are the hero or known equipment."""
    unknown = [i for i in ids if i != "itemHero" and i not in EQUIPMENT]
    if unknown:
        raise SystemExit(f"unknown item ids {unknown}: add them to EQUIPMENT")
    return ids


rows = {key: row for key, row in decode_data_table("DT_PlayerJokers", "joker", JOKER_ROW).items() if row["isEnabled"]}

jokers, upgrades = [], []
for key, row in rows.items():
    if key.startswith("jokerUpgrade"):
        if row["availableOnItems"]:  # rows without items are unused leftovers
            upgrades.append({
                "id": key,
                "name": row_text(key, "name", row["name"]),
                "value": row["value"],
                # true: value is a flat amount (e.g. +5 HP); false: a fraction (0.05 = +5 %).
                "flat": bool(row["displayValueAsFlat"]),
                "max_slots": row["maxAvailable"],
                "gold_cost": row["buyPrice"],
                "available_on": items(row["availableOnItems"]),
            })
        continue
    jokers.append({
        "id": key,
        # As displayed in the game: joker names are upper case in every language.
        "name": row_text(key, "name", row["name"]),
        "rarity": RARITIES[row["rarity"] or 0],
        "slot_cost": row["requiredAmountSlots"] or 0,
        "max_equip": row["maxAvailable"] or 0,
        "buy_price": row["buyPrice"] or 0,
        "sell_price": row["sellPrice"] or 0,
        "description": row_text(key, "description", row["description"]),
        # ["itemHero"] for a hero joker, otherwise the ids of the weapons it can be equipped on.
        "available_on": items(row["availableOnItems"] or []),
        "can_be_bought": bool(row["canBeBought"]),
        "can_be_gambled": bool(row["canBeGambled"]),
        # Challenge that unlocks the joker (e.g. challengeLvl40ItemBow), if any.
        "unlocked_by": row["associatedChallenge"],
        "can_drop_in_mission": bool(row["canBeRandomlyLooted"]),
        "droppable": bool(row["canBeDroppedInGame"]),
    })


# Jokers that share their name in the game: the Explosive Hits variants, one per element. They are told apart by
# appending the name of their spell school, in each language: EXPLOSIVE HITS (Acid), COUPS EXPLOSIFS (Acide)...
# Other name collisions that only exist in a translation (e.g. two German jokers named SEELENERNTER) are left as
# in the game.
JOKER_VARIANTS = {
    "jokerExplosiveRounds": "itemFire", "jokerExplosiveRoundsAcid": "itemAcid",
    "jokerExplosiveRoundsElec": "itemElec", "jokerExplosiveRoundsFrost": "itemIce",
}
school_names = {school["id"]: school["name"] for school in spell_schools}
shared = {j["id"] for j in jokers if sum(k["name"] == j["name"] for k in jokers) > 1}
if shared != JOKER_VARIANTS.keys():
    raise SystemExit(f"jokers sharing a name changed: {sorted(shared ^ JOKER_VARIANTS.keys())}, update JOKER_VARIANTS")
for joker in jokers:
    if joker["id"] in JOKER_VARIANTS:
        joker["name"] += f" ({school_names[JOKER_VARIANTS[joker['id']]]})"

# Translations: one file per language found by the extractor (<culture>.locres.json), id → {name, description}.
translations = {}
for path in sorted(glob.glob(os.path.join(extract_dir, "*.locres.json"))):
    culture = os.path.basename(path).split(".")[0]
    locres = json.load(open(path))
    entries, missing_count = {}, 0
    for item_id, fields in text_keys.items():
        for field, (table, key) in fields.items():
            translated = locres.get(STRING_TABLES[table]["TableNamespace"], {}).get(key)
            if translated is None:
                missing_count += 1  # the planner falls back to the English text
            else:
                entries.setdefault(item_id, {})[field] = clean(translated)
    for joker_id, school_id in JOKER_VARIANTS.items():
        name = entries.get(joker_id, {}).get("name")
        school = entries.get(school_id, {}).get("name", school_names[school_id])
        if name:
            entries[joker_id]["name"] = f"{name} ({school})"
    translations[culture] = entries
    if missing_count:
        print(f"{culture}: {missing_count} missing translations", file=sys.stderr)
if not translations:
    raise SystemExit("no localization file found in the extract directory")

slot_curve = decode_curve("C_UnlockedJokers")
max_slots = int(slot_curve[-1][1])
progression = {
    # Level required to unlock each joker slot: index 0 is the 1st slot (curve C_UnlockedJokers, rounded down).
    "joker_slot_levels": [int(evaluate_curve(slot_curve, n)) for n in range(1, max_slots + 1)],
}

out = {
    "equipment.json": equipment,
    "spells.json": {"schools": spell_schools, "spells": spells},
    "jokers.json": sorted(jokers, key=lambda j: (RARITIES.index(j["rarity"]), j["name"])),
    "upgrades.json": sorted(upgrades, key=lambda u: (u["name"], u["id"])),
    "progression.json": progression,
}
out.update({f"i18n/{culture}.json": dict(sorted(entries.items())) for culture, entries in translations.items()})
os.makedirs(os.path.join(out_dir, "i18n"), exist_ok=True)
for name, data in out.items():
    with open(os.path.join(out_dir, name), "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
print(f"equipment.json {len(equipment)}, spells.json {len(spells)}, jokers.json {len(jokers)}, upgrades.json {len(upgrades)}, "
      f"joker slot levels {progression['joker_slot_levels']}, translations {sorted(translations)}")
