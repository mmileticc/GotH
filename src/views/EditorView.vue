<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { useTabEditingKeyboard } from '@/composables/useTabEditingKeyboard'
import EditorSettingsPanel from '@/components/EditorSettingsPanel.vue'
import Fretboard from '@/components/Fretboard.vue'
import GuitarTabView from '@/components/GuitarTabView.vue'
import HarmonicaTabView from '@/components/HarmonicaTabView.vue'
import ClearConfirmModal from '@/components/ClearConfirmModal.vue'
import LegendModal from '@/components/LegendModal.vue'
import SaveExportModal from '@/components/SaveExportModal.vue'

const store = useEditorStore()
useTabEditingKeyboard()

const clearModalOpen = ref(false)
const legendModalOpen = ref(false)
const saveModalOpen = ref(false)

const insertMode = computed({
  get: () => store.mode === 'insertAfter',
  set: (val: boolean) => store.setMode(val ? 'insertAfter' : 'editFromFretboard'),
})
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

          <div id="tabControls" class="my-3 d-flex gap-2 align-items-center">
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
