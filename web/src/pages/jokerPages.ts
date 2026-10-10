// Joker pages: the list of all jokers, and one page per joker.
import { equipmentById, HERO_ID, jokers, type Joker } from '@/domain/gameData'
import { uniqueUnlockLevel } from '@/domain/progression'
import type { Context, Page } from './context'
import { html } from './html'
import { gameText, icon, itemLink, itemPath, jokersByRarity, lobbyOnly, plain, rarityBadge, rarityName, sentence, sortJokers } from './parts'

/** School whose level unlocks a Mastery joker (challengeLvl50Acid → itemAcid), with that level. */
const MASTERY_SCHOOLS: Record<string, string> = {
  Acid: 'itemAcid',
  Cactus: 'itemCactus',
  Elec: 'itemElec',
  Fire: 'itemFire',
  Frost: 'itemIce',
  Voodoo: 'itemVoodoo',
}

export function masteryUnlock(joker: Joker): { school: string; level: number } | null {
  const match = /^challengeLvl(\d+)(\w+)$/.exec(joker.unlocked_by ?? '')
  const school = match && MASTERY_SCHOOLS[match[2]]
  return school ? { school, level: Number(match[1]) } : null
}

const jokersPage: Page = {
  path: 'jokers/',
  render: (ctx) => ({
    title: ctx.t('jokers.title', { count: jokers.length }),
    description: ctx.t('jokers.description'),
    heading: ctx.t('jokers.heading'),
    crumbs: [],
    body: html`<p class="intro">${ctx.t('jokers.intro', { count: jokers.length })}</p>
${jokersByRarity(ctx, jokers, true)}`,
  }),
}

function unlockText(ctx: Context, joker: Joker): string | null {
  if (lobbyOnly(joker)) return ctx.t('joker.missionOnly')
  const level = uniqueUnlockLevel(joker)
  if (level) return ctx.t('joker.unlockUnique', { level, weapon: ctx.name(joker.available_on[0]) })
  const mastery = masteryUnlock(joker)
  if (mastery) return ctx.t('joker.unlockMastery', { level: mastery.level, school: ctx.name(mastery.school) })
  return joker.unlocked_by ? ctx.t('joker.unlockChallenge') : null
}

function jokerPage(joker: Joker): Page {
  return {
    path: itemPath(joker.id),
    render: (ctx) => {
      const name = ctx.name(joker.id)
      const unlock = unlockText(ctx, joker)
      const yesNo = (value: boolean) => ctx.t(value ? 'yes' : 'no')
      const others = sortJokers(jokers.filter((j) => j.rarity === joker.rarity && j.id !== joker.id))
      return {
        title: ctx.t('joker.title', { name }),
        description: plain(
          ctx.t('joker.description', {
            name,
            rarity: rarityName(ctx, joker.rarity),
            effect: sentence(ctx.description(joker.id)),
            cost: joker.slot_cost,
          }),
        ),
        heading: name,
        crumbs: [{ label: ctx.t('jokers.heading'), path: 'jokers/' }],
        body: html`
<div class="item-head">
  ${icon(ctx, joker.id, 'large')}
  <div>
    <p>${rarityBadge(ctx, joker.rarity)}</p>
    <p class="effect">${gameText(ctx.description(joker.id))}</p>
  </div>
</div>
<dl class="facts">
  <div><dt>${ctx.t('joker.cost')}</dt><dd>${joker.slot_cost}</dd></div>
  <div><dt>${ctx.t('joker.copies')}</dt><dd>${joker.max_equip}</dd></div>
  <div><dt>${ctx.t('joker.price')}</dt><dd>${joker.can_be_bought ? ctx.t('gold', { n: ctx.number(joker.buy_price) }) : '—'}</dd></div>
  <div><dt>${ctx.t('joker.gambled')}</dt><dd>${yesNo(joker.can_be_gambled)}</dd></div>
  <div><dt>${ctx.t('joker.drop')}</dt><dd>${yesNo(joker.can_drop_in_mission)}</dd></div>
</dl>
<h2>${ctx.t('joker.on')}</h2>
<ul class="chips">${joker.available_on.filter((id) => id === HERO_ID || equipmentById.has(id)).map((id) => html`<li>${itemLink(ctx, id)}</li>`)}</ul>
${unlock ? html`<h2>${ctx.t('joker.unlock')}</h2><p>${unlock}</p>` : ''}
<h2>${ctx.t('joker.others', { rarity: rarityName(ctx, joker.rarity) })}</h2>
<ul class="chips">${others.map((j) => html`<li>${itemLink(ctx, j.id)}</li>`)}</ul>`,
      }
    },
  }
}

export const jokerPages: Page[] = [jokersPage, ...jokers.map(jokerPage)]

/** Mastery joker of a spell school. */
export function masteryJoker(schoolId: string): Joker | undefined {
  return jokers.find((j) => masteryUnlock(j)?.school === schoolId)
}
