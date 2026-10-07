# far-far-west-build

Planificateur de builds pour le jeu Far Far West (FPS coop western-fantasy, Evil Raptor, accès anticipé).
La stack de l'application n'est pas encore choisie : pour l'instant, le repo ne contient que les données du jeu.

## Structure

- `data/*.json` : données du jeu extraites du wiki. Fichiers **générés** : ne pas les modifier à la main,
  corriger plutôt `scripts/build_data.py` puis regénérer.
- `scripts/` : code Python, uniquement la bibliothèque standard.
  - `fetch_wiki.py` télécharge les tables Cargo et les pages du wiki nécessaires.
  - `build_data.py` transforme ces données brutes en `data/*.json`.
- `bin/` : commandes à lancer depuis la machine hôte. Chacune exécute le script dans le container Docker
  (service `app` de `compose.yaml`).
- `docs/game-mechanics.md` : règles du jeu utiles au planificateur, et incohérences connues du wiki.
- `docs/build-planner.md` : décisions de conception du planificateur et questions encore ouvertes.

## Commandes

- `bin/update-data` : regénère `data/` depuis le wiki (nécessite Docker ; sous WSL, Docker Desktop doit être lancé).

## Conventions

- Tout nouveau script se lance via une entrée dans `bin/` qui l'exécute dans le container, comme `bin/update-data`.
- Le container tourne avec l'utilisateur de l'hôte : les fichiers générés ne doivent pas appartenir à root.
- Documentation et README en français ; code et commentaires en anglais.

## Wiki source

- https://farfarwest.wiki.gg/. Ses données structurées sont dans des tables Cargo : interroger
  `api.php?action=cargoquery` plutôt que de parser le HTML. Les stats absentes de Cargo (cadences de tir, dégâts
  des sorts) sont dans les infobox des pages (`action=query&prop=revisions`).
- Certains champs déclarés dans `Template:Cargo Equipment` n'existent pas dans la vraie table et font échouer la
  requête (voir `fetch_wiki.py`).
- wiki.gg bloque les clients trop rapides : il répond alors par une page HTML « Blocked » au lieu de JSON.
  Espacer les requêtes, et ne pas télécharger tout le wiki sans raison.
- Quand le wiki se contredit, documenter le choix fait dans `docs/game-mechanics.md`.
- Le wiki n'est pas toujours à jour : vérifier les règles de progression dans les notes de patch officielles
  (discussions Steam de l'app 3124540). Le build planner de wikily.gg est aussi une bonne source de recoupement.

## Mécaniques du jeu

@docs/game-mechanics.md

## Décisions du planificateur

@docs/build-planner.md
