<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { useEditorStore } from '@/stores/editorStore'
import posthog from 'posthog-js'

const posthogConfigured = Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_POSTHOG_HOST)

const store = useEditorStore()
const open = defineModel<boolean>({ default: false })

function confirm() {
  const cleared_note_count = store.notes.length
  store.clearAll()
  if (posthogConfigured) posthog.capture('tab_cleared', { cleared_note_count })
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" :title="$t('clear_modal_title')">
    <span>{{ $t('clear_modal_body') }}</span>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="open = false">{{ $t('modal_cancel') }}</button>
      <button type="button" class="btn btn-danger" @click="confirm">{{ $t('confirm_clear_button') }}</button>
    </template>
  </BaseModal>
</template>
