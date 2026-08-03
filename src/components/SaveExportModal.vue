<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import NotationExporter from './NotationExporter.vue'
import { useEditorStore } from '@/stores/editorStore'
import { buildExportText, downloadText, type ExportType } from '@/lib/exportText'
import posthog from 'posthog-js'

const posthogConfigured = Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_POSTHOG_HOST)

const store = useEditorStore()
const open = defineModel<boolean>({ default: false })

const exporter = ref<InstanceType<typeof NotationExporter> | null>(null)

function save(type: ExportType) {
  const text = buildExportText(store.notes, store.tuning, store.harmonica, type)
  downloadText(text, type === 'harmonica-only' ? 'harmonicaTabs.txt' : 'guitarTabs.txt')
  if (posthogConfigured) posthog.capture('tab_exported', { export_type: type, note_count: store.notes.length })
  open.value = false
}

async function saveImage() {
  await exporter.value?.exportPng()
  // ne zatvaramo modal automatski na grešku, da korisnik vidi poruku
  if (!exporter.value?.exportError) open.value = false
}
</script>

<template>
  <BaseModal v-model="open" :title="$t('save_modal_title')">
    <p>{{ $t('save_modal_p') }}</p>

    <div class="export-section">
      <h6 class="export-section-title">{{ $t('save_section_text') }}</h6>
      <div class="d-flex gap-2 flex-wrap">
        <button type="button" class="btn btn-primary" @click="save('guitar+harmonica')">
          {{ $t('save_guitar_button') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="save('harmonica-only')">
          {{ $t('save_harmonica_button') }}
        </button>
      </div>
    </div>

    <div class="export-section">
      <h6 class="export-section-title">{{ $t('save_section_image') }}</h6>
      <button type="button" class="btn btn-outline-secondary" :disabled="exporter?.isExporting" @click="saveImage">
        {{ exporter?.isExporting ? $t('save_image_generating') : $t('save_image_button') }}
      </button>
      <p v-if="exporter?.exportError" class="text-danger small mt-2 mb-0">
        {{ $t('alphatab_error_prefix') }}{{ exporter.exportError }}
      </p>
    </div>

    <NotationExporter ref="exporter" />
  </BaseModal>
</template>

<style scoped>
.export-section {
  margin-top: 1.25rem;
}

.export-section:first-of-type {
  margin-top: 0;
}

.export-section-title {
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
</style>
