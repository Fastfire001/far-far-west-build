<script setup lang="ts">
// A share link (/#/share/<code>): opens the shared build as one of the saved builds, then goes to its home. The
// link is replaced in the history, so reloading the page does not open the build again.
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BuildImportError, decodeShareCode } from '@/domain/codec'
import { useLibraryStore } from '@/stores/library'
import BackButton from '@/components/BackButton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const library = useLibraryStore()
const error = ref('')

watch(
  () => route.params.code,
  async (code) => {
    if (typeof code !== 'string') return
    error.value = ''
    try {
      library.openShared(await decodeShareCode(code))
      await router.replace({ name: 'home' })
    } catch (e) {
      error.value = t(`dialog.importError.${e instanceof BuildImportError ? e.reason : 'format'}`)
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="page">
    <BackButton />
    <template v-if="error">
      <h1>{{ t('share.invalidTitle') }}</h1>
      <p class="error" role="alert">{{ error }}</p>
    </template>
  </main>
</template>

<style scoped>
.error {
  color: var(--danger);
}
</style>
