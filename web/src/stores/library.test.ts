import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { emptyBuild } from '@/domain/build'
import { useBuildStore } from './build'
import { STORAGE_KEY, useLibraryStore } from './library'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

/** A fresh page load: new Pinia, same storage. */
function reload() {
  setActivePinia(createPinia())
  const library = useLibraryStore()
  library.init()
  return { library, editor: useBuildStore() }
}

describe('library store', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))

  it('saves the build being edited and reopens it', async () => {
    const { editor } = reload()
    editor.rename('Pistolero')
    editor.setWeapon('sidearm', 'itemPistol')
    await nextTick()
    const again = reload()
    expect(again.editor.build).toMatchObject({ name: 'Pistolero', sidearm: { weapon: 'itemPistol' } })
    expect(again.library.builds).toHaveLength(1)
  })

  it('creates, duplicates and removes builds, dropping blank ones', async () => {
    const { library, editor } = reload()
    library.newBuild()
    expect(library.builds).toHaveLength(1) // the current build is still blank
    editor.rename('A')
    await nextTick()
    library.newBuild()
    library.newBuild()
    expect(library.builds).toHaveLength(2)
    const blankId = library.currentId
    const a = library.builds.find((b) => b.build.name === 'A')!
    library.duplicate(a.id, 'A (copy)')
    expect(library.builds.map((b) => b.build.name).sort()).toEqual(['A', 'A (copy)'])
    expect(library.builds.some((b) => b.id === blankId)).toBe(false)
    library.remove(library.currentId)
    expect(editor.build.name).toBe('A')
    expect(reload().library.builds).toHaveLength(1)
  })

  it('imports an exported build as a new build', async () => {
    const { library, editor } = reload()
    editor.rename('Mine')
    await nextTick()
    const text = editor.exportText()
    library.importText(text)
    expect(library.builds).toHaveLength(2)
    expect(() => library.importText('nope')).toThrow()
  })

  it('opens a shared build once, then reopens the same copy', async () => {
    const { library, editor } = reload()
    editor.rename('Mine')
    await nextTick()
    const mineId = library.currentId
    const shared = { ...emptyBuild('Shared'), utility: 'itemUtilityAmmo' }
    library.openShared(shared)
    const sharedId = library.currentId
    expect(editor.build).toEqual(shared)
    library.open(mineId)
    library.openShared({ ...shared })
    expect(library.currentId).toBe(sharedId)
    expect(library.builds).toHaveLength(2)
  })

  it('works without storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    const { library, editor } = reload()
    expect(library.available).toBe(false)
    expect(editor.build.name).toBe('')
  })

  it('skips saved builds it cannot read', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentId: 'x', builds: [{ id: 'x', updatedAt: 1, build: { v: 99 } }] }))
    const { library } = reload()
    expect(library.builds).toHaveLength(1)
    expect(library.builds[0].id).not.toBe('x')
  })
})
