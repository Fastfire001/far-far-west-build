<script setup lang="ts">
// Weapon or utility choice: the items as planks on the left, the selected one in detail on the right with EQUIP and
// CUSTOMIZE.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { equipment, type EquipmentType } from '@/domain/gameData'
import { iconUrl } from '@/icons'
import { useBuildStore } from '@/stores/build'
import { useLanguageStore } from '@/stores/language'
import BackButton from '@/components/BackButton.vue'
import WoodPlank from '@/components/WoodPlank.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBuildStore()
const language = useLanguageStore()

const slot = computed(() => route.params.slot as EquipmentType)
const items = computed(() => equipment.filter((e) => e.type === slot.value))
const equipped = computed(() => (slot.value === 'utility' ? store.build.utility : store.build[slot.value].weapon))

/** Item shown in detail: the equipped one at first. */
const selected = ref<string | null>(null)
watch(slot, () => (selected.value = equipped.value ?? items.value[0]?.id ?? null), { immediate: true })

const isWeapon = computed(() => slot.value !== 'utility')
const isEquipped = computed(() => selected.value !== null && selected.value === equipped.value)
/** Equipping another weapon clears the jokers and upgrades of the current one: warn when there are some. */
const clearsLoadout = computed(() => {
  if (slot.value === 'utility' || isEquipped.value || !equipped.value) return false
  const loadout = store.build[slot.value]
  return Object.keys(loadout.jokers).length > 0 || Object.keys(loadout.upgrades).length > 0
})

function equip() {
  if (!selected.value) return
  if (slot.value === 'utility') store.setUtility(selected.value)
  else store.setWeapon(slot.value, selected.value)
}

function customize() {
  equip()
  router.push({ name: 'customize', params: { carrier: slot.value } })
}
</script>

<template>
  <main class="page picker">
    <BackButton class="back" />

    <section class="list">
      <h1>{{ t(`game.${slot === 'main' ? 'main_weapon' : slot}`) }}</h1>
      <div class="planks">
        <WoodPlank
          v-for="item in items"
          :key="item.id"
          :active="item.id === selected"
          :checked="item.id === equipped"
          @click="selected = item.id"
        >
          <template #icon><img :src="iconUrl(item.id)" alt="" /></template>
          {{ language.gameName(item.id) }}
        </WoodPlank>
      </div>
    </section>

    <section v-if="selected" class="detail" aria-live="polite">
      <img class="big-icon" :src="iconUrl(selected)" alt="" />
      <h2>{{ language.gameName(selected) }}</h2>
      <p class="description">{{ language.gameDescription(selected) }}</p>
      <div class="actions">
        <button type="button" class="action" :disabled="isEquipped" @click="equip">
          {{ isEquipped ? t('game.already_equipped') : t('game.equip') }}
        </button>
        <button v-if="isWeapon" type="button" class="action" @click="customize">🔧 {{ t('game.customize') }}</button>
      </div>
      <p v-if="clearsLoadout" class="warning">
        ⓘ {{ t('picker.clearsLoadout', { weapon: language.gameName(equipped!) }) }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.picker {
  display: grid;
  gap: 1rem 4rem;
  grid-template-areas: 'back back' 'list detail';
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.back {
  grid-area: back;
}
.list {
  grid-area: list;
}
.list h1 {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}
.planks {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 34rem;
}
.detail {
  align-items: center;
  align-self: start;
  display: flex;
  flex-direction: column;
  grid-area: detail;
  position: sticky;
  text-align: center;
  top: 1rem;
}
.big-icon {
  height: 11rem;
  margin: 1rem 0 1.5rem;
  width: 11rem;
}
.detail h2 {
  color: var(--accent);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.05;
}
.description {
  font-size: 1.1rem;
  line-height: 1.45;
  margin: 0.75rem 0 1.5rem;
  max-width: 36rem;
  white-space: pre-line;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
.action {
  background: linear-gradient(180deg, var(--plank-light), var(--plank));
  border: 2px solid var(--plank-dark);
  color: var(--plank-text);
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 600;
  padding: 0.45rem 1.1rem;
  text-transform: uppercase;
}
.action:hover:not(:disabled) {
  box-shadow: 0 0 0 2px var(--accent), 0 0 12px rgb(244 181 47 / 50%);
}
.action:disabled {
  cursor: default;
  opacity: 0.55;
}
.warning {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 1rem;
  max-width: 30rem;
}
/* Phone: the detail first (with its buttons), then the list. */
@media (max-width: 56rem) {
  .picker {
    grid-template-areas: 'back' 'detail' 'list';
    grid-template-columns: minmax(0, 1fr);
  }
  .detail {
    position: static;
  }
  .big-icon {
    height: 6rem;
    margin: 0 0 0.75rem;
    width: 6rem;
  }
  .description {
    font-size: 1rem;
  }
}
</style>
