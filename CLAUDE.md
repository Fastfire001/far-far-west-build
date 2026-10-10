# far-far-west-build

Planificateur de builds pour le jeu Far Far West (FPS coop western-fantasy, Evil Raptor, accès anticipé).
Le repo contient les données du jeu (extraites des fichiers du jeu, avec leurs traductions), les icônes de chaque
élément, les outils qui génèrent les deux, et l'application web (Vue 3 + TypeScript + Vite, site statique).

## Structure

- `data/*.json` : données du jeu, toutes extraites des fichiers du jeu, et `data/i18n/<langue>.json` leurs
  traductions officielles (15 langues) ; `data/i18n/ui/<langue>.json` : libellés des menus du jeu réutilisés par le
  planificateur. Fichiers **générés** : ne pas les modifier à la main, corriger plutôt
  `scripts/build_game_data.py` puis regénérer. Exception : `data/manual.json`, saisi à la main (cooldowns des sorts,
  repris des wikis) et jamais regénéré : à revérifier à la main après chaque mise à jour du jeu.
- `tools/game-extract/` : extracteur C# (CUE4Parse) qui lit les archives du jeu et écrit les assets bruts dans
  `.cache/game/`.
- `scripts/build_game_data.py` : décode ces assets et écrit `data/` (Python, bibliothèque standard uniquement).
- `assets/icons/<id>.svg` : une icône par élément de `data/`, **générée** par `scripts/build_icons.py` (dessins
  originaux, voir « Icônes » dans `docs/build-planner.md`). Ne pas modifier les SVG à la main.
- `web/` : l'application (Vue 3, TypeScript, Vite, Pinia, vue-i18n, tests Vitest). Elle lit directement `data/` (alias
  `@data`) et `assets/icons/`. `src/domain/` : données typées et règles du build, en TypeScript pur sans Vue, pour
  être testées seules. `src/stores/` : état partagé (stores Pinia), qui
  appelle les fonctions de `src/domain/` sans contenir de règles. `src/views/` : un écran par route de
  `src/router.ts` (vue-router en mode hash, écrans de `docs/maquettes.md`) ; `src/components/` : éléments communs
  (barre de menu, bouton RETOUR, planche de bois). `src/i18n/` : textes de l'interface
  (`ui/<langue>.json`, traduits par nos soins), complétés par les libellés du jeu (`data/i18n/ui/`, clé `game`) ;
  les textes du jeu sont chargés à la demande depuis `data/i18n/` par le store `language`.
- `.github/workflows/deploy.yml` : déploiement du site sur GitHub Pages à chaque push sur `main`.
- `bin/` : commandes à lancer depuis la machine hôte. Chacune exécute les scripts dans les containers Docker
  de `compose.yaml` (`app` pour Python, `extract` pour l'extracteur, `web` pour Node).
- `.cache/` (non versionné) : assets bruts extraits du jeu et bibliothèque Oodle téléchargée par l'extracteur.
- `docs/game-mechanics.md` : règles du jeu utiles au planificateur, méthode d'extraction, incohérences du wiki.
- `docs/build-planner.md` : décisions de conception du planificateur et questions encore ouvertes.
- `docs/maquettes.md` : maquettes ASCII des écrans (UX des menus du jeu).

## Commandes

- `bin/extract-game` : regénère tout `data/` depuis le jeu installé, puis les icônes. Nécessite Docker (sous WSL,
  Docker Desktop doit être lancé) et `FFW_GAME_DIR` (dans `.env`, voir `.env.example`). À relancer après chaque mise
  à jour du jeu.
- `bin/build-icons` : regénère seulement `assets/icons/` depuis `data/` (pour retoucher les icônes).
- `bin/dev` : serveur de dev Vite (http://localhost:5173/). `bin/test` : tests unitaires (`bin/test --watch`).
  `bin/build-site` : vérification des types et build du site dans `web/dist/`.
- `bin/web <commande>` : lance une commande dans le container Node, par exemple `bin/web npm install <paquet>`.
  Installe les dépendances npm (`web/node_modules/`) si besoin ; les autres commandes `web` passent par lui.

## Conventions

- Tout nouveau script se lance via une entrée dans `bin/` qui l'exécute dans un container, comme `bin/extract-game`.
- Les containers tournent avec l'utilisateur de l'hôte : les fichiers générés ne doivent pas appartenir à root.
- Documentation et README en français ; code et commentaires en anglais.
- Les fichiers extraits du jeu restent dans `.cache/` : ne jamais les versionner ni les publier. Seules les valeurs
  utiles au planificateur vont dans `data/`.
- Les objets sont référencés par leur id interne du jeu (`itemPistol`, `jokerCrackShot`), jamais par leur nom affiché.
- Aucun visuel du jeu ou du wiki dans le repo (icônes, images, textures) : les icônes sont des dessins originaux.

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

- Le wiki (https://farfarwest.wiki.gg/) n'est plus une source de données (sauf `data/manual.json`), mais reste
  utile pour se documenter. Il bloque les clients trop rapides (page HTML « Blocked » au lieu de JSON) : espacer
  les requêtes.
- Règles de progression absentes des fichiers lisibles (boutique de prestige…) : notes de patch officielles
  (discussions Steam de l'app 3124540) et build planner de wikily.gg.

## Mécaniques du jeu

@docs/game-mechanics.md

## Décisions du planificateur

@docs/build-planner.md
