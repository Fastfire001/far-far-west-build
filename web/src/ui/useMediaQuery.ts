import { onScopeDispose, ref } from 'vue'

/** Reactive result of a CSS media query, e.g. useMediaQuery('(max-width: 56rem)'). */
export function useMediaQuery(query: string) {
  const list = window.matchMedia(query)
  const matches = ref(list.matches)
  const update = (event: MediaQueryListEvent) => (matches.value = event.matches)
  list.addEventListener('change', update)
  onScopeDispose(() => list.removeEventListener('change', update))
  return matches
}
