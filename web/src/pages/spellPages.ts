// Spell pages: the 6 schools with their spells, and one page per school (spells, cooldowns, Mastery joker).
import { spellCooldown, spells, spellSchools, type SpellSchool } from '@/domain/gameData'
import { RULES } from '@/domain/rules'
import { SCHOOL_COLORS } from '@/ui/colors'
import type { Context, Page } from './context'
import { html } from './html'
import { masteryJoker, masteryUnlock } from './jokerPages'
import { gameText, icon, itemLink, itemPath } from './parts'
import { slugify } from './routes'

function masteryLevel(): number {
  return masteryUnlock(masteryJoker(spellSchools[0].id)!)!.level
}

function cooldown(ctx: Context, spellId: string): string {
  const seconds = spellCooldown(spellId)
  return seconds === null ? '?' : ctx.t('seconds', { n: ctx.number(seconds) })
}

const spellsPage: Page = {
  path: 'spells/',
  render: (ctx) => ({
    title: ctx.t('spells.title', { schools: spellSchools.length, count: spells.length }),
    description: ctx.t('spells.description', { schools: spellSchools.length, count: spells.length }),
    heading: ctx.t('spells.heading'),
    crumbs: [],
    body: html`<p class="intro">${ctx.t('spells.intro', { level: masteryLevel() })}</p>
<ul class="cards schools">${spellSchools.map(
      (school) => html`
  <li style="--school: ${SCHOOL_COLORS[school.id]}">
    <a class="card" href="${ctx.href(itemPath(school.id))}">${icon(ctx, school.id, 'medium')}<span class="card-title">${ctx.name(school.id)}</span><span class="card-text">${gameText(ctx.description(school.id))}</span></a>
    <ul class="spell-list">${spells
      .filter((s) => s.school === school.id)
      .map(
        (s) => html`<li><a href="${ctx.href(itemPath(school.id))}#${slugify(s.name)}">${icon(ctx, s.id)}<span>${ctx.name(s.id)}</span></a> <span class="muted">${cooldown(ctx, s.id)}</span></li>`,
      )}</ul>
  </li>`,
    )}
</ul>
<p class="note">${ctx.t('spells.cooldownNote')}</p>`,
  }),
}

function schoolPage(school: SpellSchool): Page {
  return {
    path: itemPath(school.id),
    render: (ctx) => {
      const name = ctx.name(school.id)
      const schoolSpells = spells.filter((s) => s.school === school.id)
      const mastery = masteryJoker(school.id)!
      const isElement = (RULES.sidearmElements.value as readonly string[]).includes(school.id)
      return {
        title: ctx.t('school.title', { name, count: schoolSpells.length }),
        description: ctx.t('school.description', { name, count: schoolSpells.length }),
        heading: name,
        crumbs: [{ label: ctx.t('spells.heading'), path: 'spells/' }],
        body: html`
<div class="item-head">
  ${icon(ctx, school.id, 'large')}
  <div>
    <p class="effect">${gameText(ctx.description(school.id))}</p>
    ${isElement ? html`<p>${ctx.t('school.element', { name })}</p>` : ''}
  </div>
</div>
<div class="table-wrap"><table>
  <thead><tr><th>${ctx.t('spells.spell')}</th><th class="num">${ctx.t('spells.cooldown')}</th><th>${ctx.t('jokers.effect')}</th></tr></thead>
  <tbody>${schoolSpells.map(
    (s) => html`
    <tr id="${slugify(s.name)}"><td class="joker-name">${icon(ctx, s.id)}<span>${ctx.name(s.id)}</span></td><td class="num">${cooldown(ctx, s.id)}</td><td>${gameText(ctx.description(s.id))}</td></tr>`,
  )}
  </tbody>
</table></div>
<p class="note">${ctx.t('spells.cooldownNote')}</p>
<h2>${ctx.t('school.mastery')}</h2>
<p>${itemLink(ctx, mastery.id)}: ${gameText(ctx.description(mastery.id))}</p>
<h2>${ctx.t('school.others')}</h2>
<ul class="chips">${spellSchools.filter((s) => s.id !== school.id).map((s) => html`<li>${itemLink(ctx, s.id)}</li>`)}</ul>`,
      }
    },
  }
}

export const spellPages: Page[] = [spellsPage, ...spellSchools.map(schoolPage)]
