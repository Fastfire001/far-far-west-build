# Build planner — décisions de conception

Décisions prises le 2026-10-07, avant d'écrire le code. La stack n'est pas encore choisie.

## Périmètre (v1)

Un build contient :

- **Héros** : upgrades (points par stat) + jokers.
- **3 sorts**, sans doublon.
- **Arme principale** : l'arme + upgrades + jokers.
- **Arme secondaire** : l'arme + **son élément** (Acid, Pyro, Elec, Frost) + upgrades + jokers.
- **Utilitaire**.

Le planificateur :

- **valide** le build : points d'upgrade (26 par porteur et plafond par stat), budget de jokers (16 par porteur),
  copies (`max_equip`), compatibilité des jokers avec leur porteur, pas de sort en double ;
- **affiche le niveau minimum et le nombre de prestiges nécessaires** pour chaque porteur (héros, arme principale,
  arme secondaire), à partir des points d'upgrade et des emplacements de jokers utilisés, et des jokers Unique
  choisis (niveau du défi qui les débloque). Tant qu'une règle utilisée par ce calcul n'est pas confirmée (voir
  les questions ouvertes), le résultat est affiché avec un avertissement.

Hors périmètre :

- **aucune stat calculée** (ni DPS des armes, ni cooldowns finaux des sorts) ;
- **pas de combos de sorts** : ils dépendent du placement en jeu et leurs déclencheurs sont mal documentés.
  L'élément de la sidearm reste un choix du build, mais ne déclenche rien dans le planificateur.

## Règles retenues

- **On planifie au niveau maximum** : 26 points d'upgrade et 16 emplacements de jokers par porteur, tous les sorts
  et tous les jokers Unique disponibles. Les sorts n'entrent pas dans le calcul du niveau minimum : leurs niveaux
  de déblocage ne sont pas extraits du jeu (voir `docs/game-mechanics.md`).
- **Les jokers qu'on ne peut pas équiper au lobby sont exclus** : on garde seulement ceux qui ont `can_be_bought`
  ou `can_be_gambled` (aujourd'hui, seuls Camper, Dwarf, Extra Dash et Giant sont exclus). Le filtre se fait dans
  le planificateur, pas dans `data/`, pour qu'un joker devenu achetable apparaisse après un `bin/extract-game`.
- **Toutes les données viennent des fichiers du jeu** (`bin/extract-game`), sauf les règles de prestige. Voir
  `docs/game-mechanics.md`.
- Les règles de progression qui ne sont pas dans `data/progression.json` (points par niveau, boutique de prestige)
  sont regroupées dans un seul fichier de configuration, chacune marquée confirmée ou supposée.

## Langues

- Le planificateur est disponible dans les **15 langues du jeu**, avec les textes officiels du jeu (`data/i18n/`).
  À défaut d'un texte traduit, il affiche l'anglais.
- Les textes sont affichés tels que dans le jeu (noms de jokers en majuscules) ; les retours à la ligne des noms
  japonais sont remplacés par un espace à l'affichage.
- L'interface du planificateur elle-même (boutons, messages de validation) n'existe pas dans le jeu : elle devra
  être traduite par nos soins, au moins en français et en anglais.

## Sauvegarde et partage

- Les builds sont sauvegardés dans le **localStorage** du navigateur : une liste de builds nommés (ouvrir,
  dupliquer, supprimer).
- Boutons **Exporter / Importer** : le build est un JSON encodé en base64, avec un préfixe (`FFW1:…`).
- Le JSON contient un **numéro de version de format** (`"v": 1`), pour pouvoir convertir les anciens builds.
- Tous les objets (équipement, sorts, jokers, upgrades) sont identifiés par leur **`id` interne du jeu**
  (`itemPistol`, `jokerCrackShot`…), qui ne change pas si le jeu renomme l'objet.
- Encodage base64 en UTF-8 (`TextEncoder`), pas `btoa()` directement, qui plante sur les caractères accentués.
- À l'import, le build est validé avec les mêmes règles que dans l'éditeur. Un build invalide, ou qui contient un
  identifiant inconnu (joker supprimé par un patch), s'importe quand même avec des avertissements.

## Hébergement

- **GitHub Pages** : un site statique, **aucun serveur à gérer**. Pas de backend, pas de comptes, pas de base de
  données : l'application est entièrement côté navigateur, et `data/*.json` est servi comme fichier statique.
- La stack choisie doit donc produire un site statique (HTML/JS/CSS) déployable tel quel sur GitHub Pages.
- Avec un compte GitHub gratuit, Pages exige un dépôt public ; depuis un dépôt privé, il faut GitHub Pro. Dans les
  deux cas, **le site lui-même est public**, données du jeu comprises.
- **Pas de mise en ligne avant l'accord d'Evil Raptor** : le CLUF du jeu interdit la rétro-ingénierie et la
  distribution de son contenu. En attendant, le planificateur se développe et tourne en local.

## Questions ouvertes (à vérifier en jeu)

Les autres questions ont été tranchées par les fichiers du jeu le 2026-10-07 (voir `docs/game-mechanics.md`).

1. **Les bonus de prestige s'appliquent-ils tout de suite ?** Les emplacements et points achetés sont-ils utilisables
   dès le niveau 1, ou relèvent-ils seulement le plafond qu'il faut atteindre en montant de niveau ? La logique est
   dans le Blueprint `UI_PrestigeShop`, illisible avec notre méthode d'extraction.

## Existant

wikily.gg propose déjà un build planner pour Far Far West (jokers par porteur, upgrades, sorts, prestige, partage
de builds en ligne). À regarder avant de commencer, pour voir ce qu'il fait bien et ce qu'il fait moins bien.
