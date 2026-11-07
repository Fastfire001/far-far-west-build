// The build being edited. The rules live in src/domain/: this store only holds the state, derives the problems
// and requirements from it, and calls the domain operations. Actions that the editor offers as clicks (adding a
// joker, an upgrade point) check first that they are allowed, so the editor never creates an invalid build; an
// imported build may still be invalid, and its problems are shown.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as ops from '@/domain/build'
import { CARRIERS, targetLoadout, type Build, type CarrierKey, type Target } from '@/domain/build'
import { decodeShareCode, encodeShareCode } from '@/domain/shareCode'
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

  /** Equips a weapon; the one taken off keeps its jokers and upgrades, and the new one gets its own back. */
  function setWeapon(carrier: 'main' | 'sidearm', weapon: string | null) {
    build.value = ops.setWeapon(build.value, carrier, weapon)
  }

  /** Sets the element of the equipped sidearm, or of the given sidearm. */
  function setElement(element: string | null, weapon: string | null = null) {
    build.value = ops.setElement(build.value, element, weapon)
  }

  /** Removes the upgrades, jokers and element of a carrier or weapon. */
  function clearLoadout(target: Target) {
    build.value = ops.clearLoadout(build.value, target)
  }

  function setUtility(utility: string | null) {
    build.value = ops.setUtility(build.value, utility)
  }

  /** Adds one copy of a joker if the carrier or weapon has room for it. Returns whether it was added. */
  function addJoker(target: Target, joker: string): boolean {
    if (jokerAddBlocker(build.value, target, joker)) return false
    build.value = ops.addJoker(build.value, target, joker)
    return true
  }

  function removeJoker(target: Target, joker: string) {
    build.value = ops.removeJoker(build.value, target, joker)
  }

  /** Adds (delta > 0) or removes (delta < 0) upgrade points, within the stat maximum and the carrier budget. */
  function changeUpgrade(target: Target, upgrade: string, delta: number) {
    const current = targetLoadout(build.value, target).upgrades[upgrade] ?? 0
    const step = delta > 0 ? Math.min(delta, upgradeRoom(build.value, target, upgrade)) : Math.max(delta, -current)
    if (step !== 0) build.value = ops.setUpgradePoints(build.value, target, upgrade, current + step)
  }

  function placeSpell(slot: number, spell: string) {
    build.value = ops.placeSpell(build.value, slot, spell)
  }

  function clearSpellSlot(slot: number) {
    build.value = ops.clearSpellSlot(build.value, slot)
  }

  function exportText(): string {
    return encodeShareCode(build.value)
  }

  /** Loads a share code or link. Throws a BuildImportError if the text is not one; an invalid build is still loaded. */
  function importText(text: string) {
    build.value = decodeShareCode(text)
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
    clearLoadout,
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
