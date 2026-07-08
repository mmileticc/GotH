<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { HARMONICA_KEYS_COMMON, HARMONICA_KEYS_OTHER } from '@/lib/harmonica'
import { lightenColor } from '@/lib/colorUtils'
import {
  TUNING_PRESETS,
  CUSTOM_TUNING_ID,
  NOTE_NAMES,
  OCTAVE_RANGE,
  findPresetByTuning,
  parseNoteString,
  buildNoteString,
} from '@/lib/tunings'
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
// uiPresetId je NEZAVISAN od store.tuning — prati šta je korisnik izabrao u
// selectu, ne samo da li trenutni tuning slučajno odgovara nekom presetu.
// Bez ovoga, biranje "Custom" se odmah "vraćalo" na pravi preset (npr.
// "Standard") jer store.tuning još uvek odgovara njemu.
const uiPresetId = ref(findPresetByTuning(store.tuning))
const customStrings = ref<string[]>([...store.tuning])

watch(
  () => store.tuning,
  (val) => {
    const matched = findPresetByTuning(val)
    // sinhronizuj select samo kad tuning spolja promeni neko drugi mehanizam
    // (npr. undo); dok je korisnik u "Custom" modu ne diramo izbor.
    if (matched !== CUSTOM_TUNING_ID) {
      uiPresetId.value = matched
    }
  },
)

function onPresetChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  uiPresetId.value = id

  if (id === CUSTOM_TUNING_ID) {
    customStrings.value = [...store.tuning]
    return
  }

  const preset = TUNING_PRESETS.find((p) => p.id === id)
  if (preset) store.setTuning(preset.tuning)
}

// Dropdown umesto slobodnog kucanja — bira se ime note i oktava posebno,
// pa nema šanse za pogrešan format (nema kucanja teksta uopšte).
function onStringNoteChange(index: number, newName: string) {
  const { octave } = parseNoteString(customStrings.value[index])
  customStrings.value[index] = buildNoteString(newName, octave)
  store.setTuning(customStrings.value)
}

function onStringOctaveChange(index: number, newOctave: number) {
  const { name } = parseNoteString(customStrings.value[index])
  customStrings.value[index] = buildNoteString(name, newOctave)
  store.setTuning(customStrings.value)
}
</script>

<template>
  <div id="settings">
    <button id="settingsToggle" class="btn btn-outline-secondary mb-2" type="button" @click="toggle">
      ⚙️ {{ $t('settings_toggle_label') }}
    </button>

    <div v-show="open" id="settingsPanel" class="control-panel">
      <div class="settings-grid">
        <section id="guitarSettings" class="settings-card">
          <h6 class="settings-card-title">{{ $t('settings_section_fretboard') }}</h6>
          <div class="settings-card-body">
            <div class="settings-field">
              <label for="fretTheme" class="form-label fw-bold">{{ $t('settings_design_label') }}</label>
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
                class="mt-2"
                :value="store.customColor"
                @input="onColorInput"
              />
            </div>

            <div class="settings-field">
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
        </section>

        <section class="settings-card">
          <h6 class="settings-card-title">{{ $t('settings_section_notation') }}</h6>
          <div class="settings-card-body">
            <div class="settings-field">
              <div class="btn-group w-100" role="group" :aria-label="$t('preference_label')">
                <input
                  type="radio"
                  class="btn-check"
                  id="sharp"
                  name="sharpflat"
                  autocomplete="off"
                  :checked="store.notation === 'sharp'"
                  @change="store.setNotation('sharp')"
                />
                <label class="btn btn-outline-secondary" for="sharp">{{ $t('sharp_label') }}</label>

                <input
                  type="radio"
                  class="btn-check"
                  id="flat"
                  name="sharpflat"
                  autocomplete="off"
                  :checked="store.notation === 'flat'"
                  @change="store.setNotation('flat')"
                />
                <label class="btn btn-outline-secondary" for="flat">{{ $t('flat_label') }}</label>
              </div>
            </div>
          </div>
        </section>

        <section class="settings-card">
          <h6 class="settings-card-title">{{ $t('settings_section_tuning') }}</h6>
          <div class="settings-card-body">
            <div class="settings-field">
              <label for="tuningPreset" class="form-label fw-bold">{{ $t('tuning_label') }}</label>
              <select id="tuningPreset" class="form-select" :value="uiPresetId" @change="onPresetChange">
                <option v-for="p in TUNING_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
                <option :value="CUSTOM_TUNING_ID">{{ $t('opt_custom') }}</option>
              </select>
            </div>

            <div v-if="uiPresetId === CUSTOM_TUNING_ID" class="settings-field">
              <label class="form-label fw-bold mb-1">{{ $t('tuning_custom_label') }}</label>
              <div class="tuning-string-row" v-for="(s, i) in customStrings" :key="i">
                <span class="tuning-string-label">{{ $t('tuning_string_label') }} {{ i + 1 }}</span>
                <select
                  class="form-select form-select-sm"
                  :value="parseNoteString(s).name"
                  @change="onStringNoteChange(i, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="n in NOTE_NAMES" :key="n" :value="n">{{ n }}</option>
                </select>
                <select
                  class="form-select form-select-sm"
                  :value="parseNoteString(s).octave"
                  @change="onStringOctaveChange(i, parseInt(($event.target as HTMLSelectElement).value, 10))"
                >
                  <option v-for="o in OCTAVE_RANGE" :key="o" :value="o">{{ o }}</option>
                </select>
                <span class="tuning-string-preview text-muted">{{ s }}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="harmonicaSettings" class="settings-card">
          <h6 class="settings-card-title">{{ $t('settings_section_harmonica') }}</h6>
          <div class="settings-card-body">
            <div class="settings-field">
              <label for="harmonicaKey" class="form-label fw-bold">{{ $t('harmonica_key_label') }}</label>
              <select
                id="harmonicaKey"
                class="form-select"
                :value="store.harmonicaKey"
                @change="store.setHarmonicaKey(($event.target as HTMLSelectElement).value)"
              >
                <optgroup :label="$t('harmonica_key_common')">
                  <option v-for="k in HARMONICA_KEYS_COMMON" :key="k" :value="k">{{ k }}</option>
                </optgroup>
                <optgroup :label="$t('harmonica_key_other')">
                  <option v-for="k in HARMONICA_KEYS_OTHER" :key="k" :value="k">{{ k }}</option>
                </optgroup>
              </select>
            </div>

            <div class="settings-field">
              <div class="form-check form-switch">
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
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}

.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0.9rem 1rem 1.1rem;
}

.settings-card-title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.settings-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tuning-string-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}

.tuning-string-label {
  min-width: 4.5rem;
  font-size: 0.85rem;
}

.tuning-string-row select {
  width: auto;
  min-width: 4.5rem;
}

.tuning-string-preview {
  font-size: 0.8rem;
  min-width: 2.5rem;
}

@media (max-width: 576px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
