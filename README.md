# far-far-west-build

Build planner for [Far Far West](https://store.steampowered.com/app/3124540/Far_Far_West): plan the hero, weapons,
jokers, upgrades and spells of a build, check that it is valid, and see the level and prestiges it needs. Available
in the game's 15 languages.

Live site: https://fastfire001.github.io/far-far-west-build/

Fan project, not affiliated with Evil Raptor. Icons are original drawings; no game art is included.

## Development

Only Docker is required: every command runs in a container.

```sh
bin/dev          # dev server: http://localhost:5173/
bin/test         # unit tests (bin/test --watch)
bin/build-site   # type check and static site in web/dist/
bin/web <cmd>    # any command in the Node container, e.g. bin/web npm install <package>
```

The application (Vue 3 + TypeScript + Vite) is in `web/`. Every push to `main` deploys the site to GitHub Pages
(`.github/workflows/deploy.yml`).

## Game data

The game data (`data/*.json`) is extracted from the installed game files; the icons (`assets/icons/`) are generated
from it. Both are committed, so you only need the game to update them after a game update:

```sh
cp .env.example .env   # once, then set FFW_GAME_DIR (game install folder)
bin/extract-game
```

The game is only read; the extracted files stay in `.cache/`, which is not versioned. `data/manual.json` is the
exception: values that cannot be extracted (spell cooldowns), entered by hand.

## Documentation

- [docs/game-mechanics.md](docs/game-mechanics.md): game rules used by the planner, where each value comes from,
  extraction method.
- [docs/build-planner.md](docs/build-planner.md): design decisions and open questions.
- [CLAUDE.md](CLAUDE.md): repository layout and conventions.
