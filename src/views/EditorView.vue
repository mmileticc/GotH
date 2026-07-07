<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { useTabEditingKeyboard } from '@/composables/useTabEditingKeyboard'
import EditorSettingsPanel from '@/components/EditorSettingsPanel.vue'
import Fretboard from '@/components/Fretboard.vue'
import GuitarTabView from '@/components/GuitarTabView.vue'
import HarmonicaTabView from '@/components/HarmonicaTabView.vue'
import AlphaTabPlayer from '@/components/AlphaTabPlayer.vue'
import ClearConfirmModal from '@/components/ClearConfirmModal.vue'
import LegendModal from '@/components/LegendModal.vue'
import SaveExportModal from '@/components/SaveExportModal.vue'
import type { NoteDuration } from '@/types/tab'

const store = useEditorStore()
useTabEditingKeyboard()

const clearModalOpen = ref(false)
const legendModalOpen = ref(false)
const saveModalOpen = ref(false)

const insertMode = computed({
  get: () => store.mode === 'insertAfter',
  set: (val: boolean) => store.setMode(val ? 'insertAfter' : 'editFromFretboard'),
})

const DURATIONS: { value: NoteDuration; label: string }[] = [
  { value: 'whole', label: '𝅝' },
  { value: 'half', label: '𝅗𝅥' },
  { value: 'quarter', label: '♩' },
  { value: 'eighth', label: '♪' },
  { value: 'sixteenth', label: '𝅘𝅥𝅯' },
]

const selectedNote = computed(() =>
  store.selectedIndex !== null ? store.notes.find((n) => n.position === store.selectedIndex) : undefined,
)

function setDuration(d: NoteDuration) {
  if (store.selectedIndex !== null) store.setNoteDuration(store.selectedIndex, d)
}
</script>

<template>
  <div class="mx-3">
    <div id="editor">
      <EditorSettingsPanel />

      <h3>{{ $t('fretboard_h3') }}</h3>
      <small class="text-muted d-md-none">{{ $t('fretboard_scroll_hint') }}</small>
      <div id="fretboard" class="row overflow-auto">
        <Fretboard />
      </div>

      <div class="row">
        <div class="col-lg-9">
          <h3>{{ $t('guitartabs_h3') }}</h3>
          <GuitarTabView />

          <div id="tabControls" class="my-3 d-flex gap-2 align-items-center flex-wrap">
            <button id="btnToggleMode" class="btn btn-outline-secondary">
              <div class="form-check form-switch">
                <input id="modeSwitch" v-model="insertMode" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="modeSwitch">
                  {{ insertMode ? $t('mode_insert') : $t('mode_edit') }}
                </label>
              </div>
            </button>

            <button id="btnDelete" class="btn btn-outline-secondary" @click="store.deleteSelected()">
              {{ $t('delete_button') }}
            </button>

            <button id="btnClear" class="btn btn-outline-danger" @click="clearModalOpen = true">
              {{ $t('clear_button') }}
            </button>

            <div class="vr mx-1"></div>

            <button
              class="btn btn-outline-secondary"
              title="Undo (Ctrl+Z)"
              :disabled="!store.canUndo"
              @click="store.undo()"
            >
              ↶ Undo
            </button>
            <button
              class="btn btn-outline-secondary"
              title="Redo (Ctrl+Y)"
              :disabled="!store.canRedo"
              @click="store.redo()"
            >
              ↷ Redo
            </button>

            <div v-if="selectedNote" class="d-flex align-items-center gap-1 ms-2">
              <span class="text-muted small me-1">Trajanje:</span>
              <button
                v-for="d in DURATIONS"
                :key="d.value"
                type="button"
                class="btn btn-sm"
                :class="selectedNote.duration === d.value ? 'btn-secondary' : 'btn-outline-secondary'"
                @click="setDuration(d.value)"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <ClearConfirmModal v-model="clearModalOpen" />
        </div>

        <div class="col-lg-3" id="harDiv">
          <div class="row">
            <h3 class="col-10">{{ $t('harmonicatabs_h3') }}</h3>
            <button type="button" class="btn col-2" @click="legendModalOpen = true">?</button>
          </div>
          <HarmonicaTabView />
        </div>

        <LegendModal v-model="legendModalOpen" />
      </div>

      <div id="notation" class="my-4">
        <h3>Notni zapis i reprodukcija</h3>
        <AlphaTabPlayer />
      </div>

      <div class="save">
        <button id="btnSaveText" class="btn btn-theme" :class="`btn-${store.fretTheme}`" @click="saveModalOpen = true">
          {{ $t('save_button_text') }}
        </button>

        <SaveExportModal v-model="saveModalOpen" />
      </div>
    </div>
  </div>

  <footer class="text-center mt-4 py-3 border-top">
    <small>{{ $t('footer_text') }}</small>
  </footer>
</template>
