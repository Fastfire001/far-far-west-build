<script setup lang="ts">
// The carrier's joker slots, like the game's: circles in rows (2 columns by default), a joker taking as many
// circles as it costs, linked together (an SVG layer behind the circles draws the links). Unused circles show the
// level that unlocks them, or P for the slots bought at the prestige shop. Hovering an equipped joker (or focusing it
// with the keyboard) shows its card next to the slots.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Loadout } from '@/domain/build'
import { jokerById, type Rarity } from '@/domain/gameData'
import { MAX_JOKER_SLOTS, RULES } from '@/domain/rules'
import { iconUrl } from '@/icons'
import { useLanguageStore } from '@/stores/language'
import { RARITY_COLORS } from '@/ui/colors'
import JokerCard from '@/components/JokerCard.vue'

const props = withDefaults(
  defineProps<{
    loadout: Loadout
    columns?: number
    /** Circle size, in tenths of rem. */
    size?: number
    /** Display only (build summary): no clicks, no + in the first unused circle; hovering still shows the cards. */
    readonly?: boolean
  }>(),
  { columns: 2, size: 36, readonly: false },
)
/** A click on a joker's circle (with its id) or on an unused one (null). */
const emit = defineEmits<{ select: [joker: string | null] }>()

const { t } = useI18n()
const language = useLanguageStore()

interface Circle {
  index: number
  row: number
  column: number
  joker: string | null
  rarity?: Rarity
  /** The next circle belongs to the same copy of the joker: draw a link towards it. */
  linked: boolean
  label: string
  title: string
}

// Geometry of the grid, in tenths of rem: circle size and gaps (applied to the grid as CSS variables).
const geometry = computed(() => ({ size: props.size, columnGap: props.size * 0.35, rowGap: props.size * 0.2 }))
const center = (row: number, column: number) => {
  const { size, columnGap, rowGap } = geometry.value
  return { x: size / 2 + column * (size + columnGap), y: size / 2 + row * (size + rowGap) }
}

const circles = computed<Circle[]>(() => {
  const owners: { joker: string; copy: number }[] = []
  for (const [id, copies] of Object.entries(props.loadout.jokers)) {
    const cost = jokerById.get(id)?.slot_cost ?? 0
    for (let copy = 0; copy < copies; copy++) for (let i = 0; i < cost; i++) owners.push({ joker: id, copy })
  }
  const levels = RULES.jokerSlotLevels.value
  // Over-budget builds (imports) show every joker: add rows as needed.
  const count = Math.max(MAX_JOKER_SLOTS, Math.ceil(owners.length / props.columns) * props.columns)
  return Array.from({ length: count }, (_, index) => {
    const owner = owners[index]
    const next = owners[index + 1]
    const level = levels[index]
    return {
      index,
      row: Math.floor(index / props.columns),
      column: index % props.columns,
      joker: owner?.joker ?? null,
      rarity: owner ? jokerById.get(owner.joker)?.rarity : undefined,
      linked: Boolean(owner && next && next.joker === owner.joker && next.copy === owner.copy),
      label: owner ? '' : level !== undefined ? String(level) : 'P',
      // An equipped joker shows its card on hover instead of a native tooltip.
      title: owner
        ? ''
        : level !== undefined
          ? t('game.unlocked_at_level', { level })
          : t('customize.prestigeSlot'),
    }
  })
})
const firstFree = computed(() => (props.readonly ? undefined : circles.value.find((c) => !c.joker)?.index))
const rows = computed(() => Math.ceil(circles.value.length / props.columns))
const links = computed(() =>
  circles.value
    .filter((c) => c.linked)
    .map((c) => {
      const next = circles.value[c.index + 1]
      const from = center(c.row, c.column)
      const to = center(next.row, next.column)
      return { key: c.index, x1: from.x, y1: from.y, x2: to.x, y2: to.y, color: RARITY_COLORS[c.rarity!] }
    }),
)
const width = computed(() => props.columns * geometry.value.size + (props.columns - 1) * geometry.value.columnGap)
const height = computed(() => rows.value * geometry.value.size + (rows.value - 1) * geometry.value.rowGap)

// Hover preview: the circle under the pointer (by index, so that after a click removes a joker the preview follows
// the joker now in that circle) and its position on screen.
const hovered = ref<{ index: number; anchor: DOMRect } | null>(null)
const previewElement = ref<HTMLElement | null>(null)
const previewPosition = ref({ left: 0, top: 0 })
const preview = computed(() => {
  const id = hovered.value && circles.value[hovered.value.index]?.joker
  const joker = id ? jokerById.get(id) : undefined
  return joker ? { joker, copies: props.loadout.jokers[joker.id] ?? 0 } : null
})

function showPreview(index: number, target: EventTarget | null) {
  if (target instanceof HTMLElement) hovered.value = { index, anchor: target.getBoundingClientRect() }
}
function onPointerEnter(index: number, event: PointerEvent) {
  // Touch: a tap removes the joker, a preview would only get in the way.
  if (event.pointerType === 'mouse') showPreview(index, event.currentTarget)
}
function onFocus(index: number, event: FocusEvent) {
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.matches(':focus-visible')) {
    showPreview(index, event.currentTarget)
  }
}
function hidePreview() {
  hovered.value = null
}

// Beside the circle, on the side with room (left first: the slots are on the right of the jokers page), centered on
// it and kept inside the window.
const GAP = 12
watch(
  [preview, hovered],
  () => {
    const card = previewElement.value
    if (!card || !hovered.value) return
    const { anchor } = hovered.value
    const { offsetWidth: w, offsetHeight: h } = card
    const left = anchor.left - GAP - w >= GAP ? anchor.left - GAP - w : Math.min(anchor.right + GAP, innerWidth - GAP - w)
    const top = Math.min(Math.max(anchor.top + anchor.height / 2 - h / 2, GAP), innerHeight - GAP - h)
    previewPosition.value = { left: Math.max(left, GAP), top: Math.max(top, GAP) }
  },
  { flush: 'post' },
)
// The position is computed once: scrolling would leave the card behind.
onMounted(() => addEventListener('scroll', hidePreview, { capture: true, passive: true }))
onBeforeUnmount(() => removeEventListener('scroll', hidePreview, { capture: true }))
</script>

<template>
  <div
    class="slots"
    :style="{
      '--size': `${geometry.size / 10}rem`,
      '--column-gap': `${geometry.columnGap / 10}rem`,
      '--row-gap': `${geometry.rowGap / 10}rem`,
      gridTemplateColumns: `repeat(${columns}, var(--size))`,
    }"
  >
    <svg
      class="links"
      :viewBox="`0 0 ${width} ${height}`"
      :style="{ width: `${width / 10}rem`, height: `${height / 10}rem` }"
      aria-hidden="true"
    >
      <line
        v-for="l in links"
        :key="l.key"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
        :stroke="l.color"
        :stroke-width="size / 6"
        stroke-linecap="round"
      />
    </svg>
    <template v-for="c in circles" :key="c.index">
      <component
        :is="readonly ? 'span' : 'button'"
        :type="readonly ? undefined : 'button'"
        :role="readonly ? 'img' : undefined"
        class="circle"
        :class="{ used: c.joker, free: !c.joker, next: c.index === firstFree, prestige: c.label === 'P', readonly }"
        :style="{ gridRow: c.row + 1, gridColumn: c.column + 1, '--rarity': c.rarity ? RARITY_COLORS[c.rarity] : undefined }"
        :title="c.title || undefined"
        :aria-label="c.joker ? language.gameName(c.joker) : c.title"
        @click="!readonly && emit('select', c.joker)"
        @pointerenter="c.joker && onPointerEnter(c.index, $event)"
        @pointerleave="hidePreview"
        @focus="c.joker && onFocus(c.index, $event)"
        @blur="hidePreview"
      >
        <img v-if="c.joker" :src="iconUrl(c.joker)" alt="" />
        <template v-else>{{ c.index === firstFree ? '+' : c.label }}</template>
      </component>
    </template>
    <Teleport to="body">
      <div
        v-if="preview"
        ref="previewElement"
        class="preview"
        :style="{ left: `${previewPosition.left}px`, top: `${previewPosition.top}px` }"
        aria-hidden="true"
      >
        <JokerCard :joker="preview.joker" :copies="preview.copies" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slots {
  display: grid;
  gap: var(--row-gap) var(--column-gap);
  grid-auto-rows: var(--size);
  position: relative;
}
.circle {
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  font-family: var(--font-title);
  font-size: calc(var(--size) * 0.3);
  height: var(--size);
  justify-content: center;
  overflow: hidden;
  padding: 0;
  position: relative;
  width: var(--size);
  z-index: 1;
}
.used {
  background: var(--rarity);
  border: 3px solid color-mix(in srgb, var(--rarity) 60%, white);
  box-shadow: 0 0 12px color-mix(in srgb, var(--rarity) 70%, transparent);
}
.used img {
  height: 140%;
  object-fit: cover;
  width: 100%;
}
.free {
  background: rgb(0 0 0 / 35%);
  border: 2px solid rgb(255 255 255 / 10%);
  color: rgb(255 255 255 / 30%);
}
.free.next {
  border-color: var(--accent);
  color: var(--accent);
  font-size: calc(var(--size) * 0.5);
}
.free.prestige {
  border-style: dashed;
}
.circle.readonly {
  cursor: default;
}
.circle:not(.readonly):hover {
  outline: 3px solid var(--accent);
}
.preview {
  pointer-events: none;
  position: fixed;
  width: 11.5rem;
  z-index: 10;
}
.links {
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  z-index: 0;
}
</style>
