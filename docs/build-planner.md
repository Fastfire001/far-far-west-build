# Build planner — design decisions

## Stack

**Vue 3 + TypeScript + Vite**, Pinia, vue-i18n, tests with Vitest. The application lives in `web/`.

- Shared state (language and game texts, build being edited, saved builds) is in Pinia stores (`web/src/stores/`).
  Business logic (validation, level and prestiges, export) is not: it is written as pure TypeScript functions in
  `web/src/domain/`, without Vue or Pinia, so that it can be tested on its own.
- TypeScript stays on 6.x: vue-tsc does not work with TypeScript 7 yet.
- Data and icons are read directly from `data/` and `assets/icons/`: no copy to keep in sync. Each
  `data/i18n/<language>.json` file becomes a separate JS chunk, loaded only when that language is picked.
- Icons stay separate files in the build (`assetsInlineLimit: 0`) instead of being inlined in the JS.

## Scope (v1)

A build contains:

- **Hero**: upgrades (points per stat) + jokers.
- **3 spells**, no duplicates.
- **Main weapon**: the weapon + upgrades + jokers.
- **Sidearm**: the weapon + **its element** (Acid, Pyro, Elec, Frost) + upgrades + jokers.
- **Utility**.

The planner:

- **validates** the build: upgrade points (26 per carrier and a cap per stat), joker budget (16 per carrier), copies
  (`max_equip`), joker compatibility with their carrier, no duplicate spell;
- **shows the minimum level and the number of prestiges needed** for each carrier (hero, main weapon, sidearm), from
  the upgrade points and joker slots used, and the Unique jokers chosen (level of the challenge that unlocks them).
  As long as a rule used by this computation is not confirmed (see "Open questions"), the result is shown with a
  warning;
- **shows the base cooldown of each spell** (hand-entered, see `docs/game-mechanics.md`).

Out of scope:

- **no computed stats** (neither weapon DPS nor final spell cooldowns);
- **no spell combos**: they depend on in-game placement and their triggers are poorly documented. The sidearm's
  element is still part of the build, but triggers nothing in the planner.

## Screens

The interface mimics the game's menus (wooden planks, upgrade bars, joker cards, spell schools), without the
character or the 3D models: where the game shows them, the planner shows information useful to the build. Every
screen has the menu bar (game version and extraction date, language, builds menu) and a BACK button, as in the game.
Routes are in `web/src/router.ts`, one view per screen in `web/src/views/`:

- **Build home**: one plank per part of the build (hero, main weapon, sidearm, spells, utility); in place of the
  character, a summary with the minimum level and prestiges per carrier, then the validation problems (each links to
  the screen that fixes it).
- **Item picker**: weapons or utilities as planks, the selected one in detail with EQUIP and CUSTOMIZE.
- **Customize** (hero, main weapon, sidearm): upgrades with the game's bars, the sidearm's element, the joker slots
  (one circle per slot, a locked slot shows the level that unlocks it, the last 2 are the prestige slots) and the
  progression needed. The game's "Confirm for X gold" is left out: gold is out of scope.
- **Jokers**: rarity tabs named as in the game, plus a search on the name and description in the current language;
  cards in the game's format. Clicking a card adds a copy if it fits; a card that does not fit has a red frame.
- **Spells**: the 6 schools, the spells of the chosen school with their cooldown, and the 3 slots. Keys under the
  slots follow the game: [A] [E] [C] in French (AZERTY), [Q] [E] [C] in the other languages.
- **My builds**: the saved builds (open, duplicate, delete).
- **Share link** (`/#/share/<code>`): opens the build carried by the link, then goes to its home (see "Saving and
  sharing").

## Rules

- **We plan at max level**: 26 upgrade points and 16 joker slots per carrier, all spells and all Unique jokers
  available. Spells are not part of the minimum level: their unlock levels are not extracted from the game (see
  `docs/game-mechanics.md`).
- **Jokers that cannot be equipped in the lobby are left out**: only those with `can_be_bought` or `can_be_gambled`
  are kept (today only Camper, Dwarf, Extra Dash and Giant are left out). The filter is in the planner, not in
  `data/`, so that a joker that becomes buyable shows up after a `bin/extract-game`.
- **All data comes from the game files** (`bin/extract-game`), except the prestige rules and the hand-entered
  `data/manual.json`. See `docs/game-mechanics.md`.
- Progression rules that are not in `data/progression.json` (points per level, prestige shop) are grouped in
  `web/src/domain/rules.ts`, each marked confirmed or assumed, with its source.
- **Minimum level and prestiges**: only what levels cannot give is bought at the prestige shop (beyond 14 joker slots
  or 20 upgrade points); the level shown is the one needed for the rest. The result is marked "assumed" until open
  question 1 is settled.
- **Level of Unique jokers**: the level comes from the challenge id (`challengeLvl35…` or `challengeLevel35…`, both
  spellings exist), the weapon from `available_on` (a single carrier per Unique). Do not derive the weapon from the
  challenge id: the Revolver is written `ItemRevolver` there, while its id is `itemPistol`.
- **All jokers are considered unlocked**, except Unique ones (weapon level, above):
  - other challenges (cooldown jokers at school level 50, kills, secret areas…) are neither shown nor counted in the
    minimum level;
  - the hero level that may be needed to buy a joker rarity is ignored (see `docs/game-mechanics.md`).
- **Changing weapons empties that carrier's jokers and upgrades.**
- **A new build is empty**: no weapon, utility or spell chosen.

## Languages

- The planner is available in the **15 languages of the game**, with the game's official texts (`data/i18n/`).
  When a text is not translated, it shows the English one.
- On the first visit, the language is the browser's (English if the game does not have it). The language picked in
  the menu is remembered in localStorage for the next visits.
- Texts are shown as in the game (joker names in upper case); line breaks in Japanese names are shown as spaces.
- The interface reuses the game's menu labels when they exist (`data/i18n/ui/`, 15 languages: BACK, Customize,
  rarities…), and the game's language names for the picker (`data/i18n/languages.json`).
- The rest of the interface (summary, validation messages…) does not exist in the game: it is translated by us in
  `web/src/i18n/ui/` (English and French for now). A missing key falls back to English.

## Icons

- One SVG icon per item, named after its id: `assets/icons/<id>.svg` (jokers, upgrades, equipment, schools, spells,
  and `itemHero` for the hero). Since the id is stable, the interface finds the icon without a lookup table.
- They are **original drawings**, not the game's or the wiki's art (which belongs to Evil Raptor). They follow the
  game's visual codes: jokers as cards in their rarity color with one dot per slot, spells and schools as badges in
  the school color, equipment as silhouettes, upgrades as hexagons.
- Generated by `scripts/build_icons.py` from a library of pictograms and an id → pictogram table: do not edit the SVGs
  by hand. An item without an icon makes the generation fail.
- If the number of files becomes a problem online, a single SVG sprite (one `<symbol>` per id) can be generated at
  build time, without changing the naming.

## Saving and sharing

- Builds are saved in the browser's **localStorage**: a list of named builds (open, duplicate, delete), the "My
  builds" screen and the Builds menu.
- **Autosave**: the build being edited is saved on every change, with no button. A build left blank (no name and no
  choice) is dropped when another one is opened. Without localStorage (blocked storage), everything works without
  saving, and the menu says so.
- An **imported** build is added to the list as a new build: it does not overwrite the current one.
- **Share links** (Builds menu, "Share…"): `/#/share/<code>`, where the code is the same JSON as the export,
  compressed (`deflate-raw`, `CompressionStream`) and in URL-safe base64: about 400 characters for a full build,
  against 1,700 for the export text. Opening a link adds the build to the saved builds, or reopens the saved copy if
  an identical one exists, then replaces the URL with the build home, so a reload does not add it again.
- **Export / Import** (text to copy, in the same dialog as the link): the build is JSON encoded in base64, with a
  prefix (`FFW1:…`).
- The JSON has a **format version number** (`"v": 1`), so that old builds can be converted.
- Every item (equipment, spells, jokers, upgrades) is identified by its **internal game `id`** (`itemPistol`,
  `jokerCrackShot`…), which does not change if the game renames the item.
- Base64 is encoded from UTF-8 (`TextEncoder`), not with `btoa()` directly, which fails on non-ASCII characters.
- On import, the build is validated with the same rules as in the editor. An invalid build, or one with an unknown id
  (joker removed by a patch), is still imported, with warnings.

## Hosting

- **GitHub Pages**: a static site, **no server to run**. No backend, no accounts, no database: the application runs
  entirely in the browser, and `data/` is bundled into the site at build time.
- `bin/build-site` produces a static site (`web/dist/`) served under `/far-far-west-build/` (`base` in
  `vite.config.ts`). Routes use vue-router's hash mode (`/#/…`): Pages cannot serve `index.html` for an unknown URL.
- **Deployment**: `.github/workflows/deploy.yml` builds `web/` on every push to `main` (tests included: a failing
  test blocks the release) and publishes `web/dist/` with `actions/deploy-pages`. In the repository settings, the
  Pages source must be "GitHub Actions". Address: https://fastfire001.github.io/far-far-west-build/
- **Search engines**: `web/index.html` holds the title, description, canonical URL, link previews (Open Graph) and
  JSON-LD data, plus a short static text in `#app` (replaced when the app mounts) for crawlers that do not run
  JavaScript. `web/public/sitemap.xml` lists only the root URL: hash routes are ignored by search engines. A
  `robots.txt` would have to be at the domain root (`fastfire001.github.io`), so the sitemap is submitted in Google
  Search Console instead.

## Open questions (to check in game)

1. **Do prestige bonuses apply right away?** Can the bought slots and points be used from level 1, or do they only
   raise the cap that has to be reached by leveling up? The logic is in the `UI_PrestigeShop` Blueprint, which we
   cannot read with our extraction method.
