<script setup lang="ts">
// Spells: the schools on the left, the spells of the chosen school in the middle, the 3 spell slots on the right.
// Clicking a spell highlights the slots, then clicking a slot puts the spell there. Clicking an occupied slot (with no
// spell pending) empties it.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { spellById, spellCooldown, spells, spellSchools } from '@/domain/gameData'
import { spellKeys } from '@/i18n'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import { SCHOOL_COLORS } from '@/ui/colors'
import BackButton from '@/components/BackButton.vue'

const { t, locale } = useI18n()
const store = useBuildStore()
const language = useLanguageStore()

const equipped = computed(() => store.build.spells)
/** School shown: the one of the first equipped spell at first. */
const school = ref(
  spellById.get(equipped.value.find((s) => s && spellById.has(s)) ?? '')?.school ?? spellSchools[0].id,
)
const schoolSpells = computed(() => spells.filter((s) => s.school === school.value))
/** Spell waiting for a slot. */
const pending = ref<string | null>(null)
const keys = computed(() => spellKeys(locale.value))

function slotOf(spell: string): number {
  return equipped.value.indexOf(spell)
}

function chooseSpell(spell: string) {
  pending.value = pending.value === spell ? null : spell
}

function clickSlot(slot: number) {
  if (pending.value) {
    store.placeSpell(slot, pending.value)
    pending.value = null
  } else if (equipped.value[slot]) {
    store.clearSpellSlot(slot)
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') pending.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <main class="page spells-page" :style="{ '--school': SCHOOL_COLORS[school] }">
    <BackButton class="back" />

    <nav class="schools" :aria-label="t('game.spells')">
      <button
        v-for="s in spellSchools"
        :key="s.id"
        type="button"
        class="school"
        :class="{ on: s.id === school }"
        :style="{ '--color': SCHOOL_COLORS[s.id] }"
        :aria-pressed="s.id === school"
        :title="language.gameName(s.id)"
        :aria-label="language.gameName(s.id)"
        @click="school = s.id"
      >
        <img :src="iconUrl(s.id)" alt="" />
      </button>
    </nav>

    <section class="list">
      <header>
        <h1>{{ language.gameName(school) }}</h1>
        <p>{{ language.gameDescription(school) }}</p>
      </header>
      <ul>
        <li v-for="spell in schoolSpells" :key="spell.id">
          <button
            type="button"
            class="spell"
            :class="{ pending: pending === spell.id, equipped: slotOf(spell.id) >= 0 }"
            :aria-pressed="pending === spell.id"
            @click="chooseSpell(spell.id)"
          >
            <img :src="iconUrl(spell.id)" alt="" />
            <span class="name">{{ language.gameName(spell.id) }}</span>
            <span v-if="spellCooldown(spell.id) !== null" class="cooldown">
              {{ t('game.spell_cooldown', { sec: spellCooldown(spell.id) }) }}
            </span>
            <span class="description">{{ language.gameDescription(spell.id) }}</span>
            <span class="key">
              <template v-if="slotOf(spell.id) >= 0">✔ [{{ keys[slotOf(spell.id)] }}]</template>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <aside class="slots" :class="{ choosing: pending }">
      <p class="hint" aria-live="polite">
        {{ pending ? t('spells.pickSlot', { name: language.gameName(pending) }) : t('spells.hint') }}
      </p>
      <button
        v-for="(spell, slot) in equipped"
        :key="slot"
        type="button"
        class="slot"
        :style="{ '--color': spell && spellById.has(spell) ? SCHOOL_COLORS[spellById.get(spell)!.school] : undefined }"
        :disabled="!pending && !spell"
        @click="clickSlot(slot)"
      >
        <span class="circle">
          <img v-if="spell && spellById.has(spell)" :src="iconUrl(spell)" alt="" />
        </span>
        <span class="slot-name">{{ spell ? language.gameName(spell) : t('game.empty') }}</span>
        <span class="slot-key">[{{ keys[slot] }}]</span>
      </button>
    </aside>
  </main>
</template>

<style scoped>
.spells-page {
  display: grid;
  gap: 1rem 2rem;
  grid-template-areas: 'back back back' 'schools list slots';
  grid-template-columns: auto minmax(0, 1fr) 11rem;
}
.back {
  grid-area: back;
}
.schools {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  grid-area: schools;
  padding-top: 0.5rem;
}
.school {
  background: none;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  filter: grayscale(1) brightness(0.65);
  height: 4.2rem;
  padding: 0;
  width: 4.2rem;
}
.school img {
  display: block;
  height: 100%;
  width: 100%;
}
.school:hover {
  filter: grayscale(0.3) brightness(0.9);
}
.school.on {
  border-color: white;
  box-shadow: 0 0 18px var(--color);
  filter: none;
  transform: scale(1.12);
}
.list {
  grid-area: list;
}
.list header {
  border-bottom: 3px solid var(--school);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
}
.list h1 {
  color: var(--school);
  font-size: clamp(2.2rem, 5vw, 3.75rem);
  line-height: 1;
}
.list header p {
  font-family: var(--font-title);
  font-size: 1.2rem;
  margin: 0.4rem 0 0;
}
.list ul {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.spell {
  align-items: center;
  background: linear-gradient(90deg, rgb(0 0 0 / 35%), rgb(0 0 0 / 15%));
  border: 0;
  border-left: 5px solid transparent;
  cursor: pointer;
  display: grid;
  gap: 0.25rem 1rem;
  grid-template-areas: 'icon name cooldown key' 'icon description description key';
  grid-template-columns: 3rem minmax(0, 1fr) auto auto;
  padding: 0.6rem 1rem 0.6rem 0.75rem;
  text-align: left;
  width: 100%;
}
.spell img {
  grid-area: icon;
  height: 3rem;
  width: 3rem;
}
.name {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 600;
  grid-area: name;
  line-height: 1.1;
  text-transform: uppercase;
}
.cooldown {
  color: var(--school);
  font-family: var(--font-title);
  font-size: 1.1rem;
  grid-area: cooldown;
  white-space: nowrap;
}
.description {
  color: var(--text-muted);
  grid-area: description;
}
.key {
  color: var(--accent);
  font-family: var(--font-title);
  font-size: 1.2rem;
  grid-area: key;
}
.spell:hover {
  background: linear-gradient(90deg, rgb(0 0 0 / 50%), rgb(0 0 0 / 20%));
}
.spell.equipped {
  border-left-color: color-mix(in srgb, var(--school) 60%, transparent);
}
.spell.pending {
  background: linear-gradient(90deg, color-mix(in srgb, var(--school) 45%, black), rgb(0 0 0 / 20%));
  border-left-color: var(--school);
}
.spell.pending .name {
  color: white;
}
.spell.equipped .name,
.spell.pending .description {
  color: var(--text);
}
.slots {
  align-items: center;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  grid-area: slots;
  position: sticky;
  text-align: center;
  top: 1rem;
}
.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0;
  min-height: 2.5rem;
}
.choosing .hint {
  color: var(--accent);
}
.slot {
  align-items: center;
  background: none;
  border: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0;
}
.slot:disabled {
  cursor: default;
}
.circle {
  align-items: center;
  background: rgb(0 0 0 / 35%);
  border: 3px dashed rgb(255 255 255 / 20%);
  border-radius: 50%;
  display: flex;
  height: 5.5rem;
  justify-content: center;
  overflow: hidden;
  width: 5.5rem;
}
.circle img {
  height: 100%;
  width: 100%;
}
.slot:not(:disabled):hover .circle {
  outline: 3px solid var(--accent);
}
.choosing .circle {
  animation: pulse 1s ease-in-out infinite alternate;
  border-color: var(--accent);
  border-style: solid;
}
@keyframes pulse {
  to {
    box-shadow: 0 0 22px rgb(244 181 47 / 75%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .choosing .circle {
    animation: none;
    box-shadow: 0 0 16px rgb(244 181 47 / 75%);
  }
}
.slot-name {
  color: var(--color, var(--text-muted));
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 600;
  text-transform: uppercase;
}
.slot-key {
  color: var(--accent);
  font-family: var(--font-title);
  font-size: 1.2rem;
}
/* Phone and tablet: schools in a row, then the slots in a row, then the spells. */
@media (max-width: 56rem) {
  .spells-page {
    grid-template-areas: 'back' 'schools' 'slots' 'list';
    grid-template-columns: minmax(0, 1fr);
  }
  .schools {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }
  .school {
    height: 3.2rem;
    width: 3.2rem;
  }
  .slots {
    background: var(--bg);
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 0.5rem 0;
    top: 0;
    z-index: 2;
  }
  .hint {
    grid-column: 1 / -1;
    min-height: 0;
  }
  .circle {
    height: 4rem;
    width: 4rem;
  }
  .slot-name {
    font-size: 0.95rem;
  }
  .spell {
    grid-template-areas: 'icon name' 'icon cooldown' 'icon description' 'icon key';
    grid-template-columns: 2.5rem minmax(0, 1fr);
  }
  .spell img {
    height: 2.5rem;
    width: 2.5rem;
  }
  .name {
    font-size: 1.2rem;
  }
}
</style>
