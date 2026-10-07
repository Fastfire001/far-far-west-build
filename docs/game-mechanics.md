# Far Far West — mécaniques utiles au planificateur de builds

Source : [farfarwest.wiki.gg](https://farfarwest.wiki.gg/) (tables Cargo + pages), extrait le 2026-10-07,
version du jeu 0.2.x. Le contenu du wiki est sous licence CC BY-SA (à vérifier) : créditer le wiki.
Données structurées dans `data/`, régénérables avec `bin/update-data`.

## Ce qui compose un build

| Élément | Choix | Données |
|---|---|---|
| Arme principale | 1 parmi 7 (Quad Cylinder, Shotgun, Long Ranger, Minigun, Leveredge, Knuckles, Lasso) | `equipment.json` |
| Arme secondaire (sidearm) | 1 parmi 6 (Revolver, Bow, Dual Revolvers, Boomerang, Sheriff Star, Banjo) + **un élément** (Acid, Pyro, Elec, Frost) appliqué à l'impact | `equipment.json` |
| Utilitaire | 1 parmi 4 (Ammo Pack, Bottle Crate, Healing Area, Impulse Grenade) | `equipment.json` |
| Sorts | 3 max (3e emplacement au niveau 3), 30 sorts sur 6 écoles : Pyro, Elec, Acid, Voodoo, Cactus, Frost | `spells.json` |
| Upgrades de stats | Héros, arme principale, sidearm : points répartis par stat | `upgrades` dans `equipment.json`, `hero.json` |
| Jokers | Héros, arme principale, sidearm : chacun a son propre budget d'emplacements | `jokers.json` |

## Jokers

- Rareté → **coût en emplacements** (`slot_cost`) : Normal 1, Fine 2, Prime 3, Mythic 4, Legendary 5,
  Unique 3 à 5.
- Budget par porteur (héros ou arme) : 2 au niveau 1, +1 aux niveaux 4, 6, 8, 10, 13, 16, 19, 24, 29, 35, 42, 50
  → **14 au maximum**, +2 via le prestige → **16**. (La page Jokers dit « 1 seul emplacement au niveau 1 » ;
  la page Equipment dit 2. Prendre 2 tant qu'on n'a pas confirmé en jeu.)
- `max_equip` = nombre maximum de copies du même joker sur un porteur.
- `available_on` : `["Hero"]` pour un joker de héros, sinon la liste des armes compatibles.
- Jokers **Unique** : propres à une arme, débloqués en montant l'arme (armes principales aux niveaux 35 et 55,
  sidearms aux niveaux 30 et 40).
- `obtainable_from` : `shop` / `gamba` (achetables au lobby, donc planifiables) ; `challenge` (débloqué par un
  défi) ; `coop`/`solo` (drop en mission uniquement). Un joker sans `shop`/`gamba`/`challenge` (ex. Camper,
  Dwarf, Giant, Extra Dash, Lazy, Medicard) ne s'équipe pas au lobby : on le trouve seulement en mission, et
  il ne compte alors pas dans les limites d'emplacements. Le planificateur devrait les séparer ou les signaler.

## Upgrades de stats

- Chaque niveau d'arme donne 1 point, jusqu'à **20 points** (les pages des armes disent « au niveau 40 », la page
  Equipment dit « au niveau 20 » : à vérifier). Le prestige donne +2 points, au plus 3 fois → **26 points**.
- Chaque stat a un `pct_per_slot` et un `max_slots`. Par exemple, Damage : +5 % par point, 8 points au maximum.
- Héros : Ammo Bag 5 % ×16, Health 5 % ×6, Spell CDR 2 % ×6, Speed 4 % ×6, Jump Height 7 % ×6.
  Le nombre total de points du héros n'est pas documenté.

## Prestige

Au niveau 100 (héros ou arme), le prestige remet le niveau à 1 et donne 5 jetons. On les échange contre
+2 emplacements de joker, +2 points d'upgrade, des tickets XP, de l'or ou des âmes.

## Sorts et combos

- `spells.json` : élément, niveau de déblocage (1, 4, 12, 20, 35), cooldown, et si le sort crée des flaques
  (puddles). Les dégâts et la zone d'effet ne sont renseignés que pour certains sorts.
- `spell_combos.json` : 29 interactions. Chaque combo a des `triggers` `{a, b}` dont les valeurs sont des noms de
  sorts, un élément (« Elec ») ou une flaque (« Acid Puddle »). L'élément de la **sidearm** peut aussi
  déclencher un combo : elle applique l'élément à l'impact et le Bow peut créer des flaques. Le planificateur peut
  détecter les combos actifs d'un build à partir de ses sorts et de l'élément de sa sidearm.
- Les jokers **Mastery** (Pyro, Elec, Acid, Voodoo, Cactus, Frost) donnent −10 % de cooldown par sort équipé de
  l'école correspondante.

## Incohérences connues du wiki

- Cooldowns : `Module:Spells/data` est obsolète ; la table Cargo (`spells.json`) est plus récente.
- Lifesteal des sidearms : la table Cargo indique 1 % ×5, la page Equipment 1,25 % ×8. On garde Cargo.
- Les cadences de tir viennent des infobox (`fire_interval_*`, en secondes entre deux tirs). La Minigun monte de
  1 à 0,08 s.
