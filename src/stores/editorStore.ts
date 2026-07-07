import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { EditMode, FretTheme, NotationPreference, TabNoteData } from '@/types/tab'
import { DiatonicHarmonica } from '@/lib/harmonica'
import { NoteSystem } from '@/lib/noteSystem'

const DEFAULT_TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']

const LS_NOTES = 'goth_notes'
const LS_MODE = 'goth_mode'
const LS_FRET_THEME = 'goth_fret_theme'
const LS_FRET_CUSTOM_COLOR = 'goth_fret_custom_color'
const LS_ADVANCED = 'goth_advanced'
const LS_NUM_FRETS = 'goth_num_frets'
const LS_NOTATION = 'goth_notation'
const LS_HARMONICA_KEY = 'goth_harmonica_key'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const useEditorStore = defineStore('editor', () => {
  // --- state -----------------------------------------------------------
  const tuning = ref<string[]>([...DEFAULT_TUNING])
  const notes = ref<TabNoteData[]>(
    safeParse<TabNoteData[]>(localStorage.getItem(LS_NOTES), []).filter(
      (n) => n && Number.isInteger(n.string) && Number.isInteger(n.fret),
    ),
  )
  const selectedIndex = ref<number | null>(null)
  const mode = ref<EditMode>(
    (localStorage.getItem(LS_MODE) as EditMode) === 'insertAfter' ? 'insertAfter' : 'editFromFretboard',
  )

  const harmonicaKey = ref<string>(localStorage.getItem(LS_HARMONICA_KEY) || 'C')
  const advanced = ref<boolean>(localStorage.getItem(LS_ADVANCED) === '1')
  const notation = ref<NotationPreference>(
    (localStorage.getItem(LS_NOTATION) as NotationPreference) === 'flat' ? 'flat' : 'sharp',
  )

  const fretTheme = ref<FretTheme>((localStorage.getItem(LS_FRET_THEME) as FretTheme) || 'mahogany')
  const customColor = ref<string>(localStorage.getItem(LS_FRET_CUSTOM_COLOR) || '#4b2e2e')
  const numOfFrets = ref<number>(parseInt(localStorage.getItem(LS_NUM_FRETS) || '18', 10) || 18)

  // --- derived instance-e (funkcionalno, ne čuvaju sopstveni state) ----
  const harmonica = computed(() => {
    const h = new DiatonicHarmonica(harmonicaKey.value)
    h.setAdvancedMode(advanced.value)
    return h
  })

  const noteSystem = computed(() => {
    const ns = new NoteSystem()
    ns.setNotation(notation.value)
    return ns
  })

  const playableNotes = computed(() => harmonica.value.getPlayableNotes())

  // --- persistencija -----------------------------------------------------
  watch(notes, (val) => localStorage.setItem(LS_NOTES, JSON.stringify(val)), { deep: true })
  watch(mode, (val) => localStorage.setItem(LS_MODE, val))
  watch(harmonicaKey, (val) => localStorage.setItem(LS_HARMONICA_KEY, val))
  watch(advanced, (val) => localStorage.setItem(LS_ADVANCED, val ? '1' : '0'))
  watch(notation, (val) => localStorage.setItem(LS_NOTATION, val))
  watch(fretTheme, (val) => localStorage.setItem(LS_FRET_THEME, val))
  watch(customColor, (val) => localStorage.setItem(LS_FRET_CUSTOM_COLOR, val))
  watch(numOfFrets, (val) => localStorage.setItem(LS_NUM_FRETS, String(val)))

  // --- akcije nad notama -------------------------------------------------
  function reindex() {
    notes.value.forEach((n, i) => (n.position = i))
  }

  function insertNote(string: number, fret: number, position: number, note: string) {
    const tabNote: TabNoteData = { string, fret, position, note }
    notes.value.splice(position, 0, tabNote)
    reindex()
  }

  function deleteNote(position: number) {
    notes.value = notes.value.filter((n) => n.position !== position)
    reindex()
  }

  function editNote(position: number, newFret: number) {
    const note = notes.value.find((n) => n.position === position)
    if (!note) return
    note.fret = newFret
    const openNote = tuning.value[note.string]
    note.note = noteSystem.value.getFullNote(openNote, newFret)
  }

  function clearAll() {
    notes.value = []
    selectedIndex.value = null
  }

  function loadParsedNotes(newNotes: TabNoteData[]) {
    notes.value = newNotes
    selectedIndex.value = null
  }

  function deleteSelected() {
    if (selectedIndex.value !== null) {
      deleteNote(selectedIndex.value)
      selectedIndex.value = null
    }
  }

  function editSelected(newFret: number) {
    if (selectedIndex.value !== null) {
      editNote(selectedIndex.value, newFret)
    }
  }

  function selectByPosition(pos: number | null) {
    selectedIndex.value = pos
  }

  /** Centralna logika za klik na fretboard — port legacy 'notePressed' listenera */
  function handleFretboardClick(string: number, fret: number, note: string) {
    if (selectedIndex.value === null) {
      insertNote(string, fret, notes.value.length, note)
      return
    }

    if (mode.value === 'editFromFretboard') {
      const pos = selectedIndex.value
      const n = notes.value.find((x) => x.position === pos)
      if (!n) return
      n.string = string
      n.fret = fret
      n.note = note
      return
    }

    if (mode.value === 'insertAfter') {
      const pos = selectedIndex.value + 1
      insertNote(string, fret, pos, note)
      selectedIndex.value = pos
    }
  }

  // --- settings akcije -----------------------------------------------------
  function setHarmonicaKey(key: string) {
    harmonicaKey.value = key
  }

  function setAdvanced(enabled: boolean) {
    advanced.value = enabled
  }

  function setNotation(pref: NotationPreference) {
    notation.value = pref
  }

  function setFretTheme(theme: FretTheme, color?: string) {
    fretTheme.value = theme
    if (color) customColor.value = color
  }

  function setNumOfFrets(n: number) {
    numOfFrets.value = n
  }

  function setMode(m: EditMode) {
    mode.value = m
  }

  return {
    tuning,
    notes,
    selectedIndex,
    mode,
    harmonicaKey,
    advanced,
    notation,
    fretTheme,
    customColor,
    numOfFrets,
    harmonica,
    noteSystem,
    playableNotes,
    insertNote,
    deleteNote,
    editNote,
    clearAll,
    loadParsedNotes,
    deleteSelected,
    editSelected,
    selectByPosition,
    handleFretboardClick,
    setHarmonicaKey,
    setAdvanced,
    setNotation,
    setFretTheme,
    setNumOfFrets,
    setMode,
  }
})
