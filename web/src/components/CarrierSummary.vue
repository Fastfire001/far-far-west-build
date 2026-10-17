<script setup lang="ts">
// One carrier on the build sheet (hero, main weapon or sidearm): its item, the level and prestiges it needs, the
// upgrades with points, and the joker slots as in the game with the list of jokers beside them. Display only: the
// summary screen is made to be read and screenshotted, the build is edited from its home.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { carrierItem, type Build, type CarrierKey } from '@/domain/build'
import { jokerById, upgrades } from '@/domain/gameData'
import type { Requirements } from '@/domain/progression'
import { MAX_JOKER_SLOTS, MAX_UPGRADE_POINTS } from '@/domain/rules'
import { useProblemText } from '@/i18n/problems'
import { iconUrl } from '@/icons'
import { useLanguageStore } from '@/stores/language'
import { RARITY_COLORS, SCHOOL_COLORS } from '@/ui/colors'
import { upgradeBonus } from '@/ui/format'
import JokerSlots from '@/components/JokerSlots.vue'

const props = defineProps<{ build: Build; carrier: CarrierKey; requirements: Requirements }>()

const { t, locale } = useI18n()
const language = useLanguageStore()
const { carrierName } = useProblemText()

const item = computed(() => carrierItem(props.build, props.carrier))
const loadout = computed(() => props.build[props.carrier])
const element = computed(() => (props.carrier === 'sidearm' ? props.build.sidearm.element : null))
const role = computed(() => t(`game.${props.carrier === 'main' ? 'main_weapon' : props.carrier}`))

// Unknown ids (imported builds) are left out here: the problems list names them.
const upgradeRows = computed(() =>
  upgrades
    .filter((u) => loadout.value.upgrades[u.id])
    .map((u) => ({ upgrade: u, points: loadout.value.upgrades[u.id], bonus: upgradeBonus(u, loadout.value.upgrades[u.id], locale.value) })),
)
// In the order of the slots (the order they were added).
const jokerRows = computed(() =>
  Object.entries(loadout.value.jokers).flatMap(([id, copies]) => {
    const joker = jokerById.get(id)
    if (!joker) return []
    const unique = props.requirements.uniqueJokers.find((u) => u.joker === id)
    return [{ joker, copies, slots: joker.slot_cost * copies, uniqueLevel: unique?.level }]
  }),
)
</script>

<template>
  <section class="carrier">
    <small v-if="carrier !== 'hero'" class="role">{{ role }}</small>
    <header class="head" :class="{ empty: !item }">
      <img v-if="item" :src="iconUrl(item)" alt="" class="item" />
      <span class="names">
        <span class="name">
          {{ item ? carrierName(build, carrier) : t('game.empty') }}
        </span>
        <span v-if="element" class="element" :style="{ color: SCHOOL_COLORS[element] }">
          <img :src="iconUrl(element)" alt="" />{{ language.gameName(element) }}
        </span>
      </span>
      <span v-if="item" class="level">
        <b>{{ t('game.level_short', { lvl: requirements.level }) }}</b>
        <span>
          {{ t('home.prestiges', requirements.prestiges) }}<span v-if="requirements.assumed" class="assumed-mark">*</span>
        </span>
      </span>
    </header>

    <template v-if="item">
      <h3>
        {{ t('game.jokers') }}
        <span>{{ requirements.jokerSlots.used }}/{{ MAX_JOKER_SLOTS }}</span>
      </h3>
      <div class="jokers">
        <JokerSlots :loadout="loadout" :size="30" readonly />
        <ul class="joker-list">
          <li v-for="row in jokerRows" :key="row.joker.id" :style="{ '--rarity': RARITY_COLORS[row.joker.rarity] }">
            <span class="dot" aria-hidden="true" />
            <span class="joker-name">
              {{ language.gameName(row.joker.id) }}
              <em v-if="row.copies > 1">×{{ row.copies }}</em>
              <small v-if="row.uniqueLevel">{{ t('game.level_short', { lvl: row.uniqueLevel }) }}</small>
            </span>
            <span class="cost" :title="t('jokers.cost', row.slots)">{{ '●'.repeat(row.slots) }}</span>
          </li>
        </ul>
      </div>

      <h3>
        {{ t('game.upgrades') }}
        <span>{{ requirements.upgradePoints.used }}/{{ MAX_UPGRADE_POINTS }}</span>
      </h3>
      <ul class="upgrades">
        <li v-for="row in upgradeRows" :key="row.upgrade.id" :style="{ '--band': row.upgrade.color }">
          <img :src="iconUrl(row.upgrade.id)" alt="" />
          <span class="upgrade-name">{{ language.gameName(row.upgrade.id) }}</span>
          <span class="pills" aria-hidden="true">
            <i v-for="n in row.upgrade.max_slots" :key="n" :class="{ on: n <= row.points }" />
          </span>
          <b>{{ row.points }}</b>
          <span class="bonus">{{ row.bonus }}</span>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.carrier {
  background: var(--panel);
  border-top: 3px solid var(--plank);
  min-width: 0;
  padding: 0.9rem 1rem 1rem;
}
.head {
  align-items: center;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
}
.role {
  color: var(--text-muted);
  display: block;
  font-family: var(--font-title);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.head.empty {
  border: 2px dashed var(--line);
  grid-template-columns: minmax(0, 1fr);
  min-height: 3.6rem;
  padding: 0 0.75rem;
}
.head.empty .name {
  color: var(--text-muted);
}
.item {
  height: 3.4rem;
  width: 3.4rem;
}
.names {
  display: grid;
  min-width: 0;
}
.name {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.05;
  text-transform: uppercase;
}
.element {
  align-items: center;
  display: inline-flex;
  font-family: var(--font-title);
  font-size: 0.85rem;
  gap: 0.3rem;
  text-transform: uppercase;
}
.element img {
  height: 1.2rem;
  width: 1.2rem;
}
.level {
  display: grid;
  font-family: var(--font-title);
  text-align: right;
  text-transform: uppercase;
  white-space: nowrap;
}
.level b {
  color: var(--accent);
  font-size: 1.5rem;
  line-height: 1;
}
.level > span {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.assumed-mark {
  color: var(--accent);
}
h3 {
  border-bottom: 1px solid var(--line);
  color: var(--text-muted);
  display: flex;
  font-size: 0.85rem;
  justify-content: space-between;
  letter-spacing: 0.08em;
  margin: 0.9rem 0 0.5rem;
  padding-bottom: 0.2rem;
}
h3 > span {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.jokers {
  align-items: start;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto minmax(0, 1fr);
}
.joker-list,
.upgrades {
  display: grid;
  gap: 0.3rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.joker-list li {
  align-items: center;
  display: grid;
  font-family: var(--font-title);
  font-size: 0.9rem;
  gap: 0.45rem;
  grid-template-columns: 0.7rem minmax(0, 1fr) auto;
  line-height: 1.1;
  text-transform: uppercase;
}
.dot {
  background: var(--rarity);
  border-radius: 50%;
  height: 0.7rem;
  width: 0.7rem;
}
.joker-name {
  overflow-wrap: anywhere;
}
.joker-name em {
  color: var(--accent);
  font-style: normal;
}
.joker-name small {
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.7rem;
  text-transform: none;
}
.cost {
  color: color-mix(in srgb, var(--rarity) 60%, white);
  font-size: 0.5rem;
  letter-spacing: 1px;
}
.upgrades li {
  align-items: center;
  display: grid;
  font-size: 0.82rem;
  gap: 0.45rem;
  grid-template-columns: 1.3rem minmax(0, 1fr) auto 1.2rem 3.6rem;
}
.upgrades img {
  height: 1.3rem;
  width: 1.3rem;
}
.upgrade-name {
  color: var(--band);
  font-family: var(--font-title);
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.pills {
  display: flex;
  gap: 2px;
}
.pills i {
  background: rgb(0 0 0 / 50%);
  border-radius: 2px;
  height: 14px;
  transform: skew(-12deg);
  width: 5px;
}
.pills i.on {
  background: var(--band);
}
.upgrades b {
  font-family: var(--font-title);
  text-align: right;
}
.bonus {
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: right;
}
</style>
