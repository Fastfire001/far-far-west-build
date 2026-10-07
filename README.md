# far-far-west-build

Planificateur de builds pour [Far Far West](https://store.steampowered.com/app/3124540/Far_Far_West).

## Données

Les données du jeu (`data/*.json`) ont deux sources :

- **les fichiers du jeu** pour les jokers, les upgrades et la progression ;
- **le [wiki Far Far West](https://farfarwest.wiki.gg/)** pour l'équipement et les sorts.

Les mécaniques utiles au planificateur sont décrites dans [docs/game-mechanics.md](docs/game-mechanics.md).

Pour les mettre à jour (seul Docker est requis) :

```sh
bin/update-data    # depuis le wiki
bin/extract-game   # depuis le jeu installé
```

`bin/extract-game` a besoin du dossier d'installation du jeu : copier `.env.example` en `.env` et y renseigner
`FFW_GAME_DIR`. Le jeu n'est lu qu'en lecture seule ; les fichiers extraits restent dans `.cache/`, non versionné.
