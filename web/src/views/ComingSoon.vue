<script setup lang="ts">
// Placeholder for the screens not built yet.
import { useI18n } from 'vue-i18n'
import BackButton from '@/components/BackButton.vue'

const { t } = useI18n()
</script>

<template>
  <main class="page">
    <BackButton />
    <p>{{ t('comingSoon') }}</p>
  </main>
</template>
