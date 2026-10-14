<script setup lang="ts">
// A joker as a card in the game's format: slot cost as dots, copies equipped, name, icon, description, max copies and
// the level that unlocks a Unique joker. A button in the jokers catalog, a plain block in the slots' hover preview.
import { useI18n } from 'vue-i18n'
import type { Joker } from '@/domain/gameData'
import { uniqueUnlockLevel } from '@/domain/progression'
import { iconUrl } from '@/icons'
import { useLanguageStore } from '@/stores/language'
import { RARITY_COLORS } from '@/ui/colors'

withDefaults(
  defineProps<{
    joker: Joker
    /** Copies equipped on the carrier (0: not equipped). */
    copies?: number
    /** Why the joker cannot be added (red frame), empty if it can. */
    reason?: string
    tag?: 'button' | 'div'
  }>(),
  { copies: 0, reason: '', tag: 'div' },
)

const { t } = useI18n()
const language = useLanguageStore()
</script>

<template>
  <component
    :is="tag"
    :type="tag === 'button' ? 'button' : undefined"
    class="card"
    :class="{ equipped: copies > 0, blocked: reason, interactive: tag === 'button' }"
    :style="{ '--rarity': RARITY_COLORS[joker.rarity] }"
    :aria-disabled="tag === 'button' ? Boolean(reason) : undefined"
  >
    <span class="top">
      <span class="cost" :aria-label="t('jokers.cost', joker.slot_cost)">
        <span v-for="n in joker.slot_cost" :key="n" class="cost-dot" />
      </span>
      <span v-if="copies" class="copies">×{{ copies }}</span>
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
    <span v-if="reason" class="reason">{{ reason }}</span>
  </component>
</template>

<style scoped>
.card {
  align-items: center;
  background: linear-gradient(180deg, #c9c3cf, #a9a2b0);
  border: 3px solid var(--rarity);
  border-radius: 10px;
  box-shadow: inset 0 0 0 3px rgb(255 255 255 / 25%);
  color: #2a2430;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  padding: 0.6rem 0.75rem 0.7rem;
  position: relative;
  text-align: center;
  width: 100%;
}
.card.interactive {
  cursor: pointer;
  opacity: 0.6;
}
.card.interactive:hover,
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
</style>
