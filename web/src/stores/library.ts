// The saved builds, in the browser's localStorage (docs/build-planner.md, "Saving and sharing"). The build being
// edited is saved on every change: there is no save button. A build left blank is dropped when another one is
// opened. If localStorage is not available (blocked storage, some private modes), everything works without saving.
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { emptyBuild, type Build } from '@/domain/build'
import { decodeBuild, restoreBuild, storedBuild } from '@/domain/codec'
import { useBuildStore } from './build'

export const STORAGE_KEY = 'ffw-build-planner'

export interface SavedBuild {
  id: string
  build: Build
  /** Last change, in milliseconds since the epoch. */
  updatedAt: number
}

interface Stored {
  currentId: string
  builds: { id: string; updatedAt: number; build: unknown }[]
}

function newId(): string {
  // crypto.randomUUID() only exists on secure origins (https, localhost).
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function isBlank(build: Build): boolean {
  return JSON.stringify(build) === JSON.stringify(emptyBuild())
}

export const useLibraryStore = defineStore('library', () => {
  const editor = useBuildStore()
  const builds = ref<SavedBuild[]>([])
  const currentId = ref('')
  /** False when localStorage cannot be used: builds are not saved. */
  const available = ref(true)

  function read(): Stored | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Stored) : null
    } catch {
      available.value = false
      return null
    }
  }

  function write() {
    const data: Stored = {
      currentId: currentId.value,
      builds: builds.value.map((b) => ({ id: b.id, updatedAt: b.updatedAt, build: storedBuild(b.build) })),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      available.value = true
    } catch {
      available.value = false
    }
  }

  function current(): SavedBuild | undefined {
    return builds.value.find((b) => b.id === currentId.value)
  }

  /** Makes a saved build the one being edited, dropping the previous one if it was left blank. */
  function switchTo(entry: SavedBuild) {
    const previous = current()
    if (previous && previous.id !== entry.id && isBlank(previous.build)) {
      builds.value = builds.value.filter((b) => b.id !== previous.id)
    }
    currentId.value = entry.id
    editor.load(entry.build)
    write()
  }

  function add(build: Build): SavedBuild {
    const entry = { id: newId(), build, updatedAt: Date.now() }
    builds.value = [entry, ...builds.value]
    return entry
  }

  /** Loads the saved builds and opens the last one edited. Saves every change of the editor from then on. */
  function init() {
    const stored = read()
    const restored: SavedBuild[] = []
    for (const b of stored?.builds ?? []) {
      try {
        restored.push({ id: String(b.id), updatedAt: Number(b.updatedAt) || 0, build: restoreBuild(b.build) })
      } catch {
        // A build the planner cannot read (e.g. from a newer version) is left out.
      }
    }
    builds.value = restored
    const entry = restored.find((b) => b.id === stored?.currentId) ?? restored[0] ?? add(emptyBuild())
    currentId.value = entry.id
    editor.load(entry.build)
    write()

    watch(
      () => editor.build,
      (build) => {
        const entry = current()
        // Opening a build loads its own object: not a change.
        if (!entry || entry.build === build) return
        entry.build = build
        entry.updatedAt = Date.now()
        write()
      },
    )
  }

  function newBuild() {
    const entry = current()
    if (entry && isBlank(entry.build)) return
    switchTo(add(emptyBuild()))
  }

  function open(id: string) {
    const entry = builds.value.find((b) => b.id === id)
    if (entry) switchTo(entry)
  }

  function duplicate(id: string, name: string) {
    const entry = builds.value.find((b) => b.id === id)
    // Builds are plain JSON (structuredClone cannot copy reactive proxies).
    if (entry) switchTo(add({ ...(JSON.parse(JSON.stringify(entry.build)) as Build), name }))
  }

  function remove(id: string) {
    builds.value = builds.value.filter((b) => b.id !== id)
    if (id === currentId.value) {
      const next = [...builds.value].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? add(emptyBuild())
      currentId.value = next.id
      editor.load(next.build)
    }
    write()
  }

  /** Imports an exported build as a new saved build and opens it. Throws a BuildImportError if the text is not one. */
  function importText(text: string) {
    switchTo(add(decodeBuild(text)))
  }

  /** Opens a build received by a share link: the saved copy if one is identical, otherwise a new saved build. */
  function openShared(build: Build) {
    // Compared in their stored form, where the keys always come in the same order.
    const key = (b: Build) => JSON.stringify(restoreBuild(storedBuild(b)))
    const json = key(build)
    switchTo(builds.value.find((b) => key(b.build) === json) ?? add(build))
  }

  return { builds, currentId, available, init, newBuild, open, duplicate, remove, importText, openShared }
})
