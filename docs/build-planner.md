# Build planner — design decisions

## Stack

**Vue 3 + TypeScript + Vite**, Pinia, vue-i18n, tests with Vitest. The application lives in `web/`.

- Shared state (language and game texts, build being edited, saved builds) is in Pinia stores (`web/src/stores/`).
  Business logic (validation, level and prestiges, export) is not: it is written as pure TypeScript functions in
  `web/src/domain/`, without Vue or Pinia, so that it can be tested on its own.
- TypeScript stays on 6.x: vue-tsc does not work with TypeScript 7 yet.
- Data and images are read directly from `data/` and `assets/`: no copy to keep in sync. Each
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
  character, a summary of the build at a glance: the spells (with their key) and the utility, then per carrier its
  minimum level and prestiges, its jokers as small cards (×copies) and its upgrades as their icon with the points;
  then the validation problems (each links to the screen that fixes it). A click on the summary opens the summary
  sheet.
- **Summary** (`/#/summary`): a read-only sheet with everything needed to make the build in the game, laid out to
  fit in one screenshot: the name, the spells (key and cooldown), the utility, then one column per carrier (hero, main
  weapon, sidearm and its element) with its minimum level and prestiges, its joker slots as on the Customize screen
  with the list of jokers beside them, and its upgrades (points and total bonus). The footer gives the game version,
  what the numbers in free slots mean and the planner's address. Nothing on it is clickable (only BACK); hovering a
  joker still shows its card.
- **Item picker**: weapons or utilities as planks, the selected one in detail with EQUIP and CUSTOMIZE.
- **Customize** (hero, main weapon, sidearm): upgrades with the game's bars, the sidearm's element, the joker slots
  (one circle per slot, a locked slot shows the level that unlocks it, the last 2 are the prestige slots) and the
  progression needed. The game's "Confirm for X gold" is left out: gold is out of scope.
- **Jokers**: rarity tabs named as in the game, plus a search on the name and description in the current language;
  cards in the game's format. Clicking a card adds a copy if it fits; a card that does not fit has a red frame.
- **Joker slots** (Customize and Jokers): hovering an equipped joker with the mouse, or focusing it with the keyboard,
  shows its card beside the slots. Not on touch screens, where a tap removes the joker.
- **Spells**: the 6 schools, the spells of the chosen school with their cooldown, and the 3 slots. Keys under the
  slots follow the game: [A] [E] [C] in French (AZERTY), [Q] [E] [C] in the other languages.
- **Settings** (Builds menu): a dialog of options, saved in localStorage (`web/src/stores/settings.ts`). Today a
  single one, "Summary always in English": the summary sheet is shown in English whatever the language picked
  (the whole page, menu bar included, while the summary is open; the language menu still shows the one picked).
- **My builds**: the saved builds (open, duplicate, delete), then the received ones in their own section, which a
  button empties.
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
- The rest of the interface (summary, validation messages…) does not exist in the game: it is written by us in
  `web/src/i18n/ui/<language>.json`, **in English and French only**, with the game's own words for its concepts
  (joker, slot, prestige…). In the other languages it shows in English, next to the game's texts in the chosen
  language. English is bundled, French is loaded on demand. A missing key falls back to English.
- **No text written or translated by AI**: at the request of the game's team (2026-10-22), the AI translations of
  our texts into the other 13 languages were removed, and the English texts, written by AI, were replaced by
  `"todo"` to be rewritten by hand. The French texts were kept. English stays the fallback, even while it says
  `"todo"`.

## Content pages

Static HTML pages, without JavaScript, for search engines and players looking for game data: what the hash routes of
the planner cannot offer. Code in `web/src/pages/`, rendered at build time by the Vite plugin
`web/vite-plugin-content-pages.ts` (and on request by `bin/dev`).

- **Pages**: `jokers/` (all jokers by rarity) and `jokers/<joker>/`; `weapons/` (hero, weapons, utilities),
  `weapons/<weapon>/` (upgrades, Unique jokers with their level, all compatible jokers, elements of a sidearm),
  `hero/`, `utilities/<utility>/`; `spells/` and `spells/<school>/` (spells, cooldowns, Mastery joker).
- **URLs from the English name** (`jokers/crackshot/`, `weapons/leveredge/`), not the internal id: they contain the
  words players search for. If the game renames an item, its URL changes. The tests check that every slug is unique
  and that every internal link leads to a page.
- **English and French**, the languages of our page texts (`src/pages/i18n/<language>.json`): English at the root,
  French under `fr/` (`LOCALE_PREFIXES` in `src/pages/routes.ts`), linked together with `hreflang`. Names and
  descriptions come from the game's translations. The planner links to the English pages in the other languages.
- Rendered with the planner's own data and rules (`src/domain/`), the game's menu labels (rarity names), the
  icons (copied to `icons/<id>.png`, see "Images") and the planner's stylesheet (`src/styles/main.css`, followed by
  `src/pages/pages.css`, published as `pages/style.css`).
- Each page links to the planner. Weapon and utility pages open it on a build with that item, through a share link.
  The planner links back to the pages in its footer, in the current language.
- About 180 pages per language, so about 360 files in the built site.

## Images

- **Three sources, by order of priority**: the root of `assets/` (hand-made), `assets/game/` (extracted from the game)
  and `assets/ai/` (AI-made). An image with the same path in a higher source is used instead
  (`assets/icons/weapons/itemPistol.svg` replaces `assets/game/icons/weapons/itemPistol.png`,
  `assets/og-image.png` replaces `assets/ai/og-image.png`), by the planner (`src/icons.ts`) and the content
  pages (`vite-plugin-content-pages.ts`), which publish the image at the same URL whatever its source (`icons/<id>.png`
  or `.svg`, `og-image.png`, `favicon.svg`).
- The game's icons are used with the permission of its team (2026-10-25). They replaced the AI-made icons, which were
  deleted with their generator. Only two AI-made images are left in `assets/ai/`: `og-image.png` (link previews)
  and `favicon.svg` (the game has no icon that works as a favicon: the hero's is a wide white drawing).
- The favicon is written as a path in `web/index.html` (`assets/ai/favicon.svg`): update it if it is replaced.

### Icons

- One icon per item, named after its id, in a folder per type of item: `assets/game/icons/<type>/<id>.png`, with
  `hero` (`itemHero`), `weapons` (main weapons and sidearms), `utilities`, `jokers`, `upgrades`, `schools` and
  `spells`. Since the id is stable and unique (checked by the tests), the interface finds the icon by its id alone,
  whatever its folder and extension, without a lookup table, and the site publishes it as `icons/<id>.png`.
- **The game's own icons**, extracted by `bin/extract-game` (see "Extraction from the game" in
  `docs/game-mechanics.md`): do not edit them by hand. A new joker, upgrade or item gets its icon on the next
  extraction; an item without an icon makes the extraction fail.
- They are white pictograms on a transparent background (128×128; the hero's is 400×120), as in the game: the
  interface draws the colour around them (the card or the slot circle in the joker's rarity colour, the band of the
  upgrade's stat colour). Images are never stretched (`object-fit: contain`).

## Saving and sharing

- Builds are saved in the browser's **localStorage**: a list of named builds (open, duplicate, delete), the "My
  builds" screen and the Builds menu.
- **Autosave**: the build being edited is saved on every change, with no button. A build left blank (no name and no
  choice) is dropped when another one is opened. Without localStorage (blocked storage), everything works without
  saving, and the menu says so.
- An **imported** build is added to the list as a new build: it does not overwrite the current one.
- **Received builds** (opened from a share link or imported) are listed apart in "My builds", so that opening many
  links does not bury our own builds, and can all be deleted at once. A received build becomes one of ours with its
  Keep button, or as soon as it is changed (a copy made with Duplicate is ours too). The flag is saved with the build (`"received": true`).
- **Share links** (Builds menu, "Share…"): `/#/share/<code>`, where the code is the build as bytes in URL-safe base64
  (`web/src/domain/shareCode.ts`): items, jokers and upgrades are written as their number in `data/share-ids.json`,
  in varints. About 90 characters for a full build without a name, against 900 for its JSON. Opening a link
  adds the build to the saved builds, or reopens the saved copy if an identical one exists, then replaces the URL
  with the build home, so a reload does not add it again.
- **Link formats**: the code starts with its format version (today 1), which picks the reader. A new format gets the
  next version, its own writer and reader, and the old readers stay, so that the links already shared still open. A
  test decodes a link of format 1 written once and for all. The first links (compressed JSON, same address) are
  no longer read: their code does not start with a known version, so they show an error.
- Ids missing from the table (only a hand-edited saved build can have one: ids removed from the game stay in it) are
  left out of the code.
- **The numbers of `data/share-ids.json` never change**: `bin/extract-game` only appends the new ids (sorted) at
  the end of each list and keeps the ids removed from the game, so an old link keeps its meaning after a game update.
  It is the only file of `data/` built from its previous version: the extraction stops if it is missing (restore it
  from git), and it must never be reordered or edited by hand. A test checks that every id of `data/` is in it.
- **Export / Import** (text to copy, in the same dialog as the link): the text is the share code. Import accepts the
  code or the whole link. The first export texts (`FFW1:…`, JSON in base64) are no longer read.
- Saved builds (localStorage) are JSON with a **format version number** (`"v": 1`), so that old builds can be
  converted. Every item (equipment, spells, jokers, upgrades) is identified there by its **internal game `id`**
  (`itemPistol`, `jokerCrackShot`…), which does not change if the game renames the item.
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
  JSON-LD data, plus a short static text in `#app` (replaced when the app mounts) with links to the content pages,
  for crawlers that do not run JavaScript. The game version (`{gameVersion}`) and the links to every weapon and
  school (`<!-- content-pages:links -->`) are filled in by the content pages plugin (`homeContent` in
  `src/pages/site.ts`).
- **Titles and descriptions** follow what players search for: the game's name first, then the item and the words
  of the search ("Far Far West Minigun: jokers, upgrades and build", "Precious Rush joker – Far Far West…"). Joker
  names are in normal case there (title case in English and German, only the first letter elsewhere), upper case
  only in the page heading. Every description ends with the game version, as players avoid outdated data in early
  access. The planner's screens are hash routes, ignored by search engines: what
  can rank are the content pages (see "Content pages"). `sitemap.xml` is generated at build time with the planner
  and every content page. A `robots.txt` would have to be at the domain root (`fastfire001.github.io`), so the
  sitemap is submitted in Google Search Console instead.
