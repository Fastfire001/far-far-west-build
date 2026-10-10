<script setup lang="ts">
// Sharing of a build (link, or text to import: "FFW1:...") and import of a text, from the builds menu.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { BuildImportError, encodeShareCode } from '@/domain/codec'
import { useBuildStore } from '@/stores/build'
import { useLibraryStore } from '@/stores/library'
import AppDialog from './AppDialog.vue'

const exportOpen = defineModel<boolean>('export', { required: true })
const importOpen = defineModel<boolean>('import', { required: true })

const { t } = useI18n()
const router = useRouter()
const editor = useBuildStore()
const library = useLibraryStore()

const exported = computed(() => (exportOpen.value ? editor.exportText() : ''))
const link = ref('')
const copied = ref<'link' | 'text' | null>(null)
const linkField = ref<HTMLInputElement>()
const exportField = ref<HTMLTextAreaElement>()

watch(exportOpen, async (open) => {
  copied.value = null
  if (!open) return
  link.value = ''
  const code = await encodeShareCode(editor.build)
  link.value = new URL(router.resolve({ name: 'share', params: { code } }).href, location.href).href
})

async function copy(what: 'link' | 'text') {
  const field = what === 'link' ? linkField.value : exportField.value
  try {
    await navigator.clipboard.writeText(what === 'link' ? link.value : exported.value)
  } catch {
    // No clipboard API (non-secure origin): copy the selected text instead.
    field?.select()
    document.execCommand('copy')
  }
  copied.value = what
}

const pasted = ref('')
const importError = ref('')
watch(importOpen, () => {
  pasted.value = ''
  importError.value = ''
})

function importBuild() {
  try {
    library.importText(pasted.value)
    importOpen.value = false
    router.push({ name: 'home' })
  } catch (error) {
    importError.value = t(`dialog.importError.${error instanceof BuildImportError ? error.reason : 'format'}`)
  }
}
</script>

<template>
  <AppDialog v-model="exportOpen" :title="t('dialog.exportTitle')">
    <p>{{ t('dialog.linkHelp') }}</p>
    <input ref="linkField" class="text" readonly :value="link" @focus="linkField?.select()" />
    <div class="actions">
      <span v-if="copied === 'link'" class="ok" aria-live="polite">{{ t('dialog.copied') }}</span>
      <button type="button" class="action" :disabled="!link" @click="copy('link')">{{ t('dialog.copyLink') }}</button>
    </div>
    <p class="second">{{ t('dialog.exportHelp') }}</p>
    <textarea ref="exportField" class="text" readonly :value="exported" rows="4" @focus="exportField?.select()" />
    <div class="actions">
      <span v-if="copied === 'text'" class="ok" aria-live="polite">{{ t('dialog.copied') }}</span>
      <button type="button" class="action" @click="copy('text')">{{ t('dialog.copy') }}</button>
    </div>
  </AppDialog>

  <AppDialog v-model="importOpen" :title="t('dialog.importTitle')">
    <p>{{ t('dialog.importHelp') }}</p>
    <textarea v-model="pasted" class="text" rows="5" placeholder="FFW1:…" :aria-invalid="Boolean(importError)" />
    <p v-if="importError" class="error" role="alert">{{ importError }}</p>
    <div class="actions">
      <button type="button" class="action" :disabled="!pasted.trim()" @click="importBuild">{{ t('dialog.import') }}</button>
    </div>
  </AppDialog>
</template>

<style scoped>
p {
  margin: 0 0 0.75rem;
}
.second {
  border-top: 1px solid var(--line);
  margin-top: 1.25rem;
  padding-top: 1rem;
}
.text {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  padding: 0.6rem;
  resize: vertical;
  width: 100%;
  word-break: break-all;
}
.actions {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}
.action {
  background: linear-gradient(180deg, var(--plank-light), var(--plank));
  border: 2px solid var(--plank-dark);
  color: var(--plank-text);
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.35rem 1rem;
  text-transform: uppercase;
}
.action:disabled {
  cursor: default;
  opacity: 0.5;
}
.ok {
  color: #8fd16a;
}
.error {
  color: var(--danger);
  margin: 0.5rem 0 0;
}
</style>
