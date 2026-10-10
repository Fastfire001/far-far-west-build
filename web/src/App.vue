<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MenuBar from './components/MenuBar.vue'
import { pagePath } from './pages/routes'
import { useLanguageStore } from './stores/language'

const { t } = useI18n()
const language = useLanguageStore()

// The static content pages (src/pages/), in the current language.
const guides = computed(() =>
  (['jokers', 'weapons', 'spells', 'progression'] as const).map((key) => ({
    key,
    href: import.meta.env.BASE_URL + pagePath(language.locale, `${key}/`),
  })),
)
</script>

<template>
  <MenuBar />
  <RouterView />
  <footer class="app-footer">
    <nav :aria-label="t('guides.label')">
      <a v-for="guide in guides" :key="guide.key" :href="guide.href">{{ t(`guides.${guide.key}`) }}</a>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--line);
  padding: 1rem 1.5rem;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  justify-content: center;
}
a {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-decoration: none;
}
a:hover {
  color: var(--accent);
}
</style>
