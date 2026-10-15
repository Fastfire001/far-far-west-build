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
