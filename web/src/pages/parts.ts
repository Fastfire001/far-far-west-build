// Pieces shared by the content pages: URLs of each item, icons, joker tables.
import { HERO_ID, equipmentById, jokers, spellSchools, type Joker, type Rarity } from '@/domain/gameData'
import { RARITY_COLORS } from '@/ui/colors'
import type { Context } from './context'
import { html, type Html } from './html'
import { slugify } from './routes'

export const RARITIES: Rarity[] = ['Normal', 'Fine', 'Prime', 'Mythic', 'Legendary', 'Unique']

/** Path of an item's page, from its English name (see docs/build-planner.md, "Content pages"). */
export function itemPath(id: string): string {
  if (id === HERO_ID) return 'hero/'
  const item = equipmentById.get(id)
  if (item) return `${item.type === 'utility' ? 'utilities' : 'weapons'}/${slugify(item.name)}/`
  const school = spellSchools.find((s) => s.id === id)
  if (school) return `spells/${slugify(school.name)}/`
  const joker = jokers.find((j) => j.id === id)
  if (joker) return `jokers/${slugify(joker.name)}/`
  throw new Error(`no page for ${id}`)
}

/** Name of a carrier: the hero or a weapon. */
export function carrierName(ctx: Context, id: string): string {
  return id === HERO_ID ? ctx.game('hero') : ctx.name(id)
}

export function rarityName(ctx: Context, rarity: Rarity): string {
  return ctx.game(`rarity_${rarity.toLowerCase()}`)
}

export function icon(ctx: Context, id: string, size: 'small' | 'medium' | 'large' = 'small'): Html {
  return html`<img class="icon ${size}" src="${ctx.icon(id)}" alt="" loading="lazy" />`
}

/** Link to an item's page, with its icon. */
export function itemLink(ctx: Context, id: string): Html {
  return html`<a class="item-link" href="${ctx.href(itemPath(id))}">${icon(ctx, id)}<span>${carrierName(ctx, id)}</span></a>`
}

export function rarityBadge(ctx: Context, rarity: Rarity): Html {
  return html`<span class="rarity" style="--rarity: ${RARITY_COLORS[rarity]}">${rarityName(ctx, rarity)}</span>`
}

/** Text from the game, which may contain line breaks. */
export function gameText(text: string): Html {
  return html`<span class="game-text">${text.trim()}</span>`
}

/** Text on one line, for meta descriptions. */
export function plain(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** A game text used inside one of our sentences: on one line, ending with a full stop. */
export function sentence(text: string): string {
  const line = plain(text)
  return /[.!?。！？]$/.test(line) ? line : `${line}.`
}

/** Jokers that can be equipped in the lobby (the others only drop in missions). */
export function lobbyOnly(joker: Joker): boolean {
  return !(joker.can_be_bought || joker.can_be_gambled)
}

export function sortJokers(list: Joker[]): Joker[] {
  return [...list].sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) || a.name.localeCompare(b.name))
}

/** Table of jokers: name, slot cost, max copies, effect, and the carriers they fit if `withCarriers`. */
export function jokerTable(ctx: Context, list: Joker[], withCarriers = false): Html {
  return html`<div class="table-wrap"><table class="jokers">
  <thead><tr><th>${ctx.t('jokers.joker')}</th><th class="num">${ctx.t('jokers.cost')}</th><th class="num">${ctx.t('jokers.copies')}</th><th>${ctx.t('jokers.effect')}</th>${withCarriers ? html`<th>${ctx.t('jokers.on')}</th>` : ''}</tr></thead>
  <tbody>${list.map(
    (j) => html`
    <tr style="--rarity: ${RARITY_COLORS[j.rarity]}">
      <td class="joker-name"><a href="${ctx.href(itemPath(j.id))}">${icon(ctx, j.id)}<span>${ctx.name(j.id)}</span></a>${lobbyOnly(j) ? html` <span class="tag">${ctx.t('jokers.missionOnly')}</span>` : ''}</td>
      <td class="num">${j.slot_cost}</td>
      <td class="num">${j.max_equip}</td>
      <td>${gameText(ctx.description(j.id))}</td>
      ${withCarriers ? html`<td class="carriers">${ctx.list(j.available_on.map((id) => carrierName(ctx, id)))}</td>` : ''}
    </tr>`,
  )}
  </tbody>
</table></div>`
}

/** Jokers grouped by rarity, one table each. */
export function jokersByRarity(ctx: Context, list: Joker[], withCarriers = false, level = 2): Html {
  return html`${RARITIES.map((rarity) => {
    const group = sortJokers(list.filter((j) => j.rarity === rarity))
    if (group.length === 0) return ''
    const heading = html`${rarityBadge(ctx, rarity)} <span class="count">${group.length}</span>`
    return html`
<section class="rarity-group" id="${rarity.toLowerCase()}">
  ${level === 2 ? html`<h2>${heading}</h2>` : html`<h3>${heading}</h3>`}
  ${jokerTable(ctx, group, withCarriers)}
</section>`
  })}`
}
