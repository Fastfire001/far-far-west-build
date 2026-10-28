# far-far-west-build

Build planner for the game Far Far West (co-op western-fantasy FPS by Evil Raptor, early access).
The repo holds the game data (extracted from the game files, with their translations), an icon for each item, the
tools that generate both, and the web application (Vue 3 + TypeScript + Vite, static site).

## Layout

- `data/*.json`: game data, all extracted from the game files, and `data/i18n/<language>.json` their official
  translations (15 languages); `data/i18n/ui/<language>.json`: game menu labels reused by the planner. **Generated**
  files: do not edit them by hand, fix `scripts/build_game_data.py` and regenerate instead. `data/share-ids.json`
  (numbers used by share links) is only appended to by the extraction: never reorder it or delete it. Exception:
  `data/manual.json`, entered by hand (spell cooldowns, from the wikis) and never regenerated: check it by hand
  after each game update.
- `tools/game-extract/`: C# extractor (CUE4Parse) that reads the game archives and writes the raw assets to
  `.cache/game/`.
- `scripts/build_game_data.py`: decodes these assets and writes `data/` and `assets/game/icons/` (Python, standard
  library only).
- `assets/`: the images, from three sources, by order of priority (see "Images" in `docs/build-planner.md`):
  hand-made images at the root of `assets/`, `game/` (extracted from the game) and `ai/` (AI-made). An image with
  the same path in a higher source is used instead. Icons are `icons/<type>/<id>.png` (or `.svg`), one per item of `data/` sorted by
  type (`hero`, `weapons`, `utilities`, `jokers`, `upgrades`, `schools`, `spells`): `assets/game/icons/` has them
  all, **generated** by `bin/extract-game` (do not edit them by hand). `assets/ai/` only holds `og-image.png` (link
  previews) and `favicon.svg`.
- `web/`: the application (Vue 3, TypeScript, Vite, Pinia, vue-i18n, Vitest tests). It reads `data/` (alias `@data`)
  and `assets/` directly. `src/domain/`: typed data and build rules, in plain TypeScript without Vue, so they
  can be tested on their own. `src/stores/`: shared state (Pinia stores), which calls the functions of
  `src/domain/` without holding rules. `src/views/`: one screen per route of `src/router.ts` (vue-router in hash
  mode, see "Screens" in `docs/build-planner.md`); `src/components/`: shared pieces (menu bar, BACK button, wooden
  plank). `src/i18n/`: interface texts (`ui/<language>.json`, ours, English and French only), completed by the game's labels
  (`data/i18n/ui/`, key `game`); the game texts are loaded on demand from `data/i18n/` by the `language` store.
  `src/pages/`: the static content pages (jokers, weapons, spells, in English and French), rendered to HTML
  at build time by `vite-plugin-content-pages.ts` (see "Content pages" in `docs/build-planner.md`).
- `.github/workflows/deploy.yml`: deploys the site to GitHub Pages on every push to `main`.
- `bin/`: commands to run from the host. Each one runs its script in a Docker container from `compose.yaml` (`app`
  for Python, `extract` for the extractor, `web` for Node).
- `.cache/` (not versioned): raw assets extracted from the game and the Oodle library downloaded by the extractor.
- `docs/game-mechanics.md`: game rules used by the planner, extraction method, wiki errors.
- `docs/build-planner.md`: design decisions of the planner and open questions.
- `CONTRIBUTING.md`: rules for contributors. `LICENSE`: MIT, for the code, docs and icons only: the game texts in
  `data/` belong to Evil Raptor (see "License" in the README).

## Commands

- `bin/extract-game`: regenerates all of `data/` and the icons of `assets/game/icons/` from the installed game.
  Needs Docker (under WSL, Docker Desktop must be running) and `FFW_GAME_DIR` (in `.env`, see `.env.example`). Run
  it again after each game update.
- `bin/dev`: Vite dev server (http://localhost:5173/). `bin/test`: unit tests (`bin/test --watch`).
  `bin/build-site`: type check and build of the site into `web/dist/`.
- `bin/web <command>`: runs a command in the Node container, for instance `bin/web npm install <package>`. Installs
  the npm dependencies (`web/node_modules/`) if needed; the other `web` commands go through it.

## Conventions

- Every new script is run through an entry in `bin/` that runs it in a container, like `bin/extract-game`.
- Containers run as the host user: generated files must not belong to root.
- Everything in English: documentation, README, code and comments. Only our French interface and page texts
  (`web/src/i18n/ui/`, `web/src/pages/i18n/`) and the game's translations are in other languages.
- **No text written or translated by AI in `web/src/i18n/ui/` and `web/src/pages/i18n/`** (request of the game's
  team, 2026-10-22), in any language, English included. These files exist only in English and French, written by
  hand by the maintainer; a text not written yet is `"todo"`. When Claude adds a key, it sets `"todo"` in
  `en-US.json`, adds nothing to `fr-FR.json`, and tells the user which keys to write. It never replaces a `"todo"`,
  never edits an existing text, and never adds another language. English stays the fallback, even while it says
  `"todo"`. Only the game's official translations (`data/i18n/`) are in the other languages.
- Files extracted from the game stay in `.cache/`: never version or publish them. Only the values the planner needs
  go into `data/`, and the icons it shows into `assets/game/icons/`.
- Items are referenced by their internal game id (`itemPistol`, `jokerCrackShot`), never by their displayed name.
- The game's icons are used with the permission of its team (2026-10-25), only through `bin/extract-game`: no
  other art from the game, and none from the wiki, in the repo.
- Every AI-made image goes in `assets/ai/`, never elsewhere; Claude never adds or edits an image outside it.
  The root of `assets/` (outside `game/` and `ai/`) is for hand-made images only.

## Game files

- The only data source. The game uses Unreal Engine 5.6, unencrypted IoStore archives, Oodle compression.
- No mappings file, and we decided not to generate one with a dumper (injection into the game): DataTables with a
  Blueprint struct are decoded by hand in `build_game_data.py` (see "Extraction from the game" in
  `docs/game-mechanics.md`). Values stored in Blueprints (weapon stats, spell cooldowns and unlock levels) are out
  of reach.
- If extraction fails after a game update: either a struct (`S_PlayerJokers`) changed, or an item was added to
  `DT_PlayerItems` and must be added to `EQUIPMENT`, `SPELLS`, `SCHOOLS` or `IGNORED_ITEMS`.
- `Manifest_UFSFiles_Win64.txt`, at the root of the install, lists every game asset: handy to find where a value
  comes from.

## Other sources

- The wiki (https://farfarwest.wiki.gg/) is no longer a data source (except for `data/manual.json`), but is still
  useful background. It blocks clients that are too fast (a "Blocked" HTML page instead of JSON): space out requests.
- Progression rules missing from the readable files (prestige shop…): official patch notes (Steam discussions of app
  3124540) and the wikily.gg build planner.

## Game mechanics

@docs/game-mechanics.md

## Planner decisions

@docs/build-planner.md
