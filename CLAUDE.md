# far-far-west-build

Planificateur de builds pour le jeu Far Far West (FPS coop western-fantasy, Evil Raptor, accès anticipé).
La stack de l'application n'est pas encore choisie : pour l'instant, le repo ne contient que les données du jeu.

## Structure

- `data/*.json` : données du jeu, toutes extraites des fichiers du jeu. Fichiers **générés** : ne pas les modifier à
  la main, corriger plutôt `scripts/build_game_data.py` puis regénérer.
- `tools/game-extract/` : extracteur C# (CUE4Parse) qui lit les archives du jeu et écrit les assets bruts dans
  `.cache/game/`.
- `scripts/build_game_data.py` : décode ces assets et écrit `data/` (Python, bibliothèque standard uniquement).
- `bin/` : commandes à lancer depuis la machine hôte. Chacune exécute les scripts dans les containers Docker
  de `compose.yaml` (`app` pour Python, `extract` pour l'extracteur).
- `.cache/` (non versionné) : assets bruts extraits du jeu et bibliothèque Oodle téléchargée par l'extracteur.
- `docs/game-mechanics.md` : règles du jeu utiles au planificateur, méthode d'extraction, incohérences du wiki.
- `docs/build-planner.md` : décisions de conception du planificateur et questions encore ouvertes.

## Commandes

- `bin/extract-game` : regénère tout `data/` depuis le jeu installé. Nécessite Docker (sous WSL, Docker Desktop
  doit être lancé) et `FFW_GAME_DIR` (dans `.env`, voir `.env.example`). À relancer après chaque mise à jour du jeu.

## Conventions

- Tout nouveau script se lance via une entrée dans `bin/` qui l'exécute dans un container, comme `bin/extract-game`.
- Les containers tournent avec l'utilisateur de l'hôte : les fichiers générés ne doivent pas appartenir à root.
- Documentation et README en français ; code et commentaires en anglais.
- Les fichiers extraits du jeu restent dans `.cache/` : ne jamais les versionner ni les publier. Seules les valeurs
  utiles au planificateur vont dans `data/`.
- Les objets sont référencés par leur id interne du jeu (`itemPistol`, `jokerCrackShot`), jamais par leur nom affiché.

## Fichiers du jeu

- Unique source des données. Le jeu est en Unreal Engine 5.6, archives IoStore non chiffrées, compression Oodle.
- Pas de fichier de mappings, et on a décidé de ne pas en générer avec un dumper (injection dans le jeu) : les
  DataTables à structure Blueprint sont décodées à la main dans `build_game_data.py` (voir « Extraction depuis le
  jeu » dans `docs/game-mechanics.md`). Les valeurs stockées dans les Blueprints (stats des armes, cooldowns et
  niveaux de déblocage des sorts) sont hors de portée.
- Si l'extraction échoue après une mise à jour du jeu : soit une structure (`S_PlayerJokers`) a changé, soit un objet
  a été ajouté à `DT_PlayerItems` et doit être ajouté à `EQUIPMENT`, `SPELLS`, `SCHOOLS` ou `IGNORED_ITEMS`.
- `Manifest_UFSFiles_Win64.txt`, à la racine de l'installation, liste tous les assets du jeu : pratique pour
  trouver la source d'une donnée.

## Autres sources

- Le wiki (https://farfarwest.wiki.gg/) n'est plus une source de données, mais reste utile pour se documenter. Il
  bloque les clients trop rapides (page HTML « Blocked » au lieu de JSON) : espacer les requêtes.
- Règles de progression absentes des fichiers lisibles (boutique de prestige…) : notes de patch officielles
  (discussions Steam de l'app 3124540) et build planner de wikily.gg.

## Mécaniques du jeu

@docs/game-mechanics.md

## Décisions du planificateur

@docs/build-planner.md
