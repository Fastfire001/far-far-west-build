# far-far-west-build

Planificateur de builds pour [Far Far West](https://store.steampowered.com/app/3124540/Far_Far_West).

## Données

Les données du jeu (`data/*.json`) sont extraites des fichiers du jeu installé. Les mécaniques utiles au
planificateur sont décrites dans [docs/game-mechanics.md](docs/game-mechanics.md).

Pour les mettre à jour (seul Docker est requis) :

```sh
cp .env.example .env   # une seule fois, puis renseigner FFW_GAME_DIR (dossier d'installation du jeu)
bin/extract-game
```

Le jeu n'est lu qu'en lecture seule ; les fichiers extraits restent dans `.cache/`, non versionné.

## Application

L'application (Vue 3 + TypeScript + Vite) est dans `web/`. Seul Docker est requis :

```sh
bin/dev          # serveur de dev : http://localhost:5173/
bin/test         # tests unitaires
bin/build-site   # site statique dans web/dist/
```
