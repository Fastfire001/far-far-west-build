// Interface colours shared by several screens. Joker icons are white pictograms: the interface draws the colour of
// their rarity around them (card, slot circle).
import { spellById, type Rarity } from '@/domain/gameData'
import manualJson from '@data/manual.json'

export const RARITY_COLORS: Record<Rarity, string> = {
  Normal: '#8c7b5e',
  Fine: '#6a8a2b',
  Prime: '#2f6fae',
  Mythic: '#7b3fa3',
  Legendary: '#c9821a',
  Unique: '#a3232e',
}

/** Colour of each spell school in the game's menus, hand-entered in data/manual.json (also used by the icons). */
export const SCHOOL_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(manualJson.school_colors).filter(([id]) => !id.startsWith('_')),
)

/** Colour of a spell: the colour of its school. */
export function spellColor(spellId: string): string | undefined {
  const school = spellById.get(spellId)?.school
  return school ? SCHOOL_COLORS[school] : undefined
}
