// The build being edited. The rules live in src/domain/: this store only holds the state, derives the problems
// and requirements from it, and calls the domain operations. Actions that the editor offers as clicks (adding a
// joker, an upgrade point) check first that they are allowed, so the editor never creates an invalid build; an
// imported build may still be invalid, and its problems are shown.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as ops from '@/domain/build'
import { CARRIERS, type Build, type CarrierKey } from '@/domain/build'
import { decodeBuild, encodeBuild } from '@/domain/codec'
import { requirements, type Requirements } from '@/domain/progression'
import { jokerAddBlocker, upgradeRoom, validateBuild } from '@/domain/validation'

export const useBuildStore = defineStore('build', () => {
  const build = ref<Build>(ops.emptyBuild())

  const problems = computed(() => validateBuild(build.value))
  const requirementsByCarrier = computed(
    () => Object.fromEntries(CARRIERS.map((c) => [c, requirements(build.value[c])])) as Record<CarrierKey, Requirements>,
  )

  /** Replaces the build being edited (new, opened or imported build). */
  function load(value: Build) {
    build.value = value
  }

  function reset(name = '') {
    build.value = ops.emptyBuild(name)
  }

  function rename(name: string) {
    build.value = ops.rename(build.value, name)
  }

  /** Equips a weapon; changing weapons clears the carrier's jokers and upgrades. */
  function setWeapon(carrier: 'main' | 'sidearm', weapon: string | null) {
    build.value = ops.setWeapon(build.value, carrier, weapon)
  }

  function setElement(element: string | null) {
    build.value = ops.setElement(build.value, element)
  }

  function setUtility(utility: string | null) {
    build.value = ops.setUtility(build.value, utility)
  }

  /** Adds one copy of a joker if the carrier has room for it. Returns whether it was added. */
  function addJoker(carrier: CarrierKey, joker: string): boolean {
    if (jokerAddBlocker(build.value, carrier, joker)) return false
    build.value = ops.addJoker(build.value, carrier, joker)
    return true
  }

  function removeJoker(carrier: CarrierKey, joker: string) {
    build.value = ops.removeJoker(build.value, carrier, joker)
  }

  /** Adds (delta > 0) or removes (delta < 0) upgrade points, within the stat maximum and the carrier budget. */
  function changeUpgrade(carrier: CarrierKey, upgrade: string, delta: number) {
    const current = build.value[carrier].upgrades[upgrade] ?? 0
    const step = delta > 0 ? Math.min(delta, upgradeRoom(build.value, carrier, upgrade)) : Math.max(delta, -current)
    if (step !== 0) build.value = ops.setUpgradePoints(build.value, carrier, upgrade, current + step)
  }

  function placeSpell(slot: number, spell: string) {
    build.value = ops.placeSpell(build.value, slot, spell)
  }

  function clearSpellSlot(slot: number) {
    build.value = ops.clearSpellSlot(build.value, slot)
  }

  function exportText(): string {
    return encodeBuild(build.value)
  }

  /** Loads an exported build. Throws a BuildImportError if the text is not one; an invalid build is still loaded. */
  function importText(text: string) {
    build.value = decodeBuild(text)
  }

  return {
    build,
    problems,
    requirements: requirementsByCarrier,
    load,
    reset,
    rename,
    setWeapon,
    setElement,
    setUtility,
    addJoker,
    removeJoker,
    changeUpgrade,
    placeSpell,
    clearSpellSlot,
    exportText,
    importText,
  }
})
