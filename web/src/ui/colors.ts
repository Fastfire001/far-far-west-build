// Interface colours shared by several screens. Rarity and school colours mirror those of the generated icons
// (RARITY_COLORS and SCHOOL_COLORS in scripts/build_icons.py): keep them in sync.
import type { Rarity } from '@/domain/gameData'

export const RARITY_COLORS: Record<Rarity, string> = {
  Normal: '#8c7b5e',
  Fine: '#6a8a2b',
  Prime: '#2f6fae',
  Mythic: '#7b3fa3',
  Legendary: '#c9821a',
  Unique: '#a3232e',
}

export const SCHOOL_COLORS: Record<string, string> = {
  itemFire: '#e2531d',
  itemElec: '#e0a91f',
  itemAcid: '#8cbf26',
  itemVoodoo: '#8b4bb8',
  itemCactus: '#2f8a4c',
  itemIce: '#4fb6de',
}

// Band colour of each stat on the customize screen, like the game's (damage red, reload blue...). Decoration only:
// an upgrade missing here gets the default.
const UPGRADE_COLORS: [RegExp, string][] = [
  [/Damage/, '#d8343a'],
  [/Firerate/, '#e9b21b'],
  [/ClipSize|TotalAmmoBag/, '#a53fd6'],
  [/ReloadSpeed|SpellCooldownReduction/, '#2f8fd8'],
  [/Lifesteal|Heal$/, '#6cbf2a'],
  [/DrawSpeed|Boomerang|SherrifStar/, '#1fb5a4'],
  [/Accuracy|MeleeRange/, '#e07a22'],
  [/HeroSpeed/, '#e9c21b'],
  [/JumpHeight/, '#8fcf3a'],
]

export function upgradeColor(id: string): string {
  return UPGRADE_COLORS.find(([pattern]) => pattern.test(id))?.[1] ?? '#b4842b'
}
