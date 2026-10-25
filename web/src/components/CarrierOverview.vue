<script setup lang="ts">
// One carrier in the build home's summary: its item, the level and prestiges it needs, its jokers as their icon in a circle of their rarity colour (as in the game's slots) and
// its upgrades as their icon with the points. A glance at the build; the full detail is on the summary sheet.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { carrierItem, type Build, type CarrierKey } from '@/domain/build'
import { jokerById, upgrades } from '@/domain/gameData'
import type { Requirements } from '@/domain/progression'
import { useProblemText } from '@/i18n/problems'
import { iconUrl } from '@/icons'
import { useLanguageStore } from '@/stores/language'
import { RARITY_COLORS, SCHOOL_COLORS } from '@/ui/colors'

const props = defineProps<{ build: Build; carrier: CarrierKey; requirements: Requirements }>()

const { t } = useI18n()
const language = useLanguageStore()
const { carrierName } = useProblemText()

const item = computed(() => carrierItem(props.build, props.carrier))
const loadout = computed(() => props.build[props.carrier])
const element = computed(() => (props.carrier === 'sidearm' ? props.build.sidearm.element : null))

// Unknown ids (imported builds) are left out: the problems list names them.
const jokerRows = computed(() =>
  Object.entries(loadout.value.jokers).flatMap(([id, copies]) => {
    const joker = jokerById.get(id)
    return joker ? [{ id, copies, color: RARITY_COLORS[joker.rarity] }] : []
  }),
)
const upgradeRows = computed(() =>
  upgrades.filter((u) => loadout.value.upgrades[u.id]).map((u) => ({ id: u.id, points: loadout.value.upgrades[u.id] })),
)
</script>

<template>
  <div class="carrier">
    <div class="head" :class="{ empty: !item }">
      <img v-if="item" :src="iconUrl(item)" alt="" class="item" />
      <span class="name">
        {{ carrierName(build, carrier) }}
        <span v-if="element" class="element" :style="{ color: SCHOOL_COLORS[element] }">{{ language.gameName(element) }}</span>
      </span>
      <span v-if="item" class="level">
        <b>{{ t('game.level_short', { lvl: requirements.level }) }}</b>
        <span>
          {{ t('home.prestiges', requirements.prestiges) }}<span v-if="requirements.assumed" class="assumed-mark">*</span>
        </span>
      </span>
    </div>
    <div v-if="jokerRows.length || upgradeRows.length" class="body">
      <ul class="jokers">
        <li v-for="row in jokerRows" :key="row.id">
          <img :src="iconUrl(row.id)" :alt="language.gameName(row.id)" :style="{ background: row.color }" />
          <span v-if="row.copies > 1" class="copies">×{{ row.copies }}</span>
        </li>
      </ul>
      <ul class="upgrades">
        <li v-for="row in upgradeRows" :key="row.id">
          <img :src="iconUrl(row.id)" :alt="language.gameName(row.id)" />
          <b>{{ row.points }}</b>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.carrier {
  border-bottom: 1px solid var(--line);
  display: grid;
  gap: 0.4rem;
  padding: 0.6rem 0;
}
.head {
  align-items: center;
  display: flex;
  gap: 0.6rem;
}
.item {
  flex: none;
  height: 2rem;
  width: 2rem;
}
.name {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 500;
  line-height: 1.1;
  min-width: 0;
  text-transform: uppercase;
}
.head.empty .name {
  color: var(--text-muted);
}
.element {
  font-size: 0.85rem;
  margin-left: 0.2rem;
}
.level {
  align-items: baseline;
  display: flex;
  font-family: var(--font-title);
  gap: 0.5rem;
  margin-left: auto;
  text-transform: uppercase;
  white-space: nowrap;
}
.level b {
  color: var(--accent);
  font-size: 1.2rem;
}
.level > span {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.assumed-mark {
  color: var(--accent);
}
/* Under the name, aligned with it. */
.body {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding-left: 2.6rem;
}
.jokers,
.upgrades {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}
.jokers {
  flex-wrap: wrap;
  gap: 3px;
}
.jokers li {
  position: relative;
}
.jokers img {
  border-radius: 50%;
  display: block;
  height: 2rem;
  padding: 0.35rem;
  width: 2rem;
}
.copies {
  background: var(--accent);
  border-radius: 2px;
  bottom: -3px;
  color: var(--plank-text);
  font-family: var(--font-title);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  padding: 1px 2px;
  position: absolute;
  right: -3px;
}
.upgrades {
  flex: none;
  gap: 0.3rem;
}
.upgrades li {
  display: grid;
  font-family: var(--font-title);
  font-size: 0.8rem;
  justify-items: center;
}
.upgrades img {
  height: 1.4rem;
  width: 1.4rem;
}
@media (max-width: 40rem) {
  .body {
    align-items: start;
    flex-direction: column;
    padding-left: 0;
  }
}
</style>
