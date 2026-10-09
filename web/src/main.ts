import '@fontsource-variable/oswald'
import './styles/main.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { detectLocale, i18n } from './i18n'
import { router } from './router'
import { useLanguageStore } from './stores/language'

const app = createApp(App).use(createPinia()).use(i18n).use(router)
await useLanguageStore().setLocale(detectLocale())
app.mount('#app')
