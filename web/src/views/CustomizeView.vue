<script setup lang="ts">
// Customize a carrier (docs/maquettes.md, "Personnaliser"): upgrades, the sidearm's element, the joker slots and the
// progression this needs. A weapon carrier without a weapon goes back to the weapon choice.
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { carrierItem, upgradePointsUsed, type CarrierKey } from '@/domain/build'
import { upgrades } from '@/domain/gameData'
import { MAX_JOKER_SLOTS, MAX_UPGRADE_POINTS, RULES } from '@/domain/rules'
import { upgradeRoom } from '@/domain/validation'
import { useProblemText } from '@/i18n/problems'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import { SCHOOL_COLORS } from '@/ui/colors'
import BackButton from '@/components/BackButton.vue'
import JokerSlots from '@/components/JokerSlots.vue'
import UpgradeRow from '@/components/UpgradeRow.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBuildStore()
const language = useLanguageStore()
const { carrierName } = useProblemText()

const carrier = computed(() => route.params.carrier as CarrierKey)
const item = computed(() => carrierItem(store.build, carrier.value))
const loadout = computed(() => store.build[carrier.value])
const requirements = computed(() => store.requirements[carrier.value])

watchEffect(() => {
  if (item.value === null) router.replace({ name: 'pick', params: { slot: carrier.value } })
})

const carrierUpgrades = computed(() => upgrades.filter((u) => item.value && u.available_on.includes(item.value)))
const pointsUsed = computed(() => upgradePointsUsed(loadout.value))
const levelPoints = RULES.upgradePointsFromLevels.value

function openJokers() {
  router.push({ name: 'jokers', params: { carrier: carrier.value } })
}
</script>

<template>
  <main v-if="item" class="page customize">
    <BackButton class="back" />

    <section class="stats">
      <header class="title">
        <h1>{{ carrierName(store.build, carrier) }}</h1>
        <p class="level">
          {{ t('customize.minLevel', { level: requirements.level }) }} ·
          {{ t('home.prestiges', requirements.prestiges) }}<span v-if="requirements.assumed" class="assumed-mark">*</span>
        </p>
      </header>

      <div class="budget">
        <span>{{ t('game.upgrade_slots') }}</span>
        <span class="budget-pills" aria-hidden="true">
          <span
            v-for="n in MAX_UPGRADE_POINTS"
            :key="n"
            class="budget-pill"
            :class="{ on: n <= pointsUsed, prestige: n > levelPoints }"
          />
        </span>
        <span class="count">{{ pointsUsed }}/{{ MAX_UPGRADE_POINTS }}</span>
      </div>

      <div class="upgrades">
        <UpgradeRow
          v-for="upgrade in carrierUpgrades"
          :key="upgrade.id"
          :upgrade="upgrade"
          :points="loadout.upgrades[upgrade.id] ?? 0"
          :room="upgradeRoom(store.build, carrier, upgrade.id)"
          @change="(delta) => store.changeUpgrade(carrier, upgrade.id, delta)"
        />
      </div>

      <div v-if="carrier === 'sidearm'" class="element">
        <span>{{ t('game.element_damage') }}</span>
        <span class="element-choices">
          <button
            v-for="school in RULES.sidearmElements.value"
            :key="school"
            type="button"
            class="element-choice"
            :class="{ on: store.build.sidearm.element === school }"
            :style="{ '--school': SCHOOL_COLORS[school] }"
            :aria-pressed="store.build.sidearm.element === school"
            :title="language.gameName(school)"
            :aria-label="language.gameName(school)"
            @click="store.setElement(store.build.sidearm.element === school ? null : school)"
          >
            <img :src="iconUrl(school)" alt="" />
          </button>
        </span>
      </div>

      <section class="progression">
        <h2>{{ t('customize.requirements') }}</h2>
        <ul>
          <li>
            {{ t('customize.upgradesNeed', { used: requirements.upgradePoints.used, level: requirements.upgradePoints.level }) }}
            <span v-if="requirements.upgradePoints.bought" class="bought">
              {{ t('customize.bought', requirements.upgradePoints.bought) }}
            </span>
          </li>
          <li>
            {{ t('customize.jokersNeed', { used: requirements.jokerSlots.used, level: requirements.jokerSlots.level }) }}
            <span v-if="requirements.jokerSlots.bought" class="bought">
              {{ t('customize.bought', requirements.jokerSlots.bought) }}
            </span>
          </li>
          <li v-for="unique in requirements.uniqueJokers" :key="unique.joker">
            {{ language.gameName(unique.joker) }} : {{ t('game.unlocked_at_weapon_level', { level: unique.level }) }}
          </li>
        </ul>
        <p v-if="requirements.assumed" class="assumed">
          <span class="assumed-mark">*</span> {{ t('home.assumed') }}
        </p>
      </section>
    </section>

    <section class="jokers">
      <h2>{{ t('game.jokers') }}</h2>
      <p class="count">{{ t('customize.jokerSlots', { used: requirements.jokerSlots.used, max: MAX_JOKER_SLOTS }) }}</p>
      <JokerSlots :loadout="loadout" @select="openJokers" />
    </section>
  </main>
</template>

<style scoped>
.customize {
  display: grid;
  gap: 1rem 3rem;
  grid-template-areas: 'back back' 'stats jokers';
  grid-template-columns: minmax(0, 1fr) auto;
}
.back {
  grid-area: back;
}
.stats {
  grid-area: stats;
  max-width: 52rem;
}
.title {
  align-items: baseline;
  border-bottom: 3px solid var(--accent);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  justify-content: space-between;
  padding-bottom: 0.4rem;
}
.title h1 {
  color: var(--accent);
  font-size: clamp(2rem, 5vw, 3.5rem);
}
.level {
  font-family: var(--font-title);
  font-size: 1.5rem;
  margin: 0;
}
.budget {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-family: var(--font-title);
  font-size: 1.2rem;
  gap: 0.75rem;
  margin: 1rem 0 0.75rem;
}
.budget-pills {
  display: flex;
  gap: 3px;
}
.budget-pill {
  background: rgb(0 0 0 / 45%);
  border-radius: 3px;
  height: 1.4rem;
  transform: skew(-12deg);
  width: 0.5rem;
}
.budget-pill.on {
  background: var(--accent);
}
.budget-pill.prestige {
  outline: 1px dashed rgb(244 181 47 / 60%);
}
.count {
  color: var(--text-muted);
}
.upgrades {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.element {
  align-items: center;
  border-top: 3px solid var(--accent);
  display: flex;
  flex-wrap: wrap;
  font-family: var(--font-title);
  font-size: 1.5rem;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1rem;
}
.element-choices {
  display: flex;
  gap: 0.75rem;
}
.element-choice {
  background: none;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  filter: grayscale(1) brightness(0.6);
  height: 3.6rem;
  padding: 0;
  width: 3.6rem;
}
.element-choice img {
  display: block;
  height: 100%;
  width: 100%;
}
.element-choice:hover {
  filter: grayscale(0.4) brightness(0.85);
}
.element-choice.on {
  border-color: white;
  box-shadow: 0 0 14px var(--school);
  filter: none;
}
.progression {
  border-top: 3px solid var(--accent);
  margin-top: 1.5rem;
  padding-top: 1rem;
}
.progression h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.progression ul {
  margin: 0;
  padding-left: 1.2rem;
}
.progression li {
  margin: 0.25rem 0;
}
.bought {
  color: var(--accent);
}
.assumed {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.assumed-mark {
  color: var(--accent);
}
.jokers {
  align-items: center;
  align-self: start;
  display: flex;
  flex-direction: column;
  grid-area: jokers;
  padding-top: 1rem;
}
.jokers h2 {
  color: var(--accent);
  font-size: 2.6rem;
}
.jokers .count {
  margin: 0 0 1rem;
}
@media (max-width: 56rem) {
  .customize {
    grid-template-areas: 'back' 'stats' 'jokers';
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
