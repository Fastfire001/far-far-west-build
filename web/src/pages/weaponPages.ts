// Equipment pages: the list of weapons and utilities, one page per weapon (and the hero) with its upgrades and
// jokers, one page per utility.
import { equipment, HERO_ID, jokers, upgrades, type Equipment } from '@/domain/gameData'
import { uniqueUnlockLevel } from '@/domain/progression'
import { MAX_UPGRADE_POINTS, RULES } from '@/domain/rules'
import { encodeShareCode } from '@/domain/codec'
import { emptyBuild, setUtility, setWeapon } from '@/domain/build'
import type { Context, Page } from './context'
import { html, type Html } from './html'
import { gameText, icon, itemLink, itemPath, jokersByRarity, plain, sentence, sortJokers } from './parts'

const weaponsPage: Page = {
  path: 'weapons/',
  render: (ctx) => {
    const section = (type: Equipment['type']) => html`
<section>
  <h2>${ctx.t(`weapons.${type}`)}</h2>
  <ul class="cards">${equipment
    .filter((e) => e.type === type)
    .map(
      (e) => html`
    <li><a class="card" href="${ctx.href(itemPath(e.id))}">${icon(ctx, e.id, 'medium')}<span class="card-title">${ctx.name(e.id)}</span><span class="card-text">${gameText(ctx.description(e.id))}</span></a></li>`,
    )}
  </ul>
</section>`
    const count = (type: Equipment['type']) => equipment.filter((e) => e.type === type).length
    return {
      title: ctx.t('weapons.title'),
      description: ctx.t('weapons.description', { main: count('main'), sidearms: count('sidearm'), utilities: count('utility') }),
      heading: ctx.t('weapons.heading'),
      crumbs: [],
      body: html`<p class="intro">${ctx.t('weapons.intro')}</p>
<section>
  <h2>${ctx.t('weapons.hero')}</h2>
  <ul class="cards"><li><a class="card" href="${ctx.href(itemPath(HERO_ID))}">${icon(ctx, HERO_ID, 'medium')}<span class="card-title">${ctx.game('hero')}</span><span class="card-text">${ctx.t('hero.intro')}</span></a></li></ul>
</section>
${section('main')}${section('sidearm')}${section('utility')}`,
    }
  },
}

function bonus(ctx: Context, value: number, flat: boolean): string {
  return ctx.number(value, { style: flat ? 'decimal' : 'percent', signDisplay: 'always', maximumFractionDigits: 2 })
}

/** Upgrades, Unique jokers and jokers of a carrier (the hero or a weapon). */
function loadoutSections(ctx: Context, carrier: string): Html {
  const carrierUpgrades = upgrades.filter((u) => u.available_on.includes(carrier))
  const carrierJokers = jokers.filter((j) => j.available_on.includes(carrier))
  const uniques = sortJokers(carrierJokers.filter((j) => uniqueUnlockLevel(j) !== null)).sort(
    (a, b) => uniqueUnlockLevel(a)! - uniqueUnlockLevel(b)!,
  )
  const fromLevels = RULES.upgradePointsFromLevels.value
  return html`
<h2>${ctx.t('weapon.upgrades')}</h2>
<p>${ctx.t('weapon.upgradesIntro', {
    points: MAX_UPGRADE_POINTS,
    fromLevels,
    level: fromLevels * RULES.levelsPerUpgradePoint.value,
    bought: RULES.prestigeUpgradePoint.value.max,
  })}</p>
<div class="table-wrap"><table>
  <thead><tr><th>${ctx.t('weapon.stat')}</th><th class="num">${ctx.t('weapon.perPoint')}</th><th class="num">${ctx.t('weapon.maxPoints')}</th><th class="num">${ctx.t('weapon.maxBonus')}</th></tr></thead>
  <tbody>${carrierUpgrades.map(
    (u) => html`
    <tr><td class="joker-name">${icon(ctx, u.id)}<span>${ctx.name(u.id)}</span></td><td class="num">${bonus(ctx, u.value, u.flat)}</td><td class="num">${u.max_slots}</td><td class="num">${bonus(ctx, u.value * u.max_slots, u.flat)}</td></tr>`,
  )}
  </tbody>
</table></div>
${uniques.length
  ? html`<h2>${ctx.t('weapon.unique')}</h2>
<p>${ctx.t('weapon.uniqueIntro')}</p>
<div class="table-wrap"><table>
  <thead><tr><th>${ctx.t('jokers.joker')}</th><th class="num">${ctx.t('weapon.level')}</th><th class="num">${ctx.t('jokers.cost')}</th><th>${ctx.t('jokers.effect')}</th></tr></thead>
  <tbody>${uniques.map(
    (j) => html`
    <tr><td class="joker-name"><a href="${ctx.href(itemPath(j.id))}">${icon(ctx, j.id)}<span>${ctx.name(j.id)}</span></a></td><td class="num">${uniqueUnlockLevel(j)}</td><td class="num">${j.slot_cost}</td><td>${gameText(ctx.description(j.id))}</td></tr>`,
  )}
  </tbody>
</table></div>`
  : ''}
<h2>${ctx.t('weapon.jokers', { count: carrierJokers.length })}</h2>
${jokersByRarity(ctx, carrierJokers, false, 3)}`
}

function weaponPage(weapon: Equipment): Page {
  return {
    path: itemPath(weapon.id),
    render: async (ctx) => {
      const name = ctx.name(weapon.id)
      const slot = weapon.type === 'main' ? 'main' : 'sidearm'
      // Share link of a build with this weapon equipped: opens the planner on it.
      const code = await encodeShareCode(setWeapon(emptyBuild(), slot, weapon.id))
      return {
        title: ctx.t('weapon.title', { name, type: ctx.t(weapon.type === 'main' ? 'weapon.typeMain' : 'weapon.typeSidearm') }),
        description: ctx.t('weapon.description', {
          name,
          upgrades: upgrades.filter((u) => u.available_on.includes(weapon.id)).length,
          jokers: jokers.filter((j) => j.available_on.includes(weapon.id)).length,
        }),
        heading: name,
        crumbs: [{ label: ctx.t('weapons.heading'), path: 'weapons/' }],
        body: html`
<div class="item-head">
  ${icon(ctx, weapon.id, 'large')}
  <div>
    <p class="effect">${gameText(ctx.description(weapon.id))}</p>
    <p><a class="plank-button" href="${ctx.planner(`/share/${code}`)}">${ctx.t('weapon.plan', { name })}</a></p>
  </div>
</div>
${weapon.type === 'sidearm'
  ? html`<h2>${ctx.t('weapon.elements')}</h2>
<p>${ctx.t('weapon.elementsIntro')}</p>
<ul class="chips">${RULES.sidearmElements.value.map((id) => html`<li>${itemLink(ctx, id)}</li>`)}</ul>`
  : ''}
${loadoutSections(ctx, weapon.id)}`,
      }
    },
  }
}

const heroPage: Page = {
  path: itemPath(HERO_ID),
  render: (ctx) => ({
    title: ctx.t('hero.title'),
    description: ctx.t('hero.description', {
      upgrades: upgrades.filter((u) => u.available_on.includes(HERO_ID)).length,
      jokers: jokers.filter((j) => j.available_on.includes(HERO_ID)).length,
    }),
    heading: ctx.game('hero'),
    crumbs: [{ label: ctx.t('weapons.heading'), path: 'weapons/' }],
    body: html`
<div class="item-head">
  ${icon(ctx, HERO_ID, 'large')}
  <div>
    <p class="effect">${ctx.t('hero.intro')}</p>
    <p><a class="plank-button" href="${ctx.planner('/customize/hero')}">${ctx.t('nav.planner')}</a></p>
  </div>
</div>
${loadoutSections(ctx, HERO_ID)}`,
  }),
}

function utilityPage(utility: Equipment): Page {
  return {
    path: itemPath(utility.id),
    render: async (ctx) => {
      const name = ctx.name(utility.id)
      const code = await encodeShareCode(setUtility(emptyBuild(), utility.id))
      return {
        title: ctx.t('utility.title', { name }),
        description: plain(ctx.t('utility.description', { name, effect: sentence(ctx.description(utility.id)) })),
        heading: name,
        crumbs: [{ label: ctx.t('weapons.heading'), path: 'weapons/' }],
        body: html`
<div class="item-head">
  ${icon(ctx, utility.id, 'large')}
  <div>
    <p class="effect">${gameText(ctx.description(utility.id))}</p>
    <p>${ctx.t('utility.intro')}</p>
    <p><a class="plank-button" href="${ctx.planner(`/share/${code}`)}">${ctx.t('weapon.plan', { name })}</a></p>
  </div>
</div>
<h2>${ctx.t('utility.others')}</h2>
<ul class="chips">${equipment
  .filter((e) => e.type === 'utility' && e.id !== utility.id)
  .map((e) => html`<li>${itemLink(ctx, e.id)}</li>`)}</ul>`,
      }
    },
  }
}

export const weaponPages: Page[] = [
  weaponsPage,
  heroPage,
  ...equipment.filter((e) => e.type !== 'utility').map(weaponPage),
  ...equipment.filter((e) => e.type === 'utility').map(utilityPage),
]
