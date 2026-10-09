// Screens of the planner (see docs/maquettes.md). Hash history: GitHub Pages cannot serve index.html for an unknown
// path, so URLs look like /#/customize/main. Each screen names the one its BACK button returns to (meta.back).
import { createRouter, createWebHashHistory, type RouteLocationNormalized, type RouteLocationRaw } from 'vue-router'
import BuildHome from './views/BuildHome.vue'
import ComingSoon from './views/ComingSoon.vue'
import CustomizeView from './views/CustomizeView.vue'
import ItemPicker from './views/ItemPicker.vue'

declare module 'vue-router' {
  interface RouteMeta {
    back?: (route: RouteLocationNormalized) => RouteLocationRaw
  }
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: BuildHome },
    // Weapon or utility choice.
    { path: '/pick/:slot(main|sidearm|utility)', name: 'pick', component: ItemPicker, meta: { back: () => ({ name: 'home' }) } },
    // Upgrades and jokers of a carrier.
    {
      path: '/customize/:carrier(hero|main|sidearm)',
      name: 'customize',
      component: CustomizeView,
      meta: {
        back: (route) =>
          route.params.carrier === 'hero' ? { name: 'home' } : { name: 'pick', params: { slot: route.params.carrier } },
      },
    },
    {
      path: '/customize/:carrier(hero|main|sidearm)/jokers',
      name: 'jokers',
      component: ComingSoon,
      meta: { back: (route) => ({ name: 'customize', params: { carrier: route.params.carrier } }) },
    },
    { path: '/spells', name: 'spells', component: ComingSoon, meta: { back: () => ({ name: 'home' }) } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
