# far-far-west-build

Planificateur de builds pour le jeu Far Far West (FPS coop western-fantasy, Evil Raptor, accès anticipé).
La stack de l'application n'est pas encore choisie : pour l'instant, le repo ne contient que les données du jeu.

## Structure

- `data/*.json` : données du jeu. Fichiers **générés** : ne pas les modifier à la main, corriger plutôt le script
  qui les produit puis regénérer. Jokers, upgrades et progression viennent des fichiers du jeu ; équipement, sorts
  et combos du wiki.
- `scripts/` : code Python, uniquement la bibliothèque standard.
  - `fetch_wiki.py` télécharge les tables Cargo et les pages du wiki nécessaires ; `build_data.py` en tire
    `equipment.json`, `spells.json` et `spell_combos.json`.
  - `build_game_data.py` décode les assets extraits du jeu et écrit `jokers.json`, `upgrades.json` et
    `progression.json`.
- `tools/game-extract/` : extracteur C# (CUE4Parse) qui lit les archives du jeu et écrit les assets bruts dans
  `.cache/game/`.
- `bin/` : commandes à lancer depuis la machine hôte. Chacune exécute les scripts dans les containers Docker
  de `compose.yaml` (`app` pour Python, `extract` pour l'extracteur).
- `.cache/` (non versionné) : assets bruts extraits du jeu et bibliothèque Oodle téléchargée par l'extracteur.
- `docs/game-mechanics.md` : règles du jeu utiles au planificateur, et incohérences connues du wiki.
- `docs/build-planner.md` : décisions de conception du planificateur et questions encore ouvertes.

## Commandes

Toutes nécessitent Docker (sous WSL, Docker Desktop doit être lancé).

- `bin/update-data` : regénère depuis le wiki `equipment.json`, `spells.json` et `spell_combos.json`.
- `bin/extract-game` : regénère depuis le jeu installé `jokers.json`, `upgrades.json` et `progression.json`.
  Nécessite `FFW_GAME_DIR` (dans `.env`, voir `.env.example`). À relancer après chaque mise à jour du jeu.

## Conventions

- Tout nouveau script se lance via une entrée dans `bin/` qui l'exécute dans le container, comme `bin/update-data`.
- Le container tourne avec l'utilisateur de l'hôte : les fichiers générés ne doivent pas appartenir à root.
- Documentation et README en français ; code et commentaires en anglais.
- Les fichiers extraits du jeu restent dans `.cache/` : ne jamais les versionner ni les publier. Seules les valeurs
  utiles au planificateur vont dans `data/`.

## Fichiers du jeu

- Source de vérité pour les jokers, les upgrades et le barème des emplacements de jokers. Le jeu est en Unreal
  Engine 5.6, archives IoStore non chiffrées, compression Oodle.
- Pas de fichier de mappings : les DataTables à structure Blueprint sont décodées à la main dans
  `build_game_data.py` (voir « Extraction depuis le jeu » dans `docs/game-mechanics.md`). Si l'extraction échoue
  après une mise à jour du jeu, c'est probablement que la structure `S_PlayerJokers` a changé.
- `Manifest_UFSFiles_Win64.txt`, à la racine de l'installation, liste tous les assets du jeu : pratique pour
  trouver la source d'une donnée.

## Wiki

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
