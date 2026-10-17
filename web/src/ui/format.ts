// Number formats shared by several screens.
import type { Upgrade } from '@/domain/gameData'

/** Total bonus of an upgrade for a number of points, as in the game: +30 (flat) or +40% (a fraction). */
export function upgradeBonus(upgrade: Upgrade, points: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: upgrade.flat ? 'decimal' : 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 2,
  }).format(points * upgrade.value)
}
