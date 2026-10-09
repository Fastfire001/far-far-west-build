<script setup lang="ts">
// Jokers of a carrier (docs/maquettes.md, "Jokers"): rarity tabs and a search, the cards of the jokers available on
// the carrier, and its slots on the right. Clicking a card adds a copy if there is room; clicking an equipped joker
// in the slots removes a copy.
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { carrierItem, type CarrierKey } from '@/domain/build'
import { isEquippableInLobby, jokers, type Joker, type Rarity } from '@/domain/gameData'
import { uniqueUnlockLevel } from '@/domain/progression'
import { MAX_JOKER_SLOTS } from '@/domain/rules'
import { jokerAddBlocker } from '@/domain/validation'
import { useProblemText } from '@/i18n/problems'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import { RARITY_COLORS } from '@/ui/colors'
import { useMediaQuery } from '@/ui/useMediaQuery'
import BackButton from '@/components/BackButton.vue'
import JokerSlots from '@/components/JokerSlots.vue'

const RARITIES: Rarity[] = ['Normal', 'Fine', 'Prime', 'Mythic', 'Legendary', 'Unique']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBuildStore()
const language = useLanguageStore()
const { carrierName } = useProblemText()
const narrow = useMediaQuery('(max-width: 56rem)')

const carrier = computed(() => route.params.carrier as CarrierKey)
const item = computed(() => carrierItem(store.build, carrier.value))
const loadout = computed(() => store.build[carrier.value])
const slotsUsed = computed(() => store.requirements[carrier.value].jokerSlots.used)

watchEffect(() => {
  if (item.value === null) router.replace({ name: 'pick', params: { slot: carrier.value } })
})

const rarity = ref<Rarity | null>(null)
const search = ref('')

/** Lower case, without accents: "Dégâts" matches "degats". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()

const available = computed(() =>
  jokers.filter((j) => item.value && j.available_on.includes(item.value) && isEquippableInLobby(j)),
)
const shown = computed(() => {
  const words = fold(search.value).split(/\s+/).filter(Boolean)
  return available.value
    .filter((j) => rarity.value === null || j.rarity === rarity.value)
    .filter((j) => {
      const text = fold(`${language.gameName(j.id)} ${language.gameDescription(j.id)}`)
      return words.every((w) => text.includes(w))
    })
    .sort(
      (a, b) =>
        RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) ||
        language.gameName(a.id).localeCompare(language.gameName(b.id), language.locale),
    )
})
const counts = computed(() =>
  Object.fromEntries(RARITIES.map((r) => [r, available.value.filter((j) => j.rarity === r).length])),
)

function blocker(joker: Joker) {
  return jokerAddBlocker(store.build, carrier.value, joker.id)
}

function blockerText(joker: Joker): string {
  const reason = blocker(joker)
  if (reason === 'max_copies') return t('game.limit_reached')
  if (reason === 'no_room') return t('jokers.noRoom', { cost: joker.slot_cost })
  return ''
}

function onSlot(joker: string | null) {
  if (joker) store.removeJoker(carrier.value, joker)
}
</script>

<template>
  <main v-if="item" class="page jokers-page">
    <BackButton class="back" />

    <section class="catalog">
      <h1>{{ t('game.jokers') }} — {{ carrierName(store.build, carrier) }}</h1>

      <div class="filters">
        <div class="tabs" role="group" :aria-label="t('jokers.rarity')">
          <button type="button" class="tab" :aria-pressed="rarity === null" @click="rarity = null">
            {{ t('game.all') }}
          </button>
          <button
            v-for="r in RARITIES"
            v-show="counts[r] > 0"
            :key="r"
            type="button"
            class="tab"
            :style="{ '--rarity': RARITY_COLORS[r] }"
            :aria-pressed="rarity === r"
            @click="rarity = rarity === r ? null : r"
          >
            <span class="dot" aria-hidden="true" />{{ t(`game.rarity_${r.toLowerCase()}`) }}
          </button>
        </div>
        <input v-model="search" type="search" class="search" :placeholder="t('jokers.search')" :aria-label="t('jokers.search')" />
      </div>

      <p v-if="!shown.length" class="empty">{{ t('jokers.noResult') }}</p>
      <ul class="cards">
        <li v-for="joker in shown" :key="joker.id">
          <button
            type="button"
            class="card"
            :class="{ equipped: loadout.jokers[joker.id], blocked: blocker(joker) }"
            :style="{ '--rarity': RARITY_COLORS[joker.rarity] }"
            :aria-disabled="blocker(joker) !== null"
            @click="store.addJoker(carrier, joker.id)"
          >
            <span class="top">
              <span class="cost" :aria-label="t('jokers.cost', joker.slot_cost)">
                <span v-for="n in joker.slot_cost" :key="n" class="cost-dot" />
              </span>
              <span v-if="loadout.jokers[joker.id]" class="copies">×{{ loadout.jokers[joker.id] }}</span>
            </span>
            <span class="name">{{ language.gameName(joker.id) }}</span>
            <img :src="iconUrl(joker.id)" alt="" class="icon" />
            <span class="description">{{ language.gameDescription(joker.id) }}</span>
            <span class="footer">
              <span>{{ t('game.max_amount', { amount: joker.max_equip }) }}</span>
              <span v-if="uniqueUnlockLevel(joker)" class="unlock">
                🔓 {{ t('game.level_short', { lvl: uniqueUnlockLevel(joker) }) }}
              </span>
            </span>
            <span v-if="blockerText(joker)" class="reason">{{ blockerText(joker) }}</span>
          </button>
        </li>
      </ul>
    </section>

    <aside class="slots-panel">
      <p class="count">{{ t('customize.jokerSlots', { used: slotsUsed, max: MAX_JOKER_SLOTS }) }}</p>
      <JokerSlots :loadout="loadout" :columns="narrow ? 8 : 2" :size="narrow ? 21 : 36" @select="onSlot" />
      <p class="hint">{{ t('jokers.removeHint') }}</p>
    </aside>
  </main>
</template>

<style scoped>
.jokers-page {
  display: grid;
  gap: 1rem 2.5rem;
  grid-template-areas: 'back back' 'catalog slots-panel';
  grid-template-columns: minmax(0, 1fr) auto;
}
.back {
  grid-area: back;
}
.catalog {
  grid-area: catalog;
}
.catalog h1 {
  color: var(--accent);
  font-size: clamp(1.8rem, 4vw, 3rem);
  margin-bottom: 1rem;
  text-align: center;
}
.filters {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}
.tab {
  align-items: center;
  background: linear-gradient(180deg, var(--plank-light), var(--plank));
  border: 2px solid var(--plank-dark);
  color: var(--plank-text);
  cursor: pointer;
  display: flex;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 600;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  text-transform: uppercase;
}
.tab[aria-pressed='true'] {
  box-shadow: 0 0 0 2px var(--accent), 0 0 12px rgb(244 181 47 / 55%);
}
.dot {
  background: var(--rarity);
  border-radius: 50%;
  height: 0.7rem;
  width: 0.7rem;
}
.search {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  min-width: 16rem;
  padding: 0.45rem 0.75rem;
}
.empty {
  color: var(--text-muted);
  text-align: center;
}
.cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}
.card {
  align-items: center;
  background: linear-gradient(180deg, #c9c3cf, #a9a2b0);
  border: 3px solid var(--rarity);
  border-radius: 10px;
  box-shadow: inset 0 0 0 3px rgb(255 255 255 / 25%);
  color: #2a2430;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  opacity: 0.6;
  padding: 0.6rem 0.75rem 0.7rem;
  position: relative;
  text-align: center;
  width: 100%;
}
.card:hover,
.card.equipped {
  opacity: 1;
}
.card.equipped {
  background: linear-gradient(180deg, #ebe7ef, #c9c3d0);
  box-shadow:
    inset 0 0 0 3px rgb(255 255 255 / 40%),
    0 0 16px color-mix(in srgb, var(--rarity) 70%, transparent);
}
.card.blocked {
  border-color: var(--danger);
  cursor: not-allowed;
}
.card.blocked:hover {
  opacity: 0.6;
}
.card.equipped.blocked:hover {
  opacity: 1;
}
.top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 1.4rem;
  width: 100%;
}
.cost {
  display: flex;
  gap: 3px;
}
.cost-dot {
  background: var(--rarity);
  border: 1px solid rgb(0 0 0 / 30%);
  border-radius: 50%;
  height: 0.65rem;
  width: 0.65rem;
}
.copies {
  font-family: var(--font-title);
  font-size: 1.4rem;
  font-weight: 700;
}
.name {
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.1;
}
.icon {
  height: 4.2rem;
  width: 3rem;
}
.description {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.3;
}
.footer {
  display: flex;
  font-family: var(--font-title);
  justify-content: space-between;
  width: 100%;
}
.unlock {
  color: #7a1c24;
}
.reason {
  background: var(--danger);
  border-radius: 3px;
  color: white;
  font-size: 0.8rem;
  padding: 0.1rem 0.4rem;
}
.slots-panel {
  align-items: center;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  grid-area: slots-panel;
  position: sticky;
  top: 1rem;
}
.count {
  font-family: var(--font-title);
  font-size: 1.2rem;
  margin: 0;
}
.hint {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin: 0;
  max-width: 10rem;
  text-align: center;
}
/* Phone and tablet: the slots as a strip above the cards. */
@media (max-width: 56rem) {
  .jokers-page {
    grid-template-areas: 'back' 'slots-panel' 'catalog';
    grid-template-columns: minmax(0, 1fr);
  }
  .slots-panel {
    background: var(--bg);
    padding: 0.5rem 0;
    z-index: 2;
  }
  .hint {
    max-width: none;
  }
  .search {
    min-width: 0;
    width: 100%;
  }
  .cards {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  }
}
</style>
