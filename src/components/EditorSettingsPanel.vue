<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { HARMONICA_KEYS_COMMON, HARMONICA_KEYS_OTHER } from '@/lib/harmonica'
import { lightenColor } from '@/lib/colorUtils'
import { TUNING_PRESETS, CUSTOM_TUNING_ID, findPresetByTuning, isValidNoteString } from '@/lib/tunings'
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

// --- Tuning (Faza 2) -------------------------------------------------------
const selectedPresetId = computed(() => findPresetByTuning(store.tuning))
const customStrings = ref<string[]>([...store.tuning])
const customErrors = ref<boolean[]>(store.tuning.map(() => false))

watch(
  () => store.tuning,
  (val) => {
    if (findPresetByTuning(val) === CUSTOM_TUNING_ID) {
      customStrings.value = [...val]
    }
  },
)

function onPresetChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  if (id === CUSTOM_TUNING_ID) {
    customStrings.value = [...store.tuning]
    return
  }
  const preset = TUNING_PRESETS.find((p) => p.id === id)
  if (preset) store.setTuning(preset.tuning)
}

function onCustomStringInput(index: number, value: string) {
  customStrings.value[index] = value
  customErrors.value[index] = !isValidNoteString(value)
  if (customStrings.value.every((v, i) => isValidNoteString(v) && !customErrors.value[i])) {
    store.setTuning(customStrings.value)
  }
}
</script>

<template>
  <div id="settings">
    <button id="settingsToggle" class="btn btn-outline-secondary mb-2" type="button" @click="toggle">⚙️</button>

    <div v-show="open" id="settingsPanel">
      <div class="row my-3 g-3 control-panel">
        <div id="guitarSettings" class="col-md-9">
          <div class="row g-3">
            <div class="col-md-4">
              <label for="fretTheme"><strong>{{ $t('settings_design_label') }}</strong></label>
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

            <div class="col-md-6">
              <label for="tuningPreset" class="form-label fw-bold">Štimovanje gitare</label>
              <select id="tuningPreset" class="form-select" :value="selectedPresetId" @change="onPresetChange">
                <option v-for="p in TUNING_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
                <option :value="CUSTOM_TUNING_ID">Custom</option>
              </select>
            </div>

            <div v-if="selectedPresetId === CUSTOM_TUNING_ID" class="col-md-6">
              <label class="form-label fw-bold">Note po žici (visoko → nisko)</label>
              <div class="d-flex gap-1 flex-wrap">
                <input
                  v-for="(s, i) in customStrings"
                  :key="i"
                  type="text"
                  class="form-control"
                  style="width: 4.5rem"
                  :class="{ 'is-invalid': customErrors[i] }"
                  :value="s"
                  placeholder="npr. E4"
                  @input="onCustomStringInput(i, ($event.target as HTMLInputElement).value)"
                />
              </div>
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
