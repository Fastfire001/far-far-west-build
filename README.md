# far-far-west-build

Planificateur de builds pour [Far Far West](https://store.steampowered.com/app/3124540/Far_Far_West).

## Données

Les données du jeu (`data/*.json`) sont extraites du [wiki Far Far West](https://farfarwest.wiki.gg/).
Les mécaniques utiles au planificateur sont décrites dans [docs/game-mechanics.md](docs/game-mechanics.md).

Pour mettre les données à jour depuis le wiki (seul Docker est requis) :

```sh
bin/update-data
```

Le script télécharge les données brutes du wiki, puis régénère `data/`.
