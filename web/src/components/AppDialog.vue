<script setup lang="ts">
// A modal dialog (native <dialog>): open with v-model, closes on Esc, on a click outside or with its close button.
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const open = defineModel<boolean>({ required: true })
defineProps<{ title: string }>()

const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()

watch(open, (value) => {
  if (value && !dialog.value?.open) dialog.value?.showModal()
  if (!value && dialog.value?.open) dialog.value.close()
})

function onClick(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="dialog" @close="open = false" @click="onClick">
    <div class="content">
      <header>
        <h2>{{ title }}</h2>
        <button type="button" class="close" :aria-label="t('dialog.close')" @click="open = false">✕</button>
      </header>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  background: var(--bg-deep);
  border: 1px solid var(--line);
  border-top: 3px solid var(--accent);
  color: var(--text);
  max-width: min(40rem, calc(100vw - 2rem));
  padding: 0;
  width: 100%;
}
.dialog::backdrop {
  background: rgb(0 0 0 / 60%);
}
.content {
  padding: 1.25rem 1.5rem 1.5rem;
}
header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}
h2 {
  color: var(--accent);
  font-size: 1.6rem;
}
.close {
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 1.2rem;
}
</style>
