<script setup lang="ts">
// The planner's settings (see stores/settings.ts), applied and saved as soon as they are changed.
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import AppDialog from './AppDialog.vue'

const open = defineModel<boolean>({ required: true })

const { t } = useI18n()
const { settings } = useSettingsStore()
</script>

<template>
  <AppDialog v-model="open" :title="t('menu.settings')">
    <label class="setting">
      <input v-model="settings.summaryInEnglish" type="checkbox" />
      {{ t('settings.summaryInEnglish') }}
    </label>
  </AppDialog>
</template>

<style scoped>
.setting {
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 0.6rem;
}
input {
  accent-color: var(--accent);
  height: 1.1rem;
  width: 1.1rem;
}
</style>
