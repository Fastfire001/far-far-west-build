import '@fontsource-variable/oswald'
import './styles/main.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { useLanguageStore } from './stores/language'
import { useLibraryStore } from './stores/library'

const app = createApp(App).use(createPinia()).use(i18n).use(router)
useLibraryStore().init()
await useLanguageStore().init()
app.mount('#app')
