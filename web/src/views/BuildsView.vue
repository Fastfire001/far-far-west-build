<script setup lang="ts">
// The saved builds: open one (click), duplicate or delete it, or start a new one.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/stores/language'
import { useLibraryStore, type SavedBuild } from '@/stores/library'
import { iconUrl } from '@/icons'
import BackButton from '@/components/BackButton.vue'
import WoodPlank from '@/components/WoodPlank.vue'

const { t } = useI18n()
const router = useRouter()
const library = useLibraryStore()
const language = useLanguageStore()

const sorted = computed(() => [...library.builds].sort((a, b) => b.updatedAt - a.updatedAt))
const dateFormat = computed(() => new Intl.DateTimeFormat(language.locale, { dateStyle: 'medium', timeStyle: 'short' }))

function name(entry: SavedBuild): string {
  return entry.build.name || t('home.untitled')
}

function icons(entry: SavedBuild): string[] {
  const b = entry.build
  return [b.main.weapon, b.sidearm.weapon, b.sidearm.element, b.utility, ...b.spells].filter(
    (id): id is string => id !== null && iconUrl(id) !== undefined,
  )
}

function open(entry: SavedBuild) {
  library.open(entry.id)
  router.push({ name: 'home' })
}

function newBuild() {
  library.newBuild()
  router.push({ name: 'home' })
}

function remove(entry: SavedBuild) {
  if (window.confirm(t('builds.confirmDelete', { name: name(entry) }))) library.remove(entry.id)
}
</script>

<template>
  <main class="page builds-page">
    <BackButton />
    <h1>{{ t('builds.title') }}</h1>
    <p v-if="!library.available" class="warning">{{ t('builds.unavailable') }}</p>

    <WoodPlank class="new" @click="newBuild">{{ t('menu.newBuild') }}</WoodPlank>

    <ul class="list">
      <li v-for="entry in sorted" :key="entry.id" class="row" :class="{ current: entry.id === library.currentId }">
        <button type="button" class="open" @click="open(entry)">
          <span class="name">
            {{ name(entry) }}
            <span v-if="entry.id === library.currentId" class="badge">{{ t('builds.current') }}</span>
          </span>
          <span class="icons">
            <img v-for="(id, i) in icons(entry)" :key="i" :src="iconUrl(id)" :alt="language.gameName(id)" />
          </span>
          <span class="date">{{ t('builds.updated', { date: dateFormat.format(entry.updatedAt) }) }}</span>
        </button>
        <span class="row-actions">
          <button type="button" class="small" @click="library.duplicate(entry.id, t('builds.copyName', { name: name(entry) }))">
            {{ t('builds.duplicate') }}
          </button>
          <button type="button" class="small danger" @click="remove(entry)">{{ t('builds.delete') }}</button>
        </span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.builds-page {
  max-width: 56rem;
}
h1 {
  color: var(--accent);
  font-size: clamp(2rem, 5vw, 3rem);
  margin: 0.5rem 0 1rem;
}
.warning {
  color: var(--danger);
}
.new {
  margin-bottom: 1.5rem;
  max-width: 24rem;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.row {
  align-items: center;
  background: var(--panel);
  border-left: 4px solid transparent;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.6rem 0.9rem;
}
.row.current {
  border-left-color: var(--accent);
}
.open {
  background: none;
  border: 0;
  cursor: pointer;
  display: grid;
  flex: 1;
  gap: 0.3rem 1rem;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: min(100%, 18rem);
  padding: 0;
  text-align: left;
}
.open:hover .name {
  color: var(--accent);
}
.name {
  font-family: var(--font-title);
  font-size: 1.4rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge {
  background: var(--accent);
  border-radius: 3px;
  color: var(--plank-text);
  font-size: 0.8rem;
  margin-left: 0.4rem;
  padding: 0.05rem 0.4rem;
  vertical-align: middle;
}
.icons {
  display: flex;
  gap: 0.25rem;
  grid-row: span 2;
}
.icons img {
  height: 2rem;
  width: 2rem;
}
.date {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.row-actions {
  display: flex;
  gap: 0.5rem;
}
.small {
  background: none;
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  padding: 0.3rem 0.7rem;
}
.small:hover {
  border-color: var(--accent);
}
.small.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}
@media (max-width: 40rem) {
  .open {
    grid-template-columns: minmax(0, 1fr);
  }
  .icons {
    grid-row: auto;
  }
}
</style>
