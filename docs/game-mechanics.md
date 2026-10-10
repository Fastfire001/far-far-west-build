# Far Far West — game mechanics used by the build planner

Rules checked on 2026-10-07 for game version 0.2.0.20 (early access). Update 644 (2026-05-14) reworked progression
and made several wiki pages outdated.

## Data sources

All of `data/` is extracted from the **game files** (local install) by `bin/extract-game`: `equipment.json`,
`spells.json`, `jokers.json`, `upgrades.json`, `progression.json`, `meta.json` (game version and extraction date)
and the translations in `i18n/`. The extracted files stay in `.cache/` (not versioned); only the values the planner
needs go into `data/`. The one exception is `data/manual.json`, entered by hand (see "Hand-entered data").

Texts (names, descriptions) are kept **as displayed in the game**, in English in the main files: joker names are
upper case (`CRACKSHOT`), as on the game's cards.

Every item is identified by its **internal game `id`** (`itemPistol`, `itemSpellFireBall`, `jokerCrackShot`…), and
references between files use these ids (for instance a joker's `available_on`).

The prestige rules are not in the readable game files: they come from the patch notes and the wikily.gg build
planner (see "Prestige"). The [wiki](https://farfarwest.wiki.gg/) is no longer a data source (except for
`manual.json`); it is still useful background, but it is wrong on several points (see "Known wiki errors").

## What makes a build

| Part | Choice | Data |
|---|---|---|
| Main weapon | 1 of 7 (Quad Cylinder, Shotgun, Long Ranger, Minigun, Leveredge, Knuckles, Lasso) | `equipment.json`, `type: main` |
| Sidearm | 1 of 6 (Revolver, Bow, Dual Revolvers, Boomerang, Sheriff Star, Banjo) + **an element** applied on hit: Acid, Pyro, Elec or Frost, all 4 available on every sidearm (according to the wiki) | `equipment.json`, `type: sidearm` |
| Utility | 1 of 4 (Ammo Pack, Bottle Crate, Healing Area, Impulse Grenade) | `equipment.json`, `type: utility` |
| Spells | up to 3, out of 30 spells in 6 schools: Pyro, Elec, Acid, Voodoo, Cactus, Frost | `spells.json` |
| Stat upgrades | Hero, main weapon, sidearm: points spread over stats | `upgrades.json` |
| Jokers | Hero, main weapon, sidearm: each has its own slot budget | `jokers.json` |

The "carriers" (hero, main weapon, sidearm) each have their own level (1 to 100), prestiges, upgrade points and
joker budget. The utility has neither upgrades nor jokers.

## Jokers (`jokers.json`)

- `id`: internal game id (`jokerCrackShot`), stable even if the displayed name changes. `name`: displayed name (upper
  case, as in the game). `description`: the joker's effect.
- `slot_cost`: cost in slots. Normal 1, Fine 2, Prime 3, Mythic 4, Legendary 5; Unique jokers cost 2 to 7 depending
  on the card (Ultra Draw 7, Mindshot 6, Eco Trick and Swamp Trick 2…).
- `max_equip`: maximum number of copies of the same joker on a carrier.
- `available_on`: `["itemHero"]` for a hero joker, otherwise the ids of the compatible weapons.
- **How to get them**:
  - `can_be_bought` / `can_be_gambled`: can be bought in the lobby, or won at the slot machine (gamba);
  - `unlocked_by`: challenge that unlocks the joker (e.g. `challengeLvl40ItemBow` = Bow level 40);
  - `can_drop_in_mission`: can drop during a mission.

  A joker that can be neither bought nor gambled cannot be equipped in the lobby: Camper, Dwarf, Extra Dash and
  Giant. Jokers found during a mission do not count against the slot limits and disappear at the end.
- Budget per carrier: **14** slots from levels, **16** with the 2 slots bought at the prestige shop. The hero has the
  same budget as the weapons.
- **Slot unlocks** (`progression.json`, `joker_slot_levels`): slot n unlocks at the level shown.

| Slot | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Level | 1 | 4 | 8 | 12 | 16 | 21 | 26 | 32 | 40 | 48 | 58 | 70 | 84 | 100 |

- **Unique jokers**: specific to one weapon, unlocked by a weapon level challenge (main weapons: levels 35 and 55;
  sidearms: levels 30 and 40), then bought.
- **Mastery jokers** (one per spell school): unlocked at school level 50; −10% cooldown per equipped spell of that
  school. The sidearm's element does not count.
- The joker table has **no level field**. But the game contains the text "Your HERO needs to be at least level
  {minimumLevel} to buy Jokers of this category" (`ST_UI_Tweaks_MinimumLevelBuyJokers`): there may be a minimum hero
  level to buy some rarities. The values are not in the readable files (probably in a Blueprint,
  `BP_Manager_Jokers`); the planner ignores this.

## Stat upgrades (`upgrades.json`)

- **1 point every 2 levels** since update 644, up to **20 points at level 40**.
- **+6 points** can be bought at the prestige shop → **26 points** per carrier, hero included.
- Each upgrade has a name (`name`), a value per point (`value`), a maximum number of points (`max_slots`), a gold
  price per point (`gold_cost`, out of scope for now) and the ids of the carriers that have it (`available_on`).
- `flat`: `true` if the value is a fixed amount (Health: +5 HP per point; Chord Capacity: +1 chord per point),
  `false` if it is a fraction (`0.05` = +5%).
- The same stat can come in several variants depending on the weapon: for instance Attack Speed is +5% ×16 on
  firearms, +5% ×8 on the Minigun and melee weapons, +10% ×8 on the Bow.

## Prestige

- Available at level 100, up to **15 prestiges** per carrier (the hero and each weapon have their own counter).
- Resets the level to 1. Purchases from the prestige shop are permanent.
- Each prestige gives **5 tokens**. Shop:

| Purchase | Cost | Max purchases | Total effect |
|---|---|---|---|
| Joker slot | 5 tokens | 2 | budget 14 → 16 |
| Upgrade point | 2 tokens | 6 | 20 → 26 points |
| XP ticket, 500 gold, 1000 souls | 1 token | unlimited | resources |

- Tokens carry over from one prestige to the next (the game shows "{amount} Token(s)"): prestiges needed =
  ⌈(5 × joker slots bought + 2 × upgrade points bought) / 5⌉. For instance, 5 points (10 tokens) need 2 prestiges,
  not 3 as "slots + ⌈points / 2⌉" would give. A maxed-out build needs ⌈(10 + 12) / 5⌉ = **5 prestiges** on the
  carrier.
- These rules come from the patch notes and the wikily.gg build planner, not from the game files: the shop logic is
  in a Blueprint (`UI_PrestigeShop`) we cannot read with our extraction method.

## Spells

- `spells.json`: the 6 schools (`schools`, ids `itemFire`, `itemIce`…) and the 30 spells (`spells`), with their
  school, name and description.
- Spell schools have **their own level**: they are items of their own in the game, and Mastery jokers unlock at
  level 50 of a school.
- **No unlock level and no cooldown in the readable files**: these values are in the spells' Blueprints, which
  cannot be read without a mappings file. Cooldowns are entered by hand in `data/manual.json` (see "Hand-entered
  data"). For the record, the wiki gives spells unlocked at levels 1, 4, 12, 20 and 35 in each school.
- 3 spell slots (keys Q, E, C); the 3rd one unlocks at level 3.
- Combos between spells (about thirty on the wiki: Fire Tornado, Geyser Split…) are not included: they depend on
  in-game placement and their triggers are poorly documented.

## Hand-entered data (`manual.json`)

Values that are not in the readable game files, copied by hand from wiki.gg and wikily.gg. `bin/extract-game`
never touches this file: check it by hand after each game update (`checked_for_version`).

- `spell_cooldowns`: base cooldown of each spell in seconds, by spell id (`null` if unknown). Shown next to each
  spell, with the game's own label ("{sec}-second cooldown", `ST_UI_Spell_SecondsCooldown`).
- Disagreements found on 2026-10-10 between the two sites (wiki.gg / wikily.gg): Fireball 20 / 15 s,
  Firebeam 80 / 60 s, Surcharge 60 / 50 s, Finger Guns 120 / 80 s, Mino 10 / 7 s. Values to check in game.

## Translations (`i18n/`)

- The game is translated into **15 languages**: de-DE, en-US, es-419, es-ES, fr-FR, it-IT, ja-JP, ko-KR, pl-PL,
  pt-BR, ru-RU, tr-TR, uk-UA, zh-CN, zh-TW. Full coverage: every name and description in `data/` is translated.
- One file per language, `i18n/<language>.json`: `{id: {name, description}}` for equipment, schools, spells, jokers
  and upgrades (upgrades only have a name). `en-US.json` repeats the texts of the main files. A missing translation
  is simply absent: the planner then falls back to English.
- Texts are kept as in the game, quirks included: 23 Japanese names contain a line break (`\n`) to fit on the cards,
  and two German jokers have the same name (`SEELENERNTER`).
- The four Explosive Hits variants have the same name in the game: we append the translated name of their school
  (`COUPS EXPLOSIFS (Acide)`), from the `JOKER_VARIANTS` table in `build_game_data.py`.
- `i18n/ui/<language>.json`: the game's menu labels that the planner reuses (BACK, Customize, Upgrade slots, rarity
  names…), as `{key: text}`. The selection and the keys are in the `UI_TEXTS` table of `build_game_data.py`.
  Variables are kept as in the game (`Lvl. {lvl}`).
- `i18n/languages.json`: the name of each language, written in that language ("Deutsch", "日本語"), the same in every
  translation.

## Extraction from the game

`bin/extract-game` reads the local game install, read-only (path in `FFW_GAME_DIR`, see `.env.example`), in two
steps:

1. `tools/game-extract` (C#, [CUE4Parse](https://github.com/FabianFG/CUE4Parse) library) reads the game's IoStore
   archives (Unreal Engine 5.6, Oodle compression, no encryption) and writes the raw assets to `.cache/game/`.
2. `scripts/build_game_data.py` decodes them and writes `data/`.

Assets read:

| Asset | Content |
|---|---|
| `/Game/Progress/DT_PlayerJokers` | table of all jokers **and** upgrades (`jokerUpgrade*` rows), row struct `S_PlayerJokers` |
| `/Game/Progress/DT_PlayerItems` | list of all items: weapons, utilities, spells, schools (struct `S_PlayerItems`, a single field) |
| `/Game/LocaStringTables/ST_Tweaks` | displayed names and descriptions of jokers and upgrades |
| `/Game/LocaStringTables/ST_Weapons`, `ST_Spells` | displayed names and descriptions of weapons, utilities, spells and schools |
| `/Game/LocaStringTables/ST_UI` | game menu labels and language names |
| `/Game/Interfaces/Equipment/C_UnlockedJokers` | curve slot number → required level (rounded down) |
| `Localization/Game/<language>/Game.locres` | translations: by string table namespace (`ST_Tweaks`, `ST_Skin` for `ST_Weapons`, `ST_Elements` for `ST_Spells`), same keys as the English texts |
| `FarFarWest.exe` (outside the archives) | game version (the executable's `FileVersion`, "0.2.0.20 - CL 915") |

The game serializes its properties in "unversioned" mode (no names or types) and ships no mappings file. CUE4Parse
therefore cannot decode the joker table: `build_game_data.py` decodes it itself, with the order and type of the
`S_PlayerJokers` fields hard-coded (`JOKER_ROW`). If a game update changes this struct, the script stops with an
error. To find the new order: the fields are serialized in `S_PlayerJokers.uasset` as pairs of FNames (type, name),
which can be read back with the package's name map (the extractor's `names:` mode).

The mapping between items and their texts is written by hand in `build_game_data.py` (`EQUIPMENT`, `SPELLS`,
`SCHOOLS`), because internal names often differ from displayed ones: `itemWinchester` = Leveredge,
`itemSpellCactusUlti` = Bandito, `itemSpellElecSuperJump` = Boing… `itemSpellIceLance` = Bridge is deduced by
elimination (the only Frost id and name left). An item added by an update makes the script fail until it is added
to `EQUIPMENT`, `SPELLS`, `SCHOOLS` or `IGNORED_ITEMS`. The string tables also contain items missing from
`DT_PlayerItems` (Dynamite, Elder Pickaxe): they are not part of the current game.

Checks that validate the method: the table's 176 rows read up to the exact end of the export; Crackshot matches the
wiki; the old curve `C_UnlockedJokers_BeforeRemapTo100Levels` gives back exactly the wiki's old schedule (4, 6, 8,
10, 13, 16, 19, 24, 29, 35, 42, 50); the 149 active joker names are identical to the wiki's.

## Known wiki errors

Corrected by the game files:

- **Unique joker costs** (wiki → game): Eco Trick and Swamp Trick 5 → 2; Fanning Ace, Mark Ace, Scavenger Star and
  Chonky Throw 5 → 3; Eagle Lever, Frenzy Spin, Jump Star, Lingering Throw, Rush Blast and Stacked Lever 5 → 4;
  Mindshot 5 → 6; Ultra Draw 5 → 7.
- **Max copies**: Bouncing Ball and Clutch, 1 → 2.
- **Lazy and Medicard**: no source on the wiki; they can be bought (800 and 300 gold).
- **Rampage**: not available on the Bow or the Minigun.
- **Health** (hero upgrade): +5 flat HP per point, not +5%.
- Sidearm **Lifesteal**: 1% ×5 (the Equipment page says 1.25% ×8).
- **Joker slot schedule**: the wiki's dates from before patch 644. Only 1 slot at level 1.

Others:

- Upgrade points: the Equipment page says "1 point per level, 20 at level 20", outdated since patch 644.
- Prestige page: gives neither the costs nor the caps of the shop.

## Sources

- Game files, version 0.2.0.20: all of `data/` except `manual.json`.
- [farfarwest.wiki.gg](https://farfarwest.wiki.gg/): elements available on sidearms, spell unlock levels (not
  used), spell cooldowns (`manual.json`, cross-checked with wikily.gg).
- [Early Access Update 1 patch notes (V644)](https://steamcommunity.com/app/3124540/discussions/0/837250028234942852/):
  upgrades every 2 levels, jokers unlocked between levels 1 and 100, 6 bonus upgrade points.
- [wikily.gg spell pages](https://wikily.gg/far-far-west/spells/): spell cooldowns (`manual.json`).
- [wikily.gg build planner](https://wikily.gg/far-far-west/build-planner/new): prestige shop (costs, caps, formula
  for the prestiges needed). License not stated: used to cross-check, its data is not copied into `data/`.
- [Steam discussion on prestige](https://steamcommunity.com/app/3124540/discussions/0/571540300205508222/):
  "at least 5 prestiges" to unlock everything.
- [Neonsect, Prestige explained](https://neonsect.com/far-far-west/far-far-west-prestige-explained/): prestige up
  to 15.
