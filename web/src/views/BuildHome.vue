<script setup lang="ts">
// Home of a build: one plank per part of the build, and where the game shows the character, a summary (spells, utility,
// and per carrier its level, prestiges, jokers and upgrades at a glance) followed by the problems. A click on the
// summary opens the full sheet of the build (SummaryView).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CARRIERS } from '@/domain/build'
import { HERO_ID } from '@/domain/gameData'
import { spellKeys } from '@/i18n'
import { problemRoute, useProblemText } from '@/i18n/problems'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import { spellColor } from '@/ui/colors'
import CarrierOverview from '@/components/CarrierOverview.vue'
import WoodPlank from '@/components/WoodPlank.vue'

const { t, locale } = useI18n()
const store = useBuildStore()
const language = useLanguageStore()
const { problemText } = useProblemText()

const build = computed(() => store.build)
const errors = computed(() => store.problems.filter((p) => p.severity === 'error'))
const anyAssumed = computed(() => CARRIERS.some((c) => store.requirements[c].assumed))
const keys = computed(() => spellKeys(locale.value))

function onRename(event: Event) {
  store.rename((event.target as HTMLInputElement).value)
}
</script>

<template>
  <main class="page home">
    <section class="loadout">
      <label class="build-name">
        <span class="sr-only">{{ t('home.rename') }}</span>
        <input :value="build.name" :placeholder="t('home.untitled')" maxlength="60" @change="onRename" />
        <span aria-hidden="true">✎</span>
      </label>

      <nav class="planks">
        <WoodPlank :to="{ name: 'customize', params: { carrier: 'hero' } }">
          <template #icon><img :src="iconUrl(HERO_ID)" alt="" /></template>
          {{ t('game.hero') }}
        </WoodPlank>

        <WoodPlank :to="{ name: 'pick', params: { slot: 'main' } }" :empty="!build.main.weapon">
          <template #icon><img v-if="build.main.weapon" :src="iconUrl(build.main.weapon)" alt="" /></template>
          {{ build.main.weapon ? language.gameName(build.main.weapon) : t('home.chooseMain') }}
        </WoodPlank>

        <WoodPlank :to="{ name: 'pick', params: { slot: 'sidearm' } }" :empty="!build.sidearm.weapon">
          <template #icon>
            <img v-if="build.sidearm.weapon" :src="iconUrl(build.sidearm.weapon)" alt="" />
            <img
              v-if="build.sidearm.element"
              :src="iconUrl(build.sidearm.element)"
              :alt="language.gameName(build.sidearm.element)"
              class="element"
            />
          </template>
          {{ build.sidearm.weapon ? language.gameName(build.sidearm.weapon) : t('home.chooseSidearm') }}
        </WoodPlank>

        <WoodPlank :to="{ name: 'spells' }" :empty="build.spells.every((s) => !s)">
          <template #icon>
            <template v-for="(spell, slot) in build.spells" :key="slot">
              <img v-if="spell" :src="iconUrl(spell)" :alt="language.gameName(spell)" class="spell" />
              <span v-else class="spell empty-slot" />
            </template>
          </template>
          {{ build.spells.every((s) => !s) ? t('home.chooseSpells') : t('game.spells') }}
        </WoodPlank>

        <WoodPlank :to="{ name: 'pick', params: { slot: 'utility' } }" :empty="!build.utility">
          <template #icon><img v-if="build.utility" :src="iconUrl(build.utility)" alt="" /></template>
          {{ build.utility ? language.gameName(build.utility) : t('home.chooseUtility') }}
        </WoodPlank>
      </nav>
    </section>

    <aside class="summary">
      <!-- Its ::after covers the whole block: a click opens the summary sheet, except on a problem's link. -->
      <h2>
        <RouterLink :to="{ name: 'summary' }" class="open-summary">{{ t('home.summary') }} <span aria-hidden="true">›</span></RouterLink>
      </h2>
      <div v-if="build.utility || build.spells.some((s) => s)" class="glance">
        <span
          v-for="(spell, slot) in build.spells"
          :key="slot"
          class="chip"
          :style="{ '--school': spell ? spellColor(spell) : undefined }"
        >
          <kbd>{{ keys[slot] }}</kbd>
          <img v-if="spell" :src="iconUrl(spell)" alt="" />
          <span v-else class="chip-empty" />
          <template v-if="spell">{{ language.gameName(spell) }}</template>
        </span>
        <span v-if="build.utility" class="chip">
          <img :src="iconUrl(build.utility)" alt="" />{{ language.gameName(build.utility) }}
        </span>
      </div>
      <CarrierOverview
        v-for="carrier in CARRIERS"
        :key="carrier"
        :build="build"
        :carrier="carrier"
        :requirements="store.requirements[carrier]"
      />

      <h3 :class="{ ok: !store.problems.length, bad: errors.length }">
        {{ store.problems.length ? `⚠ ${t('home.problems', store.problems.length)}` : `✔ ${t('home.complete')}` }}
      </h3>
      <ul class="problems">
        <li v-for="(problem, index) in store.problems" :key="index" :class="problem.severity">
          <RouterLink :to="problemRoute(build, problem)">{{ problemText(build, problem) }}</RouterLink>
        </li>
      </ul>

      <p v-if="anyAssumed" class="assumed"><span class="assumed-mark">*</span> {{ t('home.assumed') }}</p>
    </aside>
  </main>
</template>

<style scoped>
.home {
  display: grid;
  gap: 2rem 4rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  padding-top: 2.5rem;
}
.build-name {
  align-items: baseline;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.build-name input {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  font-family: var(--font-title);
  font-size: clamp(2rem, 5vw, 3.75rem);
  font-weight: 700;
  min-width: 0;
  text-transform: uppercase;
  /* Shrinks to the name (or the placeholder), so the pencil stays next to it. Browsers without field-sizing
     keep a fixed width. */
  field-sizing: content;
  max-width: 100%;
}
.build-name input:hover,
.build-name input:focus {
  border-bottom-color: var(--line);
  outline: none;
}
.build-name input::placeholder {
  color: var(--text);
  opacity: 0.85;
}
.build-name span {
  color: var(--text-muted);
  font-size: 1.5rem;
}
/* Planks staggered like in the game. */
.planks {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 34rem;
}
.planks > :nth-child(2),
.planks > :nth-child(4) {
  margin-left: 1.5rem;
}
.planks > :nth-child(3) {
  margin-left: 3rem;
}
.element {
  align-self: center;
  height: 1.8rem !important;
  width: 1.8rem !important;
}
.spell {
  height: 2.4rem !important;
  width: 2.4rem !important;
}
.empty-slot {
  border: 2px dashed rgb(43 33 27 / 45%);
  border-radius: 50%;
  display: block;
}
.summary {
  align-self: start;
  background: var(--panel);
  border-top: 3px solid var(--accent);
  margin-top: 1rem;
  padding: 1.25rem 1.5rem;
  position: relative;
}
.summary:has(.open-summary:hover, .open-summary:focus-visible) {
  background: rgb(255 255 255 / 6%);
  box-shadow: 0 0 0 2px var(--accent);
}
.open-summary {
  text-decoration: none;
}
.open-summary::after {
  content: '';
  inset: 0;
  position: absolute;
}
.open-summary:focus-visible {
  outline: none;
}
.summary h2 {
  color: var(--accent);
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
}
.glance {
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding-bottom: 0.7rem;
}
.chip {
  align-items: center;
  background: rgb(0 0 0 / 30%);
  border: 1px solid color-mix(in srgb, var(--school, var(--plank)) 45%, transparent);
  border-radius: 20px;
  display: inline-flex;
  font-family: var(--font-title);
  font-size: 0.85rem;
  gap: 0.3rem;
  padding: 0.1rem 0.55rem 0.1rem 0.2rem;
  text-transform: uppercase;
}
.chip img,
.chip-empty {
  height: 1.5rem;
  width: 1.5rem;
}
.chip-empty {
  border: 2px dashed var(--line);
  border-radius: 50%;
}
kbd {
  background: rgb(0 0 0 / 45%);
  border: 1px solid var(--line);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.72rem;
  margin-left: 0.15rem;
  padding: 0 0.3rem;
}
.summary h3 {
  font-size: 1.25rem;
  margin: 1.5rem 0 0.5rem;
}
.summary h3.ok {
  color: #8fd16a;
}
.summary h3.bad {
  color: var(--danger);
}
.problems {
  margin: 0;
  padding-left: 1.2rem;
}
.problems li {
  margin: 0.3rem 0;
}
.problems .error {
  color: var(--danger);
}
.problems .incomplete {
  color: var(--text-muted);
}
.problems a {
  position: relative;
  z-index: 1;
}
.problems a:hover {
  color: var(--accent);
}
.assumed {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 1.25rem 0 0;
}
.assumed-mark {
  color: var(--accent);
}
.sr-only {
  clip: rect(0 0 0 0);
  height: 1px;
  overflow: hidden;
  position: absolute;
  width: 1px;
}
@media (max-width: 56rem) {
  .home {
    grid-template-columns: minmax(0, 1fr);
    padding-top: 1.25rem;
  }
  .planks > * {
    margin-left: 0 !important;
  }
}
</style>
