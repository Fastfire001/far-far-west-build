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
- **affiche les combos actifs**, calculés à partir des sorts et de l'élément de la sidearm ;
- **affiche le niveau minimum et le nombre de prestiges nécessaires** pour chaque porteur (héros, arme principale,
  arme secondaire). Tant qu'une règle utilisée par ce calcul n'est pas confirmée (voir les questions ouvertes),
  le résultat est affiché avec un avertissement.

Hors périmètre : **aucune stat calculée** (ni DPS des armes, ni cooldowns finaux des sorts).

## Règles retenues

- **On planifie au niveau maximum** : 26 points d'upgrade et 16 emplacements de jokers par porteur, tous les sorts
  et tous les jokers Unique disponibles.
- **Les jokers qu'on ne peut pas équiper au lobby sont exclus** : on garde seulement ceux dont `obtainable_from`
  contient `shop`, `gamba` ou `challenge`. Le filtre se fait dans le planificateur, pas dans `data/`, pour qu'un
  joker devenu achetable apparaisse après un `bin/update-data`.
- Les règles de progression (barème des emplacements, points par niveau, boutique de prestige) sont regroupées dans
  un seul fichier de configuration, chacune marquée confirmée ou supposée.

## Sauvegarde et partage

- Les builds sont sauvegardés dans le **localStorage** du navigateur : une liste de builds nommés (ouvrir,
  dupliquer, supprimer).
- Boutons **Exporter / Importer** : le build est un JSON encodé en base64, avec un préfixe (`FFW1:…`).
- Le JSON contient un **numéro de version de format** (`"v": 1`), pour pouvoir convertir les anciens builds.
- Les objets sont identifiés **par leur nom** (celui du wiki).
- Encodage base64 en UTF-8 (`TextEncoder`), pas `btoa()` directement, qui plante sur les caractères accentués.
- À l'import, le build est validé avec les mêmes règles que dans l'éditeur. Un build invalide, ou qui contient un
  nom inconnu (joker renommé ou supprimé par un patch), s'importe quand même avec des avertissements.

## Questions ouvertes (à vérifier en jeu)

1. **Le coût des jokers Unique** : wiki.gg et wikily.gg se contredisent sur 15 d'entre eux (voir
   `docs/game-mechanics.md`). C'est la question la plus urgente, puisque la validation du budget en dépend. Cas
   faciles à vérifier : Ultra Draw (7 selon wikily ?) et Eco Trick (2 ?). Si wikily a raison, il faudra corriger
   `scripts/build_data.py` (ou le wiki), sans recopier les données de wikily. Même chose pour les copies maximum de
   Bouncing Ball et Clutch, et pour Explosive Hits (un joker ou quatre).
2. **Lazy et Medicard** : s'achètent-ils au Dr. Spark-Twist's Lab ? Le wiki ne leur donne ni source ni prix.
   Exclus par défaut.
3. **Le barème des emplacements de jokers depuis le patch 644** : combien d'emplacements au niveau 1, et à quels
   niveaux se débloquent les suivants entre 1 et 100 ? Nécessaire pour le niveau minimum.
4. **Les bonus de prestige s'appliquent-ils tout de suite ?** Les emplacements et points achetés sont-ils utilisables
   dès le niveau 1, ou relèvent-ils seulement le plafond qu'il faut atteindre en montant de niveau ?
5. **Le déblocage des sorts** (niveaux 1, 4, 12, 20, 35) dépend-il du niveau du héros ou d'un niveau de sorts propre ?
   Une discussion Steam parle de « spells max level » à part du héros, ce qui pencherait pour un niveau de sorts.
6. **Le niveau du héros limite-t-il les raretés de jokers achetables ?** Les guides se contredisent (pool complet au
   niveau 40 ou 50) et le wiki n'a pas de valeur.
7. **Les niveaux des jokers Unique** (35/55 pour les armes principales, 30/40 pour les sidearms) sont-ils toujours
   valables depuis le patch 644 ?

## Existant

wikily.gg propose déjà un build planner pour Far Far West (jokers par porteur, upgrades, sorts, prestige, partage
de builds en ligne). À regarder avant de commencer, pour voir ce qu'il fait bien et ce qu'il fait moins bien.
