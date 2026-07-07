<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { HARMONICA_KEYS_COMMON, HARMONICA_KEYS_OTHER } from '@/lib/harmonica'
import { lightenColor } from '@/lib/colorUtils'
import type { FretTheme } from '@/types/tab'

const store = useEditorStore()
const open = ref(false)
const numOfFretsInput = ref(store.numOfFrets)

function toggle() {
  open.value = !open.value
}

function onThemeChange(e: Event) {
  const theme = (e.target as HTMLSelectElement).value as FretTheme
  store.setFretTheme(theme)
  if (theme === 'custom') {
    document.documentElement.style.setProperty('--custom-main', store.customColor)
    document.documentElement.style.setProperty('--custom-accent', lightenColor(store.customColor, 0.3))
  }
}

function onColorInput(e: Event) {
  const color = (e.target as HTMLInputElement).value
  store.setFretTheme('custom', color)
  document.documentElement.style.setProperty('--custom-main', color)
  document.documentElement.style.setProperty('--custom-accent', lightenColor(color, 0.3))
}

function onFretFormSubmit() {
  store.setNumOfFrets(numOfFretsInput.value)
}

function onAdvancedToggle(e: Event) {
  store.setAdvanced((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div id="settings">
    <button
      id="settingsToggle"
      class="btn btn-outline-secondary mb-2"
      type="button"
      @click="toggle"
    >
      ⚙️
    </button>

    <div v-show="open" id="settingsPanel">
      <div class="row my-3 g-3 control-panel">
        <div id="guitarSettings" class="col-md-9">
          <div class="row g-3">
            <div class="col-md-4">
              <label for="fretTheme"><strong data-i18n="settings_design_label">{{ $t('settings_design_label') }}</strong></label>
              <select id="fretTheme" class="form-select" :value="store.fretTheme" @change="onThemeChange">
                <option value="mahogany">{{ $t('opt_mahogany') }}</option>
                <option value="maple">{{ $t('opt_maple') }}</option>
                <option value="ebony">{{ $t('opt_ebony') }}</option>
                <option value="custom">{{ $t('opt_custom') }}</option>
              </select>

              <input
                v-if="store.fretTheme === 'custom'"
                id="customColor"
                type="color"
                :value="store.customColor"
                @input="onColorInput"
              />
            </div>

            <div class="col-md-4">
              <span class="fw-bold">{{ $t('preference_label') }}</span>
              <div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="sharp"
                    name="sharpflat"
                    value="sharp"
                    :checked="store.notation === 'sharp'"
                    @change="store.setNotation('sharp')"
                  />
                  <label class="form-check-label" for="sharp">{{ $t('sharp_label') }}</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="flat"
                    name="sharpflat"
                    value="flat"
                    :checked="store.notation === 'flat'"
                    @change="store.setNotation('flat')"
                  />
                  <label class="form-check-label" for="flat">{{ $t('flat_label') }}</label>
                </div>
              </div>
            </div>

            <div class="col-md-4">
              <form id="fretForm" @submit.prevent="onFretFormSubmit">
                <label for="numOfFrets" class="form-label fw-bold">{{ $t('num_of_frets_label') }}</label>
                <div class="input-group">
                  <input
                    type="number"
                    name="numOfFrets"
                    id="numOfFrets"
                    min="12"
                    max="30"
                    required
                    v-model.number="numOfFretsInput"
                    class="form-control"
                  />
                  <button type="submit" id="fretButton" class="btn btn-theme" :class="`btn-${store.fretTheme}`">
                    {{ $t('apply_button') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div id="harmonicaSettings" class="col-md-3">
          <div class="row g-3">
            <div class="col-12">
              <label for="harmonicaKey" class="form-label fw-bold">{{ $t('harmonica_key_label') }}</label>
              <select
                id="harmonicaKey"
                class="form-select"
                :value="store.harmonicaKey"
                @change="store.setHarmonicaKey(($event.target as HTMLSelectElement).value)"
              >
                <optgroup label="Najčešći">
                  <option v-for="k in HARMONICA_KEYS_COMMON" :key="k" :value="k">{{ k }}</option>
                </optgroup>
                <optgroup label="Ostali">
                  <option v-for="k in HARMONICA_KEYS_OTHER" :key="k" :value="k">{{ k }}</option>
                </optgroup>
              </select>
            </div>

            <div class="col-12">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="advancedModeToggle"
                  :checked="store.advanced"
                  @change="onAdvancedToggle"
                />
                <label class="form-check-label" for="advancedModeToggle">{{ $t('advanced_mode') }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
