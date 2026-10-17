<script setup lang="ts">
// Summary of a build: a sheet with everything needed to make the build in the game, laid out to fit in one screenshot
// (name, spells, utility, then one column per carrier with its jokers and upgrades). Display only: nothing on the sheet
// is clickable, the build is edited from its home.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CARRIERS } from '@/domain/build'
import { gameMeta, spellById, spellCooldown } from '@/domain/gameData'
import { spellKeys } from '@/i18n'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import { SCHOOL_COLORS } from '@/ui/colors'
import BackButton from '@/components/BackButton.vue'
import CarrierSummary from '@/components/CarrierSummary.vue'

const { t, locale } = useI18n()
const store = useBuildStore()
const language = useLanguageStore()

const build = computed(() => store.build)
const anyAssumed = computed(() => CARRIERS.some((c) => store.requirements[c].assumed))
const keys = computed(() => spellKeys(locale.value))

const extractedOn = computed(() =>
  new Intl.DateTimeFormat(language.locale, { dateStyle: 'short' }).format(new Date(`${gameMeta.extracted_on}T00:00:00`)),
)
// Where the planner is, so that whoever sees a screenshot can find it.
const siteAddress = `${location.host}${import.meta.env.BASE_URL}`.replace(/\/$/, '')

function spellColor(spell: string) {
  const school = spellById.get(spell)?.school
  return school ? SCHOOL_COLORS[school] : undefined
}
</script>

<template>
  <main class="page summary">
    <BackButton class="back" />
    <article class="sheet">
      <header class="top">
        <h1 class="build-name">{{ build.name || t('home.untitled') }}</h1>

        <div class="loadout">
          <div class="part">
            <small>{{ t('game.spells') }}</small>
            <span class="spells">
              <span
                v-for="(spell, slot) in build.spells"
                :key="slot"
                class="spell"
                :class="{ empty: !spell }"
                :style="{ '--school': spell ? spellColor(spell) : undefined }"
              >
                <kbd>{{ keys[slot] }}</kbd>
                <img v-if="spell" :src="iconUrl(spell)" alt="" />
                <span v-else class="empty-slot" />
                <span v-if="spell" class="spell-name">
                  {{ language.gameName(spell) }}
                  <small v-if="spellCooldown(spell) !== null">{{ t('home.cooldown', { sec: spellCooldown(spell) }) }}</small>
                </span>
              </span>
            </span>
          </div>

          <div class="part">
            <small>{{ t('game.utility') }}</small>
            <span class="utility" :class="{ empty: !build.utility }">
              <img v-if="build.utility" :src="iconUrl(build.utility)" alt="" />
              {{ build.utility ? language.gameName(build.utility) : t('game.empty') }}
            </span>
          </div>
        </div>
      </header>

      <div class="carriers">
        <CarrierSummary
          v-for="carrier in CARRIERS"
          :key="carrier"
          :build="build"
          :carrier="carrier"
          :requirements="store.requirements[carrier]"
        />
      </div>

      <footer class="sheet-footer">
        <span>
          {{ t('menu.versionShort', { version: gameMeta.game_version, date: extractedOn }) }} ·
          {{ t('home.slotLegend') }}
          <template v-if="anyAssumed">
            · <span class="assumed-mark">*</span> {{ t('home.assumed') }}
          </template>
        </span>
        <span class="site">{{ siteAddress }}</span>
      </footer>
    </article>
  </main>
</template>

<style scoped>
.summary {
  display: grid;
  gap: 1rem;
}
.sheet {
  background:
    radial-gradient(ellipse at 30% 10%, rgb(255 255 255 / 5%), transparent 60%),
    var(--bg);
  border: 1px solid var(--line);
  box-shadow: 0 10px 40px rgb(0 0 0 / 35%);
  font-variant-numeric: tabular-nums;
  padding: 1.25rem 1.5rem 0.9rem;
}
.top {
  align-items: end;
  border-bottom: 2px solid var(--accent);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  justify-content: space-between;
  padding-bottom: 1rem;
}
.build-name {
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.loadout {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
}
.part {
  display: grid;
  gap: 0.3rem;
}
.part > small {
  color: var(--text-muted);
  font-family: var(--font-title);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.spells {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.spell {
  align-items: center;
  background: var(--panel);
  border: 1px solid color-mix(in srgb, var(--school, var(--line)) 45%, transparent);
  border-radius: 8px 30px 30px 8px;
  display: flex;
  gap: 0.45rem;
  padding: 0.25rem 0.7rem 0.25rem 0.3rem;
}
.spell.empty {
  padding-right: 0.3rem;
}
.spell img,
.empty-slot {
  height: 2.4rem;
  width: 2.4rem;
}
.empty-slot {
  border: 2px dashed var(--line);
  border-radius: 50%;
}
kbd {
  background: rgb(0 0 0 / 45%);
  border: 1px solid var(--line);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.8rem;
  padding: 0 0.35rem;
}
.spell-name {
  display: grid;
  font-family: var(--font-title);
  line-height: 1.05;
  text-transform: uppercase;
}
.spell-name small {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: none;
}
.utility.empty {
  color: var(--text-muted);
}
.utility {
  align-items: center;
  background: var(--panel);
  border-radius: 8px;
  display: flex;
  font-family: var(--font-title);
  gap: 0.5rem;
  min-height: 2.9rem;
  padding: 0.25rem 0.8rem 0.25rem 0.25rem;
  text-transform: uppercase;
}
.utility img {
  height: 2.4rem;
  width: 2.4rem;
}
.utility.empty {
  border: 2px dashed var(--line);
  padding-left: 0.8rem;
}
.carriers {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 1.25rem;
}
.sheet-footer {
  border-top: 1px solid var(--line);
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.78rem;
  gap: 0.3rem 1.5rem;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 0.6rem;
}
.site {
  font-family: ui-monospace, monospace;
}
.assumed-mark {
  color: var(--accent);
}
@media (max-width: 64rem) {
  .carriers {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 40rem) {
  .sheet {
    margin: 0 -0.25rem;
    padding: 1rem 0.75rem 0.75rem;
  }
}
</style>
