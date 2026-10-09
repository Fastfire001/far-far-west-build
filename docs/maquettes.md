# Maquettes du planificateur

Maquettes ASCII de l'interface, validées le 2026-10-09. Elles reprennent l'UX des menus du jeu
(planches de bois, barres d'upgrade, cartes de jokers, écoles de sorts), sans le personnage ni les modèles 3D : là où
le jeu les affiche, le planificateur montre des informations utiles au build.

Notre barre de menu est présente sur tous les écrans ; sous elle, un bouton « ◀ RETOUR » ramène à l'écran précédent,
comme dans le jeu.

## Barre de menu

Bureau :

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Jeu v0.2.0.20 · données du 07/10/2026   FAR FAR WEST — BUILD PLANNER   [Français ▾] [Builds ▾] │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Menus déroulants ouverts (un seul à la fois en vrai) :

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Jeu v0.2.0.20 · données du 07/10/2026   FAR FAR WEST — BUILD PLANNER   [Français ▾] [Builds ▾] │
└──────────────────────────────────────────────────────────────────────────┬───────────┬───────┘
                                                                           │ Deutsch   │ ┌──────────────────┐
                                                                           │ English   │ │ (bientôt)        │
                                                                           │ Español   │ │ Nouveau build    │
                                                                           │ Español   │ │ Mes builds…      │
                                                                           │  (LatAm)  │ │ Importer…        │
                                                                           │ ✓Français │ │ Exporter…        │
                                                                           │ Italiano  │ └──────────────────┘
                                                                           │ 日本語     │
                                                                           │ 한국어     │
                                                                           │ …         │
                                                                           └───────────┘
```

Mobile :

```
┌──────────────────────────────────────┐
│ FAR FAR WEST — BUILD PLANNER         │
│ v0.2.0.20 · 07/10/2026  [FR ▾] [☰]  │
└──────────────────────────────────────┘
```

- À gauche : la version du jeu dont les données sont extraites et la date d'extraction (au format de la langue
  choisie). Elles viendront d'un `data/meta.json` écrit par `bin/extract-game` (version lue dans les propriétés de
  `FarFarWest.exe`).
- Au centre : le titre.
- À droite : la langue, chaque langue écrite dans sa propre langue (« Deutsch », « 日本語 ») ; le code court sur
  mobile. Puis le menu des builds, présent mais désactivé tant que la sauvegarde n'est pas faite.

## 1. Accueil d'un build (« Équipement » dans le jeu)

```
│ ◀ RETOUR                                                                                     │
│                                                                                              │
│     MON BUILD ✎                                     RÉSUMÉ                                   │
│                                                                                              │
│    ╔═══════════════════════════════╗                Personnage       Niv. 40  · 0 prestige   │
│    ║ [icône]        PERSONNAGE     ║                Quad Barillet    Niv. 58  · 2 prestiges  │
│    ╚═══════════════════════════════╝                Revolver (Pyro)  Niv. 100 · 5 prestiges  │
│      ╔═══════════════════════════════╗                                                       │
│      ║ [icône]     QUAD BARILLET     ║              ⚠ 2 problèmes                            │
│      ╚═══════════════════════════════╝                · Revolver : 18/16 emplacements        │
│        ╔═══════════════════════════════╗              · Aucun utilitaire choisi              │
│        ║ [icône] REVOLVER  [🔥]        ║                                                       │
│        ╚═══════════════════════════════╝            ⓘ prestiges : règle supposée             │
│      ╔═══════════════════════════════╗                                                       │
│      ║ [●][●][○]         SORTS       ║                                                       │
│      ╚═══════════════════════════════╝                                                       │
│    ╔════════════════════════════════╗                                                        │
│    ║ [icône]  CHOISIR UN UTILITAIRE ║   ← vide : texte en gris                               │
│    ╚════════════════════════════════╝                                                        │
```

- Cinq planches de bois décalées, comme dans le jeu, chacune avec son icône : personnage, arme principale, arme
  secondaire (avec son élément), sorts, utilitaire.
- Une planche vide affiche « CHOISIR UNE ARME PRINCIPALE », « CHOISIR UN UTILITAIRE »… (un nouveau build est vide).
- À la place du personnage : un résumé, avec le niveau minimum et les prestiges par porteur, puis les problèmes de
  validation. Cliquer sur un problème mène à l'écran concerné.
- Le personnage mène directement à l'écran « Personnaliser » (3) ; les armes et l'utilitaire au choix d'objet (2) ;
  les sorts à l'écran des sorts (5).

## 2. Choix d'une arme ou de l'utilitaire

```
│ ◀ RETOUR                                                                                     │
│                                                                                              │
│    ╔═══════════════════════════════╗                                                         │
│    ║ [icône]   QUAD BARILLET    ✔  ║  ← équipée                                              │
│    ╚═══════════════════════════════╝                  [ grande icône de l'arme ]             │
│    ╔═══════════════════════════════╗                                                         │
│    ║ [icône]      LONG RANGER      ║  ← sélectionnée (surbrillance)                          │
│    ╚═══════════════════════════════╝                      LONG RANGER                        │
│    ╔═══════════════════════════════╗           Description du jeu, centrée,                  │
│    ║ [icône]        MINIGUN        ║           sur deux ou trois lignes.                     │
│    ╚═══════════════════════════════╝                                                         │
│      … (7 armes / 6 sidearms / 4 utilitaires)        [ ÉQUIPER ]   [ 🔧 PERSONNALISER ]       │
│                                                ⓘ Changer d'arme vide ses jokers et upgrades  │
```

- Arme équipée : « ÉQUIPER » est grisé (« DÉJÀ ÉQUIPÉE »), « PERSONNALISER » est actif.
- Autre arme : « ÉQUIPER » la remplace et vide les jokers et les upgrades du porteur ; le rappel s'affiche sous les
  boutons si l'arme actuelle en a. « PERSONNALISER » l'équipe puis ouvre sa page.
- Utilitaire : pas de bouton « PERSONNALISER » (ni joker ni upgrade).

## 3. Personnaliser (personnage, arme principale, arme secondaire)

```
│ ◀ RETOUR                                                                                     │
│                                                                                              │
│  REVOLVER                  Niv. min. 100 · 5 prestiges ⓘ                                     │
│  ═════════════════════════════════════════════════════      JOKERS                           │
│  Emplacements d'amélioration  ||||||||||||||||||||||░░░░ 22/26                               │
│  ┌──────────────────────────────────────────────────────┐   (●)━(●)  (●)━(●)                 │
│  │▌[ic] Dégâts               +40%  ◀ ||||||||         ▶ │    ┃                               │
│  │▌[ic] Vitesse d'attaque    +20%  ◀ ||||░░░░░░░░░░░░ ▶ │   (●)━(●)  (●)                      │
│  │▌[ic] Taille du chargeur   +30%  ◀ |||░░░░░░░░░░░░░ ▶ │                                     │
│  │▌[ic] Vitesse de recharg.   +0%  ◀ ░░░░░░░░░░░░░░░░ ▶ │   (●)━(●)  ( + )  ← libre           │
│  │▌[ic] Vol de vie            +5%  ◀ |||||            ▶ │                                     │
│  │▌[ic] Vitesse de dégainage  +0%  ◀ ░░░              ▶ │   (58)     (70)   ← débloqué au     │
│  └──────────────────────────────────────────────────────┘                    niveau 58, 70…  │
│  ═════════════════════════════════════════════════════      (84)     (100)                   │
│  Dégâts élémentaires          (💧) (⚡) [🔥] (❄)                                              │
│  ═════════════════════════════════════════════════════      (P)      (P)   ← achetés au      │
│  PROGRESSION REQUISE                                                         prestige        │
│   Upgrades : 22 points → niveau 40 + 1 prestige (2 points)                                   │
│   Jokers   : 16 emplacements → niveau 100 + 2 prestiges                                      │
│   Unique   : FANNING ACE → niveau 40                                                         │
│   ⚠ règle supposée : bonus de prestige utilisables dès le niveau 1 ?                         │
```

- Upgrades comme dans le jeu : bandeau coloré par stat, valeur cumulée, flèches ◀ ▶, barre aussi longue que le
  maximum de points de la stat. Compteur sur 26 points (20 par les niveaux, 6 au prestige).
- Retiré du jeu : « Confirmer pour X or » (l'or est hors périmètre). Le bloc « Prestige » du jeu devient le détail du
  calcul de progression.
- Jokers à droite, en deux colonnes de cercles : un joker occupe autant de cercles que son coût, reliés entre eux
  comme dans le jeu ; un cercle verrouillé affiche le niveau qui le débloque ; les 2 derniers (P) sont les
  emplacements achetés au prestige. Cliquer sur un cercle ouvre l'écran des jokers (4).
- « Dégâts élémentaires » : arme secondaire uniquement (Acide, Elec, Pyro, Frost).
- Personnage : même écran, sans la ligne « Dégâts élémentaires ».

## 4. Jokers

```
│ ◀ RETOUR                                                                                     │
│                                    JOKERS — REVOLVER                         (●)━(●)         │
│   [TOUT]   [NORMAL] [BON] [SUPÉRIEUR] [MYTHIQUE] [LÉGENDAIRE]   [UNIQUE]      ┃              │
│   🔍 [ dégâts, recharge…          ]                                          (●)━(●)         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                                         │
│  │ •    x2 │  │ ••      │  │ •••• x1 │  │ •       │                          (●)  (+)        │
│  │TONIFIANT│  │CRACKSHOT│  │FANNING  │  │DENT EN  │                                          │
│  │  [ic]   │  │  [ic]   │  │ACE [ic] │  │OR  [ic] │                          (+)  (+)        │
│  │+5% vit. │  │+7% dég. │  │ …       │  │+10% de  │                                          │
│  │d'attaque│  │         │  │🔓 Niv.40│  │chances… │                          (58) (70)       │
│  │Max 2    │  │Max 2    │  │Max 1    │  │Max 10   │                                          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                          (84) (100)      │
│   équipé ×2    gris : pas    équipé ×1    gris            ⛔ ne rentre pas :                  │
│   (lumineux)   équipé                                     cadre rouge, non cliquable         │
│                                                                              (P)  (P)        │
│                                                                    Emplacements : 13/16      │
```

- Filtres par rareté, comme dans le jeu, avec les noms de rareté du jeu (Bon, Supérieur…). En plus du jeu : un
  champ de recherche sur le nom et la description, dans la langue choisie (65 jokers pour le personnage).
- Cartes au format du jeu : points de coût en haut, « ×N » si équipée, nom, icône, description, « Max N ». On ajoute la
  niveau d'arme qui débloque les jokers Unique (🔓). Les autres jokers sont considérés comme débloqués.
- Cliquer sur une carte de la liste ajoute un exemplaire s'il reste de la place ; cliquer sur un joker de la colonne
  de droite le retire.
- Une carte qui ne rentre pas (trop chère, ou déjà au maximum de copies) a un cadre rouge et n'est pas cliquable.

## 5. Sorts

```
│ ◀ RETOUR                                                                                     │
│                                                                                              │
│  [🔥]   PYRO                                                                 [Fireball]      │
│  (⚡)   Offensif - Brûlez les ennemis et embrasez le sol                       BOULE DE FEU   │
│  (💧)  ┌──────────────────────────────────────────────────────────────┐          [A]         │
│  (🎭)  │▌[ic] BOULE DE FEU ✔   Lancez une boule de feu qui explose…   │                       │
│  (🌵)  │ [ic] RAYON DE FEU     Déchaînez un immense rayon de feu…     │       ┏━━━━━━━┓        │
│  (❄)   │ [ic] SURCHAUFFE       Brûlez tous les ennemis dans une…      │       ┃ vide  ┃ ← en   │
│        │ [ic] FEU FOLLET       Invoquez un feu follet qui…            │       ┗━━━━━━━┛ surbr. │
│        │ [ic] DOIGTS PISTOLETS Remplacez votre arme par des doigts…   │          [E]         │
│        └──────────────────────────────────────────────────────────────┘                       │
│                                                                              [Geyser]        │
│                                                                               GEYSER         │
│                                                                                [C]           │
```

- Les 6 écoles à gauche ; les 5 sorts de l'école choisie au milieu.
- Cliquer sur un sort met en surbrillance les 3 emplacements de droite ; cliquer ensuite sur un emplacement y place
  le sort (en remplaçant celui qui y était).
- Cliquer sur un emplacement occupé le vide.
- Un sort déjà équipé est marqué ✔ dans la liste ; le choisir de nouveau le déplace (jamais de doublon).
- Touches sous les emplacements, comme le jeu selon le clavier : [A] [E] [C] en français (AZERTY), [Q] [E] [C] dans
  les autres langues.
- Retirés du jeu : niveau de l'école, niveau de déblocage et cooldown des sorts (absents de nos données : Blueprints
  illisibles).
