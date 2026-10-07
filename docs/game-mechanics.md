# Far Far West — mécaniques utiles au planificateur de builds

Données structurées dans `data/`, extraites de [farfarwest.wiki.gg](https://farfarwest.wiki.gg/) (tables Cargo +
pages) et régénérables avec `bin/update-data`. Le contenu du wiki est sous licence CC BY-SA (à vérifier) : il faut
créditer le wiki.

Le wiki n'est pas toujours à jour : les règles ci-dessous ont été recoupées le 2026-10-07 avec les sources listées
en bas de page. Le jeu est en accès anticipé (version 0.2.x) ; la mise à jour 644 du 2026-05-14 a refondu la
progression et a rendu obsolètes plusieurs pages du wiki.

## Ce qui compose un build

| Élément | Choix | Données |
|---|---|---|
| Arme principale | 1 parmi 7 (Quad Cylinder, Shotgun, Long Ranger, Minigun, Leveredge, Knuckles, Lasso) | `equipment.json` |
| Arme secondaire (sidearm) | 1 parmi 6 (Revolver, Bow, Dual Revolvers, Boomerang, Sheriff Star, Banjo) + **un élément** appliqué à l'impact : Acid, Pyro, Elec ou Frost, les 4 étant disponibles sur toutes les sidearms | `equipment.json` |
| Utilitaire | 1 parmi 4 (Ammo Pack, Bottle Crate, Healing Area, Impulse Grenade) | `equipment.json` |
| Sorts | 3 maximum, parmi 30 sorts répartis en 6 écoles : Pyro, Elec, Acid, Voodoo, Cactus, Frost | `spells.json` |
| Upgrades de stats | Héros, arme principale, sidearm : des points répartis par stat | `upgrades` dans `equipment.json`, `hero.json` |
| Jokers | Héros, arme principale, sidearm : chacun a son propre budget d'emplacements | `jokers.json` |

Les « porteurs » (héros, arme principale, sidearm) ont chacun leur niveau (1 à 100), leurs prestiges, leurs
points d'upgrade et leur budget de jokers. L'utilitaire n'a ni upgrade ni joker.

## Jokers

- Rareté → **coût en emplacements** (`slot_cost`) : Normal 1, Fine 2, Prime 3, Mythic 4, Legendary 5,
  Unique 3 à 5 selon la carte.
- Budget par porteur : **14** grâce aux niveaux, **16** avec les 2 emplacements achetés au prestige. Le héros a le
  même budget que les armes.
- Depuis la mise à jour 644, les emplacements se débloquent entre les niveaux 1 et 100 (avant : 1 à 50).
  Le barème « +1 aux niveaux 4, 6, 8, 10, 13, 16, 19, 24, 29, 35, 42, 50 » du wiki date d'avant ce patch ;
  les nouveaux niveaux exacts ne sont documentés nulle part.
- `max_equip` = nombre maximum de copies du même joker sur un porteur.
- `available_on` : `["Hero"]` pour un joker de héros, sinon la liste des armes compatibles.
- Jokers **Unique** : propres à une arme, débloqués en montant l'arme (armes principales aux niveaux 35 et 55,
  sidearms aux niveaux 30 et 40, selon la page Equipment du wiki, qui date peut-être d'avant le patch 644).
- `obtainable_from` : `shop` / `gamba` (achetables au lobby), `challenge` (débloqué par un défi), `coop`/`solo`
  (trouvé en mission). Un joker qui n'a ni `shop`, ni `gamba`, ni `challenge` (Camper, Dwarf, Extra Dash, Giant,
  Lazy, Medicard) ne s'équipe pas au lobby. En mission, les jokers trouvés ne comptent pas dans les limites
  d'emplacements et disparaissent à la fin.

## Upgrades de stats

- **1 point tous les 2 niveaux** depuis la mise à jour 644, jusqu'à **20 points au niveau 40**. La page Equipment du
  wiki (« 1 point par niveau, 20 au niveau 20 ») est obsolète.
- **+6 points** achetables au prestige → **26 points** par porteur, héros compris.
- Chaque stat a un `pct_per_slot` et un `max_slots`. Par exemple, Damage : +5 % par point, 8 points au maximum.
- Héros : Ammo Bag 5 % ×16, Health ×6, Spell CDR 2 % ×6, Speed 4 % ×6, Jump Height 7 % ×6. Le build planner de
  wikily.gg affiche « Health +30 » au maximum : Health donne probablement +5 PV par point, et non +5 %.
- Lifesteal des sidearms : 1 % par point, 5 points au maximum (+5 %).

## Prestige

- Possible au niveau 100, jusqu'à **15 prestiges** par porteur (héros et chaque arme ont leur propre compteur).
- Remet le niveau à 1. Les achats de la boutique de prestige sont permanents.
- Chaque prestige donne **5 jetons**. Boutique :

| Achat | Coût | Achats possibles | Effet total |
|---|---|---|---|
| Emplacement de joker | 5 jetons | 2 | budget 14 → 16 |
| Point d'upgrade | 2 jetons | 6 | 20 → 26 points |
| Ticket XP, 500 or, 1000 âmes | 1 jeton | illimité | ressources |

- Un build au maximum demande donc 10 + 12 = 22 jetons, soit **5 prestiges** sur le porteur. Un seul prestige ne
  paie pas à la fois un emplacement de joker et des points d'upgrade.

## Sorts et combos

- `spells.json` : élément, niveau de déblocage (1, 4, 12, 20, 35), cooldown, et si le sort crée des flaques
  (puddles). Les dégâts et la zone d'effet ne sont renseignés que pour certains sorts.
- 3 emplacements de sorts (touches Q, E, C) ; le 3e se débloque au niveau 3.
- `spell_combos.json` : 29 interactions. Chaque combo a des `triggers` `{a, b}` dont les valeurs sont des noms de
  sorts, un élément (« Elec ») ou une flaque (« Acid Puddle »). L'élément de la **sidearm** peut aussi déclencher un
  combo : elle applique l'élément à l'impact, et le Bow crée des flaques.
- Les jokers **Mastery** (Pyro, Elec, Acid, Voodoo, Cactus, Frost) donnent −10 % de cooldown par sort équipé de
  l'école correspondante. L'élément de la sidearm ne compte pas.

## Incohérences connues du wiki

- Cooldowns : `Module:Spells/data` est obsolète ; la table Cargo (`spells.json`) est plus récente.
- Lifesteal : la page Equipment indique 1,25 % ×8, la table Cargo 1 % ×5. Cargo est correct.
- Page Prestige : décrit encore « +2 emplacements de joker, +2 points d'upgrade » sans les coûts ni les plafonds.
- Page Jokers : « 1 seul emplacement au niveau 1 » ; la page Equipment dit 2. Aucun des deux n'est confirmé
  depuis le patch 644.
- Page de Lazy : dit qu'il se cumule jusqu'à 3 fois, alors que son `max_equip` vaut 1.
- Les cadences de tir viennent des infobox (`fire_interval_*`, en secondes entre deux tirs). La Minigun accélère
  de 1 s à 0,08 s.

## Sources

- [farfarwest.wiki.gg](https://farfarwest.wiki.gg/) : données de `data/`, éléments des sidearms.
- [Notes de patch Early Access Update 1 (V644)](https://steamcommunity.com/app/3124540/discussions/0/837250028234942852/) :
  upgrades tous les 2 niveaux, jokers débloqués entre les niveaux 1 et 100, 6 points d'upgrade bonus.
- [Build planner de wikily.gg](https://wikily.gg/far-far-west/build-planner/3dbea6ae-28bb-4f2a-9e72-6164fa1b6939/edit) :
  boutique de prestige (coûts et plafonds), 26 points et 16 emplacements par porteur, Lifesteal +5 %, Health +30.
- [Discussion Steam sur le prestige](https://steamcommunity.com/app/3124540/discussions/0/571540300205508222/) :
  « at least 5 prestiges » pour tout débloquer.
- [Neonsect, Prestige explained](https://neonsect.com/far-far-west/far-far-west-prestige-explained/) : prestige
  jusqu'à 15.
