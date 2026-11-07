// What the Customize and Jokers screens edit: the route's carrier and, for a weapon carrier, the weapon of its
// `?weapon=` query, equipped or not (the equipped weapon without it). A weapon that is not one of that carrier is
// ignored.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isTargetEquipped, targetElement, targetItem, targetLoadout, type CarrierKey, type Target } from '@/domain/build'
import { equipmentById } from '@/domain/gameData'
import { requirements as loadoutRequirements } from '@/domain/progression'
import { useBuildStore } from '@/stores/build'

export function useCustomizeTarget() {
  const route = useRoute()
  const store = useBuildStore()

  const carrier = computed(() => route.params.carrier as CarrierKey)
  const weapon = computed(() => {
    const id = route.query.weapon
    if (carrier.value === 'hero' || typeof id !== 'string') return null
    return equipmentById.get(id)?.type === carrier.value ? id : null
  })
  const target = computed<Target>(() => ({ carrier: carrier.value, weapon: weapon.value }))
  /** Item customized: null for a weapon carrier without a weapon. */
  const item = computed(() => targetItem(store.build, target.value))
  const equipped = computed(() => isTargetEquipped(store.build, target.value))
  const loadout = computed(() => targetLoadout(store.build, target.value))
  const element = computed(() => targetElement(store.build, target.value))
  const requirements = computed(() => loadoutRequirements(loadout.value))
  /** Query that keeps the weapon when moving between the two screens. */
  const query = computed(() => (weapon.value ? { weapon: weapon.value } : {}))

  return { carrier, weapon, target, item, equipped, loadout, element, requirements, query }
}
