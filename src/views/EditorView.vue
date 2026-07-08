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
import { tuningDisplayName } from '@/lib/tunings'
import type { NoteDuration } from '@/types/tab'

const store = useEditorStore()
useTabEditingKeyboard()

// Prikaz imena trenutnog štima pored naslova gitarskih tabova — korisno sad
// kad ima više gotovih štimova (Drop D, DADGAD, Open G...), da se ne mora
// otvarati podešavanja da bi se videlo šta je trenutno aktivno. Ista funkcija
// se koristi i za naslov trake u PNG exportu (vidi lib/alphaTex.ts).
const currentTuningLabel = computed(() => tuningDisplayName(store.tuning))

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
          <div class="guitartabs-header">
            <h3 class="mb-0">{{ $t('guitartabs_h3') }}</h3>
            <span class="tuning-badge" :title="$t('tuning_label')">
              {{ $t('guitartabs_tuning_current') }} {{ currentTuningLabel }}
            </span>
          </div>
          <GuitarTabView />

          <div id="tabControls" class="toolbar">
            <div class="toolbar-group">
              <span class="toolbar-group-label">{{ $t('toolbar_group_edit') }}</span>

              <div class="btn-group btn-group-sm" role="group" :aria-label="$t('toolbar_group_edit')">
                <input
                  id="modeEditRadio"
                  type="radio"
                  class="btn-check"
                  autocomplete="off"
                  :checked="!insertMode"
                  @change="insertMode = false"
                />
                <label class="btn btn-outline-secondary" for="modeEditRadio">{{ $t('mode_edit') }}</label>

                <input
                  id="modeInsertRadio"
                  type="radio"
                  class="btn-check"
                  autocomplete="off"
                  :checked="insertMode"
                  @change="insertMode = true"
                />
                <label class="btn btn-outline-secondary" for="modeInsertRadio">{{ $t('mode_insert') }}</label>
              </div>

              <button id="btnDelete" class="btn btn-sm btn-outline-secondary" @click="store.deleteSelected()">
                {{ $t('delete_button') }}
              </button>

              <button id="btnClear" class="btn btn-sm btn-outline-danger" @click="clearModalOpen = true">
                {{ $t('clear_button') }}
              </button>
            </div>

            <div class="toolbar-divider" aria-hidden="true"></div>

            <div class="toolbar-group">
              <span class="toolbar-group-label">{{ $t('toolbar_group_history') }}</span>
              <button
                class="btn btn-sm btn-outline-secondary"
                :title="$t('undo_title')"
                :disabled="!store.canUndo"
                @click="store.undo()"
              >
                ↶ {{ $t('undo_button') }}
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                :title="$t('redo_title')"
                :disabled="!store.canRedo"
                @click="store.redo()"
              >
                ↷ {{ $t('redo_button') }}
              </button>
            </div>

            <template v-if="selectedNote">
              <div class="toolbar-divider" aria-hidden="true"></div>

              <div class="toolbar-group">
                <span class="toolbar-group-label">{{ $t('duration_label') }}</span>
                <div class="btn-group btn-group-sm" role="group" :aria-label="$t('duration_label')">
                  <button
                    v-for="d in DURATIONS"
                    :key="d.value"
                    type="button"
                    class="btn"
                    :class="selectedNote.duration === d.value ? 'btn-secondary' : 'btn-outline-secondary'"
                    @click="setDuration(d.value)"
                  >
                    {{ d.label }}
                  </button>
                </div>
              </div>
            </template>
          </div>

          <ClearConfirmModal v-model="clearModalOpen" />
        </div>

        <div class="col-lg-3" id="harDiv">
          <div class="harmonica-header">
            <h3 class="mb-0">{{ $t('harmonicatabs_h3') }}</h3>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary legend-btn"
              :aria-label="$t('legend_modal_title')"
              :title="$t('legend_modal_title')"
              @click="legendModalOpen = true"
            >
              ?
            </button>
          </div>
          <HarmonicaTabView />
        </div>

        <LegendModal v-model="legendModalOpen" />
      </div>

      <div id="notation" class="my-4">
        <h3>{{ $t('notation_playback_h3') }}</h3>
        <AlphaTabPlayer />
      </div>

      <div class="save">
        <button id="btnSaveText" class="btn btn-lg btn-theme" :class="`btn-${store.fretTheme}`" @click="saveModalOpen = true">
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

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-group-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-right: 0.15rem;
}

.toolbar-divider {
  width: 1px;
  align-self: stretch;
  background: var(--border-color);
  min-height: 1.5rem;
}

@media (max-width: 576px) {
  .toolbar {
    gap: 0.6rem;
  }
  .toolbar-divider {
    display: none;
  }
}

.guitartabs-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tuning-badge {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  white-space: nowrap;
}

.harmonica-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.legend-btn {
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  padding: 0;
  flex: 0 0 auto;
  font-weight: 700;
}

.save {
  display: flex;
  justify-content: center;
  margin: 2rem 0 1rem;
}
</style>
