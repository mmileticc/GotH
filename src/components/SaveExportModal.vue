<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import { useEditorStore } from '@/stores/editorStore'
import { buildExportText, downloadText, type ExportType } from '@/lib/exportText'

const store = useEditorStore()
const open = defineModel<boolean>({ default: false })

function save(type: ExportType) {
  const text = buildExportText(store.notes, store.tuning, store.harmonica, type)
  downloadText(text, type === 'harmonica-only' ? 'harmonicaTabs.txt' : 'guitarTabs.txt')
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" :title="$t('save_modal_title')">
    <p>{{ $t('save_modal_p') }}</p>
    <button type="button" class="btn btn-primary me-2" @click="save('guitar+harmonica')">
      {{ $t('save_guitar_button') }}
    </button>
    <button type="button" class="btn btn-secondary" @click="save('harmonica-only')">
      {{ $t('save_harmonica_button') }}
    </button>
  </BaseModal>
</template>
