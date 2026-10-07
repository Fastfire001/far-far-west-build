# Far Far West — mécaniques utiles au planificateur de builds

Règles vérifiées le 2026-10-07, pour la version 0.2.0.20 du jeu (accès anticipé). La mise à jour 644 du 2026-05-14
a refondu la progression et rendu obsolètes plusieurs pages du wiki.

## Sources des données

| Fichier de `data/` | Source | Commande |
|---|---|---|
| `jokers.json`, `upgrades.json`, `progression.json` | **fichiers du jeu** (installation locale) | `bin/extract-game` |
| `equipment.json`, `spells.json` | [farfarwest.wiki.gg](https://farfarwest.wiki.gg/) (tables Cargo + pages) | `bin/update-data` |

Les fichiers du jeu font foi : le wiki est rempli à la main et se trompe sur plusieurs jokers (voir « Incohérences
connues du wiki »). Le contenu du wiki est sous licence CC BY-SA (à vérifier) : il faut le créditer. Les fichiers
extraits du jeu restent dans `.cache/` (non versionné) ; seules les valeurs utiles au planificateur vont dans `data/`.

## Ce qui compose un build

| Élément | Choix | Données |
|---|---|---|
| Arme principale | 1 parmi 7 (Quad Cylinder, Shotgun, Long Ranger, Minigun, Leveredge, Knuckles, Lasso) | `equipment.json` |
| Arme secondaire (sidearm) | 1 parmi 6 (Revolver, Bow, Dual Revolvers, Boomerang, Sheriff Star, Banjo) + **un élément** appliqué à l'impact : Acid, Pyro, Elec ou Frost, les 4 étant disponibles sur toutes les sidearms | `equipment.json` |
| Utilitaire | 1 parmi 4 (Ammo Pack, Bottle Crate, Healing Area, Impulse Grenade) | `equipment.json` |
| Sorts | 3 maximum, parmi 30 sorts répartis en 6 écoles : Pyro, Elec, Acid, Voodoo, Cactus, Frost | `spells.json` |
| Upgrades de stats | Héros, arme principale, sidearm : des points répartis par stat | `upgrades.json` |
| Jokers | Héros, arme principale, sidearm : chacun a son propre budget d'emplacements | `jokers.json` |

Les « porteurs » (héros, arme principale, sidearm) ont chacun leur niveau (1 à 100), leurs prestiges, leurs
points d'upgrade et leur budget de jokers. L'utilitaire n'a ni upgrade ni joker.

## Jokers (`jokers.json`)

- `id` : identifiant interne du jeu (`jokerCrackShot`), stable même si le nom affiché change. `name` : nom affiché.
- `slot_cost` : coût en emplacements. Normal 1, Fine 2, Prime 3, Mythic 4, Legendary 5 ; les Unique coûtent
  de 2 à 7 selon la carte (Ultra Draw 7, Mindshot 6, Eco Trick et Swamp Trick 2…).
- `max_equip` : nombre maximum de copies du même joker sur un porteur.
- `available_on` : `["Hero"]` pour un joker de héros, sinon la liste des armes compatibles.
- **Obtention** :
  - `can_be_bought` / `can_be_gambled` : achetable au lobby, ou obtenable à la machine à sous (gamba) ;
  - `unlocked_by` : défi qui débloque le joker (ex. `challengeLvl40ItemBow` = Bow niveau 40) ;
  - `can_drop_in_mission` : peut tomber en mission.

  Un joker qui n'est ni achetable ni gamblable ne s'équipe pas au lobby : Camper, Dwarf, Extra Dash et Giant.
  En mission, les jokers trouvés ne comptent pas dans les limites d'emplacements et disparaissent à la fin.
- Budget par porteur : **14** emplacements grâce aux niveaux, **16** avec les 2 emplacements achetés au prestige.
  Le héros a le même budget que les armes.
- **Déblocage des emplacements** (`progression.json`, `joker_slot_levels`) : l'emplacement n se débloque au
  niveau indiqué.

| Emplacement | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Niveau | 1 | 4 | 8 | 12 | 16 | 21 | 26 | 32 | 40 | 48 | 58 | 70 | 84 | 100 |

- **Jokers Unique** : propres à une arme, débloqués par un défi de niveau de l'arme (armes principales : niveaux 35
  et 55 ; sidearms : niveaux 30 et 40), puis achetés.
- **Jokers Mastery** (un par école de sorts) : débloqués au niveau 50 de l'école ; −10 % de cooldown par sort
  équipé de cette école. L'élément de la sidearm ne compte pas.
- Le jeu n'impose **aucun niveau requis par joker** : la table des jokers n'a pas de champ de niveau.

## Upgrades de stats (`upgrades.json`)

- **1 point tous les 2 niveaux** depuis la mise à jour 644, jusqu'à **20 points au niveau 40**.
- **+6 points** achetables au prestige → **26 points** par porteur, héros compris.
- Chaque upgrade a une valeur par point (`value`), un nombre maximum de points (`max_slots`), un prix en or par
  point (`gold_cost`, hors périmètre pour l'instant) et la liste des porteurs qui y ont accès (`available_on`).
- `flat` : `true` si la valeur est un montant fixe (Health : +5 PV par point ; Chord Capacity : +1 accord par point),
  `false` si c'est une fraction (`0.05` = +5 %).
- Une même stat peut exister en plusieurs variantes selon l'arme : par exemple Attack Speed vaut +5 % ×16 sur les
  armes à feu, +5 % ×8 sur la Minigun et les armes de mêlée, +10 % ×8 sur le Bow.

## Prestige

- Possible au niveau 100, jusqu'à **15 prestiges** par porteur (héros et chaque arme ont leur propre compteur).
- Remet le niveau à 1. Les achats de la boutique de prestige sont permanents.
- Chaque prestige donne **5 jetons**. Boutique :

| Achat | Coût | Achats possibles | Effet total |
|---|---|---|---|
| Emplacement de joker | 5 jetons | 2 | budget 14 → 16 |
| Point d'upgrade | 2 jetons | 6 | 20 → 26 points |
| Ticket XP, 500 or, 1000 âmes | 1 jeton | illimité | ressources |

- Chaque prestige (5 jetons) paie donc soit 1 emplacement de joker, soit 2 points d'upgrade, pas les deux.
  Prestiges nécessaires = emplacements de joker achetés + ⌈points d'upgrade achetés / 2⌉. Un build au maximum
  demande 2 + 3 = **5 prestiges** sur le porteur.
- Ces règles viennent des notes de patch et du build planner de wikily.gg, pas des fichiers du jeu : la logique de
  la boutique est dans un Blueprint (`UI_PrestigeShop`), illisible avec notre méthode d'extraction.

## Sorts

- `spells.json` : élément, niveau de déblocage (1, 4, 12, 20, 35), cooldown, et si le sort crée des flaques
  (puddles). Les dégâts et la zone d'effet ne sont renseignés que pour certains sorts.
- Les écoles de sorts ont **leur propre niveau** (les jokers Mastery se débloquent au niveau 50 d'une école). Les
  niveaux de déblocage des sorts sont donc très probablement des niveaux d'école, pas des niveaux du héros.
- 3 emplacements de sorts (touches Q, E, C) ; le 3e se débloque au niveau 3.
- Les combos entre sorts (une trentaine sur le wiki : Fire Tornado, Geyser Split…) ne sont pas repris : ils
  dépendent du placement en jeu et leurs déclencheurs sont mal documentés.

## Extraction depuis le jeu

`bin/extract-game` lit l'installation locale du jeu, en lecture seule (chemin dans `FFW_GAME_DIR`, voir
`.env.example`), en deux étapes :

1. `tools/game-extract` (C#, bibliothèque [CUE4Parse](https://github.com/FabianFG/CUE4Parse)) lit les archives
   IoStore du jeu (Unreal Engine 5.6, compression Oodle, sans chiffrement) et écrit les assets bruts dans
   `.cache/game/`.
2. `scripts/build_game_data.py` les décode et écrit `data/`.

Assets lus :

| Asset | Contenu |
|---|---|
| `/Game/Progress/DT_PlayerJokers` | table de tous les jokers **et** des upgrades (lignes `jokerUpgrade*`), structure de ligne `S_PlayerJokers` |
| `/Game/LocaStringTables/ST_Tweaks` | noms et descriptions affichés des jokers et upgrades |
| `/Game/Interfaces/Equipment/C_UnlockedJokers` | courbe numéro d'emplacement → niveau requis (arrondi à l'inférieur) |

Le jeu sérialise ses propriétés en mode « unversioned » (sans nom ni type) et ne fournit pas de fichier de
mappings. CUE4Parse ne peut donc pas décoder la table des jokers : `build_game_data.py` la décode lui-même, avec
l'ordre et le type des champs de `S_PlayerJokers` écrits en dur (`JOKER_ROW`). Si une mise à jour du jeu change
cette structure, le script s'arrête avec une erreur. Pour retrouver le nouvel ordre : les champs sont sérialisés
dans `S_PlayerJokers.uasset` sous forme de paires de FNames (type, nom) qu'on peut relire avec la name map du
package (mode `names:` de l'extracteur).

Contrôles qui valident la méthode : les 176 lignes de la table se lisent jusqu'à la fin exacte de l'export ;
Crackshot correspond au wiki ; l'ancienne courbe `C_UnlockedJokers_BeforeRemapTo100Levels` redonne exactement
l'ancien barème du wiki (4, 6, 8, 10, 13, 16, 19, 24, 29, 35, 42, 50) ; les 149 noms de jokers actifs sont
identiques à ceux du wiki.

## Incohérences connues du wiki

Corrigées par les fichiers du jeu :

- **Coût des jokers Unique** (wiki → jeu) : Eco Trick et Swamp Trick 5 → 2 ; Fanning Ace, Mark Ace,
  Scavenger Star et Chonky Throw 5 → 3 ; Eagle Lever, Frenzy Spin, Jump Star, Lingering Throw, Rush Blast et
  Stacked Lever 5 → 4 ; Mindshot 5 → 6 ; Ultra Draw 5 → 7.
- **Copies maximum** : Bouncing Ball et Clutch, 1 → 2.
- **Lazy et Medicard** : sans source d'obtention sur le wiki ; ils s'achètent (800 et 300 or).
- **Rampage** : pas disponible sur le Bow ni la Minigun.
- **Health** (upgrade du héros) : +5 PV fixes par point, pas +5 %.
- **Lifesteal** des sidearms : 1 % ×5 (la page Equipment dit 1,25 % ×8).
- **Barème des emplacements de jokers** : celui du wiki date d'avant le patch 644. 1 seul emplacement au niveau 1.

Autres, côté données venant encore du wiki :

- Cooldowns : `Module:Spells/data` est obsolète ; la table Cargo (`spells.json`) est plus récente.
- Points d'upgrade : la page Equipment dit « 1 point par niveau, 20 au niveau 20 », obsolète depuis le patch 644.
- Page Prestige : ne donne ni les coûts ni les plafonds de la boutique.
- Les cadences de tir viennent des infobox (`fire_interval_*`, en secondes entre deux tirs). La Minigun accélère
  de 1 s à 0,08 s.

## Sources

- Fichiers du jeu, version 0.2.0.20 : jokers, upgrades, barème des emplacements, défis de déblocage.
- [farfarwest.wiki.gg](https://farfarwest.wiki.gg/) : équipement, sorts, éléments des sidearms.
- [Notes de patch Early Access Update 1 (V644)](https://steamcommunity.com/app/3124540/discussions/0/837250028234942852/) :
  upgrades tous les 2 niveaux, jokers débloqués entre les niveaux 1 et 100, 6 points d'upgrade bonus.
- [Build planner de wikily.gg](https://wikily.gg/far-far-west/build-planner/new) : boutique de prestige (coûts,
  plafonds, formule des prestiges requis). Licence non précisée : on s'en sert pour recouper, sans copier ses
  données dans `data/`.
- [Discussion Steam sur le prestige](https://steamcommunity.com/app/3124540/discussions/0/571540300205508222/) :
  « at least 5 prestiges » pour tout débloquer.
- [Neonsect, Prestige explained](https://neonsect.com/far-far-west/far-far-west-prestige-explained/) : prestige
  jusqu'à 15.
