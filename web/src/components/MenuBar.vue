<script setup lang="ts">
// Top bar: game version on the left, title in the middle, language and builds menus on the right.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { gameMeta } from '@/domain/gameData'
import { LANGUAGE_NAMES, LOCALES, type Locale } from '@/i18n'
import { useLanguageStore } from '@/stores/language'
import { useLibraryStore } from '@/stores/library'
import BuildTextDialogs from './BuildTextDialogs.vue'

const { t } = useI18n()
const router = useRouter()
const language = useLanguageStore()
const library = useLibraryStore()
const buildsOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)

const buildsMenu = ref<HTMLElement>()

/** Closes the builds menu when the focus leaves it (not when it moves to one of its entries). */
function onFocusOut(event: FocusEvent) {
  if (!buildsMenu.value?.contains(event.relatedTarget as Node | null)) buildsOpen.value = false
}

/** Runs a builds menu entry and closes the menu. */
function menu(action: () => void) {
  buildsOpen.value = false
  action()
}

function newBuild() {
  library.newBuild()
  router.push({ name: 'home' })
}

const extractedOn = computed(() =>
  new Intl.DateTimeFormat(language.locale, { dateStyle: 'short' }).format(new Date(`${gameMeta.extracted_on}T00:00:00`)),
)

function onLocaleChange(event: Event) {
  language.chooseLocale((event.target as HTMLSelectElement).value as Locale)
}
</script>

<template>
  <header class="menu-bar">
    <p class="version">
      <span class="long">{{ t('menu.version', { version: gameMeta.game_version, date: extractedOn }) }}</span>
      <span class="short">{{ t('menu.versionShort', { version: gameMeta.game_version, date: extractedOn }) }}</span>
    </p>
    <h1 class="title">{{ t('app.title') }}</h1>
    <div class="controls">
      <label class="language">
        <span class="sr-only">{{ t('game.language') }}</span>
        <select :value="language.locale" @change="onLocaleChange">
          <option v-for="l in LOCALES" :key="l" :value="l">{{ LANGUAGE_NAMES[l] }}</option>
        </select>
      </label>
      <div ref="buildsMenu" class="builds" @focusout="onFocusOut" @keydown.esc="buildsOpen = false">
        <button type="button" :aria-expanded="buildsOpen" :aria-label="t('menu.builds')" @click="buildsOpen = !buildsOpen">
          <span class="long">{{ t('menu.builds') }} ▾</span>
          <span class="short" aria-hidden="true">☰</span>
        </button>
        <ul v-if="buildsOpen" class="builds-menu">
          <li v-if="!library.available" class="unavailable">{{ t('menu.unavailable') }}</li>
          <li><button type="button" @click="menu(newBuild)">{{ t('menu.newBuild') }}</button></li>
          <li>
            <button type="button" @click="menu(() => router.push({ name: 'builds' }))">{{ t('menu.myBuilds') }}</button>
          </li>
          <li><button type="button" @click="menu(() => (importOpen = true))">{{ t('menu.import') }}</button></li>
          <li><button type="button" @click="menu(() => (exportOpen = true))">{{ t('menu.export') }}</button></li>
        </ul>
      </div>
    </div>
    <BuildTextDialogs v-model:export="exportOpen" v-model:import="importOpen" />
  </header>
</template>

<style scoped>
.menu-bar {
  align-items: center;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--line);
  display: grid;
  gap: 0.5rem 1rem;
  grid-template-columns: 1fr auto 1fr;
  padding: 0.6rem 1.5rem;
}
.version {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0;
}
.title {
  font-size: 1.4rem;
  white-space: nowrap;
}
.controls {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
select,
.builds > button {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
}
select option {
  background: var(--bg-deep);
}
.builds {
  position: relative;
}
.builds-menu {
  background: var(--bg-deep);
  border: 1px solid var(--line);
  border-radius: 4px;
  list-style: none;
  margin: 0.25rem 0 0;
  min-width: 12rem;
  padding: 0.3rem 0;
  position: absolute;
  right: 0;
  z-index: 10;
}
.builds-menu button {
  background: none;
  border: 0;
  padding: 0.4rem 0.9rem;
  text-align: left;
  width: 100%;
}
.builds-menu button:hover {
  background: var(--panel);
  color: var(--accent);
}
.unavailable {
  color: var(--danger);
  font-size: 0.8rem;
  padding: 0.2rem 0.9rem;
}
.short {
  display: none;
}
.sr-only {
  clip: rect(0 0 0 0);
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Phone: the title on its own line, then the version and the controls. */
@media (max-width: 48rem) {
  .menu-bar {
    grid-template-columns: 1fr auto;
    padding: 0.5rem 1rem;
  }
  .title {
    font-size: 1.15rem;
    grid-column: 1 / -1;
    order: -1;
  }
  .version {
    font-size: 0.75rem;
  }
  .long {
    display: none;
  }
  .short {
    display: inline;
  }
  select {
    max-width: 9rem;
  }
}
</style>
