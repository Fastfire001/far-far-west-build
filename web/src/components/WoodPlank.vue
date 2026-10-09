<script setup lang="ts">
// A wooden plank, like the game's equipment menus: an icon, then a label in capitals. A link with `to`, otherwise a
// button.
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  to?: RouteLocationRaw
  /** Greyed label: nothing chosen yet. */
  empty?: boolean
  /** Highlighted plank: the item shown in detail. */
  active?: boolean
  /** Check mark: the equipped item. */
  checked?: boolean
}>()
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="plank"
    :class="{ empty, active }"
    :aria-pressed="to ? undefined : active"
  >
    <span class="icons"><slot name="icon" /></span>
    <span class="label"><slot /></span>
    <span v-if="checked" class="check" aria-hidden="true">✔</span>
  </component>
</template>

<style scoped>
.plank {
  align-items: center;
  background:
    repeating-linear-gradient(176deg, transparent 0 9px, rgb(120 70 25 / 10%) 9px 11px),
    linear-gradient(180deg, var(--plank-light), var(--plank) 45%, #c58c45);
  border: 3px solid var(--plank-dark);
  box-shadow:
    inset 0 0 0 3px rgb(255 235 200 / 45%),
    inset 0 0 0 5px rgb(141 92 44 / 60%),
    0 5px 0 rgb(0 0 0 / 35%);
  color: var(--plank-text);
  cursor: pointer;
  display: flex;
  gap: 1rem;
  min-height: 4.5rem;
  padding: 0.5rem 1.25rem 0.5rem 0.75rem;
  text-align: inherit;
  text-decoration: none;
  transition: transform 0.1s, box-shadow 0.1s;
}
.plank:hover,
.plank.active {
  box-shadow:
    inset 0 0 0 3px rgb(255 235 200 / 45%),
    inset 0 0 0 5px rgb(141 92 44 / 60%),
    0 0 0 3px var(--accent),
    0 0 18px 2px rgb(244 181 47 / 55%);
}
.plank:hover {
  transform: translateY(-1px);
}
.icons {
  display: flex;
  flex: none;
  gap: 0.3rem;
}
.icons :deep(img) {
  display: block;
  height: 3rem;
  width: 3rem;
}
.label {
  flex: 1;
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.1;
  text-align: right;
  text-transform: uppercase;
}
.empty .label {
  color: rgb(43 33 27 / 55%);
}
.check {
  color: var(--accent);
  font-size: 1.6rem;
  text-shadow: 0 1px 0 var(--plank-dark);
}
@media (max-width: 40rem) {
  .label {
    font-size: 1.25rem;
  }
  .icons :deep(img) {
    height: 2.4rem;
    width: 2.4rem;
  }
}
</style>
