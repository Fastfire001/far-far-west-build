# Contributing

Thanks for helping! Bug reports, game data corrections, translations and code are all welcome.

## Getting started

Only Docker is required: every command in `bin/` runs in a container, as your own user.

```sh
bin/dev          # dev server: http://localhost:5173/
bin/test         # unit tests (bin/test --watch)
bin/build-site   # type check and static site in web/dist/
bin/web <cmd>    # any command in the Node container, e.g. bin/web npm install <package>
```

You do not need the game: the data it provides is already in `data/`. Read [CLAUDE.md](CLAUDE.md) for the
repository layout, and [docs/](docs/) for the game rules and the design decisions.

## Ground rules

- **Everything in English**: code, comments, docs, commit messages.
- **Do not edit generated files by hand**: `data/` (except `data/manual.json`) comes from `scripts/build_game_data.py`
  and `assets/icons/` from `scripts/build_icons.py`. Fix the script, then regenerate.
- **Refer to items by their internal game id** (`itemPistol`, `jokerCrackShot`), never by their displayed name.
- **No game or wiki art** in the repo (icons, images, textures): icons are original drawings.
- **Never commit or publish the files extracted from the game** (`.cache/`): only the values the planner needs go
  into `data/`.
- Build rules go in `web/src/domain/` (plain TypeScript, with tests), not in the Vue components or stores.
- A new script gets an entry in `bin/` that runs it in a container.

## Game data

- **Wrong value?** If it comes from the game files, open an issue with what the game shows: the fix is in
  `scripts/build_game_data.py`. If it is in `data/manual.json` (hand-entered, e.g. spell cooldowns), you can fix it
  directly; say in the pull request where the value comes from (in-game screenshot, patch notes…).
- **New game version?** Someone with the game installed runs `bin/extract-game` (see the README) and commits the
  updated `data/` and `assets/icons/`. If extraction fails, see "Game files" in [CLAUDE.md](CLAUDE.md). Also check
  `data/manual.json` against the game and update its `checked_for_version`.

## Translations

Game texts come from the game in its 15 languages. The planner's own texts are ours, in English and French only: the
interface in `web/src/i18n/ui/<language>.json`, the content pages in `web/src/pages/i18n/<language>.json`. No machine
translation, at the request of the game's team: other languages show our texts in English. When you add or change an
English text, update the French one: a test checks that `fr-FR.json` has the keys, variables (`{name}`) and plural
forms (`a | b | c`) of `en-US.json`. Use the game's own
words for its concepts (joker, slot, prestige…): see `data/i18n/ui/<language>.json` and `data/i18n/<language>.json`.

## Pull requests

- Keep each pull request focused on one change, and update the docs when you change a rule.
- `bin/test` and `bin/build-site` must pass: the deployment runs them on every push to `main`.
