<script setup lang="ts">
// The game's BACK button: returns to the screen named by the route's meta.back.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const target = computed(() => route.meta.back?.(route))
</script>

<template>
  <RouterLink v-if="target" :to="target" class="back">‹ {{ t('game.back') }}</RouterLink>
</template>

<style scoped>
.back {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-decoration: none;
  text-transform: uppercase;
}
.back:hover {
  color: var(--accent);
}
</style>
