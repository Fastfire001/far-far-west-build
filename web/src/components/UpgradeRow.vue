<script setup lang="ts">
// One stat on the customize screen, like the game's: coloured band with the icon and name, total bonus, then
// ◀ points ▶. Clicking a point sets the stat to that many points.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Upgrade } from '@/domain/gameData'
import { iconUrl } from '@/icons'
import { useLanguageStore } from '@/stores/language'
import { upgradeColor } from '@/ui/colors'

const props = defineProps<{
  upgrade: Upgrade
  points: number
  /** Points that can still be added (stat maximum and carrier budget). */
  room: number
}>()
const emit = defineEmits<{ change: [delta: number] }>()

const { t, locale } = useI18n()
const language = useLanguageStore()

const name = computed(() => language.gameName(props.upgrade.id))
const bonus = computed(() => {
  const total = props.points * props.upgrade.value
  return new Intl.NumberFormat(locale.value, {
    style: props.upgrade.flat ? 'decimal' : 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 2,
  }).format(total)
})

function setTo(points: number) {
  const target = points === props.points ? points - 1 : points
  emit('change', Math.min(target - props.points, props.room))
}
</script>

<template>
  <div class="row" :style="{ '--band': upgradeColor(upgrade.id) }">
    <div class="band">
      <img :src="iconUrl(upgrade.id)" alt="" />
      <span class="name">{{ name }}</span>
    </div>
    <span class="bonus">{{ bonus }}</span>
    <div class="points">
      <button
        type="button"
        class="arrow"
        :disabled="points === 0"
        :aria-label="t('customize.removePoint', { name })"
        @click="emit('change', -1)"
      >
        ‹
      </button>
      <span class="pills">
        <button
          v-for="n in upgrade.max_slots"
          :key="n"
          type="button"
          class="pill"
          :class="{ on: n <= points }"
          :disabled="n > points + room"
          :aria-label="t('customize.setPoints', { name, n })"
          @click="setTo(n)"
        />
      </span>
      <button
        type="button"
        class="arrow"
        :disabled="room === 0"
        :aria-label="t('customize.addPoint', { name })"
        @click="emit('change', 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<style scoped>
.row {
  align-items: center;
  background: linear-gradient(90deg, rgb(0 0 0 / 30%), rgb(0 0 0 / 10%));
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(10rem, 15rem) 4.5rem minmax(0, 1fr);
  min-height: 2.9rem;
}
.band {
  align-items: center;
  align-self: stretch;
  background: linear-gradient(90deg, var(--band), color-mix(in srgb, var(--band) 35%, transparent));
  border-left: 5px solid var(--band);
  display: flex;
  gap: 0.5rem;
  padding: 0.2rem 0.6rem;
}
.band img {
  flex: none;
  height: 1.8rem;
  width: 1.8rem;
}
.name {
  font-family: var(--font-title);
  font-size: 1.1rem;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgb(0 0 0 / 60%);
}
.bonus {
  font-family: var(--font-title);
  font-size: 1.2rem;
  text-align: right;
}
.points {
  align-items: center;
  display: flex;
  gap: 0.3rem;
  min-width: 0;
}
.arrow {
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  padding: 0 0.3rem;
}
.arrow:disabled {
  cursor: default;
  opacity: 0.25;
}
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.pill {
  background: rgb(0 0 0 / 45%);
  border: 0;
  border-radius: 3px;
  cursor: pointer;
  height: 1.5rem;
  padding: 0;
  transform: skew(-12deg);
  width: 0.55rem;
}
.pill.on {
  background: var(--band);
  box-shadow: 0 0 6px color-mix(in srgb, var(--band) 60%, transparent);
}
.pill:disabled {
  cursor: default;
}
@media (max-width: 40rem) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
    padding-bottom: 0.4rem;
  }
  .points {
    grid-column: 1 / -1;
    padding-left: 0.4rem;
  }
}
</style>
