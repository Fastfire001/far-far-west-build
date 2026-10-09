<script setup lang="ts">
// Placeholder screen: shows that the game data, the icons and both kinds of translations are wired up.
import { useI18n } from 'vue-i18n'
import { equipment, HERO_ID, spellSchools, type EquipmentType } from './domain/gameData'
import { LOCALES, type Locale } from './i18n'
import { iconUrl } from './icons'
import { useLanguageStore } from './stores/language'

const { t } = useI18n()
const language = useLanguageStore()
const { gameName, gameDescription } = language

const groups: { type: EquipmentType; items: typeof equipment }[] = (['main', 'sidearm', 'utility'] as const).map(
  (type) => ({ type, items: equipment.filter((e) => e.type === type) }),
)
</script>

<template>
  <header>
    <h1>{{ t('app.title') }}</h1>
    <label>
      {{ t('language') }}
      <select :value="language.locale" @change="language.setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="l in LOCALES" :key="l" :value="l">{{ l }}</option>
      </select>
    </label>
  </header>

  <main>
    <section>
      <h2>{{ t('carrier.hero') }}</h2>
      <img :src="iconUrl(HERO_ID)" alt="" width="48" height="48" />
    </section>

    <section v-for="group in groups" :key="group.type">
      <h2>{{ t(`carrier.${group.type}`) }}</h2>
      <ul>
        <li v-for="item in group.items" :key="item.id" :title="gameDescription(item.id)">
          <img :src="iconUrl(item.id)" alt="" width="48" height="48" />
          {{ gameName(item.id) }}
        </li>
      </ul>
    </section>

    <section>
      <h2>{{ t('spells') }}</h2>
      <ul>
        <li v-for="school in spellSchools" :key="school.id" :title="gameDescription(school.id)">
          <img :src="iconUrl(school.id)" alt="" width="48" height="48" />
          {{ gameName(school.id) }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0 auto;
  max-width: 64rem;
  padding: 1rem;
}
header {
  align-items: baseline;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}
ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  list-style: none;
  padding: 0;
}
li {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 6rem;
  text-align: center;
}
</style>
