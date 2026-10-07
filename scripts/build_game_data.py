"""Builds data/jokers.json, data/upgrades.json and data/progression.json from assets extracted from the game
by tools/game-extract (see bin/extract-game).

Usage: python3 scripts/build_game_data.py <extract_dir> <out_dir>

The game's assets use unversioned property serialization: values are written without names or types, in the
order of the row struct's fields. That order and the field types are hard-coded in JOKER_ROW below; they come
from the Blueprint struct /Game/Progress/S_PlayerJokers. If a game update changes that struct, decoding stops
with an error and JOKER_ROW must be updated (see docs/game-mechanics.md, "Extraction depuis le jeu").
"""
import json, os, re, struct, sys

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
# E_Rarity, in enum order.
RARITIES = ["Normal", "Fine", "Prime", "Mythic", "Legendary", "Unique"]
# Internal item ids → equipment names used in data/equipment.json.
ITEMS = {
    "itemHero": "Hero", "itemQuadCylinder": "Quad Cylinder", "itemShotgun": "Shotgun",
    "itemLongRanger": "Long Ranger", "itemMinigun": "Minigun", "itemWinchester": "Leveredge",
    "itemKnuckles": "Knuckles", "itemLasso": "Lasso", "itemPistol": "Revolver", "itemBow": "Bow",
    "itemDualRevolver": "Dual Revolvers", "itemBoomerang": "Boomerang", "itemSheriffStar": "Sheriff Star",
    "itemBanjo": "Banjo",
}


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
    # The rows follow an int32 row count; find it by looking for the first row's name right after it.
    for start in range(len(reader.data) - 12):
        reader.pos = start
        count = reader.unpack("i")
        index = struct.unpack_from("<I", reader.data, reader.pos)[0]
        if 0 < count < 10000 and index < len(names) and names[index].startswith(row_prefix):
            break
    else:
        raise SystemExit(f"{asset}: row list not found")
    rows = {}
    for _ in range(count):
        key = reader.name()
        rows[key] = reader.unversioned(fields)
    # A wrong field layout desynchronizes the reader long before the end of the export.
    if len(reader.data) - reader.pos > 16:
        raise SystemExit(f"{asset}: {len(reader.data) - reader.pos} bytes left after the rows, the row struct has changed")
    return rows


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


def title(name):
    """CRACKSHOT → Crackshot, SCOUT'S HONOR → Scout's Honor, EAT-A-PUNCH → Eat-A-Punch."""
    return re.sub(r"[A-Za-z][^\s-]*", lambda m: m.group(0)[0].upper() + m.group(0)[1:].lower(), name)


def items(ids):
    unknown = [i for i in ids if i not in ITEMS]
    if unknown:
        raise SystemExit(f"unknown item ids {unknown}: add them to ITEMS")
    return [ITEMS[i] for i in ids]


strings = json.load(open(os.path.join(extract_dir, "ST_Tweaks.json")))[0]["StringTable"]["KeysToEntries"]


def resolve(text):
    return strings.get(text["key"], "") if isinstance(text, dict) else text or ""


rows = {key: row for key, row in decode_data_table("DT_PlayerJokers", "joker", JOKER_ROW).items() if row["isEnabled"]}

jokers, upgrades = [], []
for key, row in rows.items():
    if key.startswith("jokerUpgrade"):
        if row["availableOnItems"]:  # rows without items are unused leftovers
            upgrades.append({
                "id": key,
                "stat": resolve(row["name"]),
                "value": row["value"],
                # true: value is a flat amount (e.g. +5 HP); false: a fraction (0.05 = +5 %).
                "flat": bool(row["displayValueAsFlat"]),
                "max_slots": row["maxAvailable"],
                "gold_cost": row["buyPrice"],
                "available_on": items(row["availableOnItems"]),
            })
        continue
    description = resolve(row["description"])
    jokers.append({
        "id": key,
        "name": title(resolve(row["name"])),
        "rarity": RARITIES[row["rarity"] or 0],
        "slot_cost": row["requiredAmountSlots"] or 0,
        "max_equip": row["maxAvailable"] or 0,
        "buy_price": row["buyPrice"] or 0,
        "sell_price": row["sellPrice"] or 0,
        "effect": description,
        # ["Hero"] for a hero joker, otherwise the weapons it can be equipped on.
        "available_on": items(row["availableOnItems"] or []),
        "can_be_bought": bool(row["canBeBought"]),
        "can_be_gambled": bool(row["canBeGambled"]),
        # Challenge that unlocks the joker (e.g. challengeLvl40ItemBow), if any.
        "unlocked_by": row["associatedChallenge"],
        "can_drop_in_mission": bool(row["canBeRandomlyLooted"]),
        "droppable": bool(row["canBeDroppedInGame"]),
    })

# Jokers sharing a display name (the Explosive Hits variants) are told apart by the element in their effect.
duplicates = {name for name in (j["name"] for j in jokers) if sum(j["name"] == name for j in jokers) > 1}
for joker in jokers:
    if joker["name"] in duplicates:
        element = re.search(r"\((\w+)\)\s*$", joker["effect"])
        if not element:
            raise SystemExit(f"cannot disambiguate joker {joker['id']} ({joker['name']})")
        joker["name"] += f" ({element.group(1)})"

slot_curve = decode_curve("C_UnlockedJokers")
max_slots = int(slot_curve[-1][1])
progression = {
    # Level required to unlock each joker slot: index 0 is the 1st slot (curve C_UnlockedJokers, rounded down).
    "joker_slot_levels": [int(evaluate_curve(slot_curve, n)) for n in range(1, max_slots + 1)],
}

out = {
    "jokers.json": sorted(jokers, key=lambda j: (RARITIES.index(j["rarity"]), j["name"])),
    "upgrades.json": sorted(upgrades, key=lambda u: (u["stat"], u["id"])),
    "progression.json": progression,
}
os.makedirs(out_dir, exist_ok=True)
for name, data in out.items():
    with open(os.path.join(out_dir, name), "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
print(f"jokers.json {len(jokers)}, upgrades.json {len(upgrades)}, "
      f"joker slot levels {progression['joker_slot_levels']}")
