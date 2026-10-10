// Progression guide: joker slots by level, upgrade points, prestige shop and prestiges needed, from the planner's
// rules (src/domain/rules.ts).
import { equipment, jokers } from '@/domain/gameData'
import { uniqueUnlockLevel } from '@/domain/progression'
import { MAX_JOKER_SLOTS, MAX_UPGRADE_POINTS, RULES } from '@/domain/rules'
import type { Context, Page } from './context'
import { html } from './html'

function prestigesNeeded(slots: number, points: number): number {
  const tokens = slots * RULES.prestigeJokerSlot.value.cost + points * RULES.prestigeUpgradePoint.value.cost
  return Math.ceil(tokens / RULES.tokensPerPrestige.value)
}

/** Weapon levels unlocking the Unique jokers of main weapons or sidearms, e.g. "35 and 55". */
function uniqueLevels(ctx: Context, type: 'main' | 'sidearm'): string {
  const weapons = new Set(equipment.filter((e) => e.type === type).map((e) => e.id))
  const levels = jokers.filter((j) => weapons.has(j.available_on[0])).map(uniqueUnlockLevel)
  return ctx.list([...new Set(levels.filter((l) => l !== null))].sort((a, b) => a - b).map(String))
}

export const progressionPage: Page = {
  path: 'progression/',
  render: (ctx) => {
    const slotLevels = RULES.jokerSlotLevels.value
    const maxLevel = RULES.maxLevel.value
    const slotShop = RULES.prestigeJokerSlot.value
    const pointShop = RULES.prestigeUpgradePoint.value
    const fromLevels = RULES.upgradePointsFromLevels.value
    const range = (n: number) => Array.from({ length: n + 1 }, (_, i) => i)
    return {
      title: ctx.t('progression.title'),
      description: ctx.t('progression.description'),
      heading: ctx.t('progression.heading'),
      crumbs: [],
      body: html`<p class="intro">${ctx.t('progression.intro', { max: maxLevel })}</p>

<h2>${ctx.t('progression.slotsTitle')}</h2>
<p>${ctx.t('progression.slotsText', { fromLevels: slotLevels.length, max: slotLevels.at(-1)!, bought: slotShop.max, total: MAX_JOKER_SLOTS })}</p>
<div class="table-wrap"><table class="grid">
  <tr><th>${ctx.t('progression.slot')}</th>${slotLevels.map((_, i) => html`<td>${i + 1}</td>`)}</tr>
  <tr><th>${ctx.t('progression.level')}</th>${slotLevels.map((level) => html`<td>${level}</td>`)}</tr>
</table></div>

<h2>${ctx.t('progression.pointsTitle')}</h2>
<p>${ctx.t('progression.pointsText', {
        every: RULES.levelsPerUpgradePoint.value,
        fromLevels,
        level: fromLevels * RULES.levelsPerUpgradePoint.value,
        bought: pointShop.max,
        total: MAX_UPGRADE_POINTS,
      })}</p>

<h2>${ctx.t('progression.prestigeTitle')}</h2>
<p>${ctx.t('progression.prestigeText', { max: maxLevel, prestiges: RULES.maxPrestiges.value, tokens: RULES.tokensPerPrestige.value })}</p>
<div class="table-wrap"><table>
  <thead><tr><th>${ctx.t('progression.purchase')}</th><th class="num">${ctx.t('progression.cost')}</th><th class="num">${ctx.t('progression.maxPurchases')}</th></tr></thead>
  <tbody>
    <tr><td>${ctx.t('progression.jokerSlot')}</td><td class="num">${ctx.t('progression.tokens', { n: slotShop.cost })}</td><td class="num">${slotShop.max}</td></tr>
    <tr><td>${ctx.t('progression.upgradePoint')}</td><td class="num">${ctx.t('progression.tokens', { n: pointShop.cost })}</td><td class="num">${pointShop.max}</td></tr>
    <tr><td>${ctx.t('progression.resources')}</td><td class="num">${ctx.t('progression.token', { n: 1 })}</td><td class="num">${ctx.t('progression.unlimited')}</td></tr>
  </tbody>
</table></div>

<h2>${ctx.t('progression.neededTitle')}</h2>
<p>${ctx.t('progression.neededText', {
        tokens: RULES.tokensPerPrestige.value,
        slots: slotShop.max,
        points: pointShop.max,
        prestiges: prestigesNeeded(slotShop.max, pointShop.max),
      })}</p>
<div class="table-wrap"><table class="grid">
  <thead>
    <tr><th rowspan="2">${ctx.t('progression.slotsBought')}</th><th colspan="${pointShop.max + 1}">${ctx.t('progression.pointsBought')}</th></tr>
    <tr>${range(pointShop.max).map((p) => html`<th>${p}</th>`)}</tr>
  </thead>
  <tbody>${range(slotShop.max).map(
        (s) => html`
    <tr><th>${s}</th>${range(pointShop.max).map((p) => html`<td>${prestigesNeeded(s, p)}</td>`)}</tr>`,
      )}
  </tbody>
</table></div>
${RULES.prestigeBonusesUsableAtAnyLevel.status === 'assumed' ? html`<p class="note">${ctx.t('progression.assumed')}</p>` : ''}

<h2>${ctx.t('progression.uniqueTitle')}</h2>
<p>${ctx.t('progression.uniqueText', { main: uniqueLevels(ctx, 'main'), sidearm: uniqueLevels(ctx, 'sidearm') })}</p>
<p><a href="${ctx.href('weapons/')}">${ctx.t('nav.weapons')}</a> · <a href="${ctx.href('jokers/')}">${ctx.t('nav.jokers')}</a></p>`,
    }
  },
}
