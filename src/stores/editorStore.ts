import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { EditMode, FretTheme, NotationPreference, NoteDuration, TabNoteData } from '@/types/tab'
import { DiatonicHarmonica } from '@/lib/harmonica'
import { NoteSystem } from '@/lib/noteSystem'
import { idbGet, idbSet } from '@/lib/db'
import posthog from 'posthog-js'

const posthogConfigured = Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_POSTHOG_HOST)

const DEFAULT_TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']
const MAX_HISTORY = 50

// IndexedDB ključevi
const KEYS = {
  notes: 'notes',
  mode: 'mode',
  fretTheme: 'fretTheme',
  customColor: 'customColor',
  advanced: 'advanced',
  numOfFrets: 'numOfFrets',
  notation: 'notation',
  harmonicaKey: 'harmonicaKey',
  tuning: 'tuning',
} as const

// stari localStorage ključevi (Faza 1), za jednokratnu migraciju u IndexedDB
const LEGACY_LS_KEYS = {
  notes: 'goth_notes',
  mode: 'goth_mode',
  fretTheme: 'goth_fret_theme',
  customColor: 'goth_fret_custom_color',
  advanced: 'goth_advanced',
  numOfFrets: 'goth_num_frets',
  notation: 'goth_notation',
  harmonicaKey: 'goth_harmonica_key',
} as const

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const useEditorStore = defineStore('editor', () => {
  // --- state (kreće sa defaultima, popunjava se async iz IndexedDB) ------
  const tuning = ref<string[]>([...DEFAULT_TUNING])
  const notes = ref<TabNoteData[]>([])
  const selectedIndex = ref<number | null>(null)
  const mode = ref<EditMode>('editFromFretboard')
  const harmonicaKey = ref<string>('C')
  const advanced = ref<boolean>(false)
  const notation = ref<NotationPreference>('sharp')
  const fretTheme = ref<FretTheme>('mahogany')
  const customColor = ref<string>('#4b2e2e')
  const numOfFrets = ref<number>(18)
  const ready = ref(false)

  // --- undo/redo -----------------------------------------------------------
  const undoStack = ref<TabNoteData[][]>([])
  const redoStack = ref<TabNoteData[][]>([])
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function cloneNotes(): TabNoteData[] {
    return notes.value.map((n) => ({ ...n }))
  }

  function pushHistory() {
    undoStack.value.push(cloneNotes())
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function undo() {
    if (undoStack.value.length === 0) return
    redoStack.value.push(cloneNotes())
    notes.value = undoStack.value.pop()!
    selectedIndex.value = null
  }

  function redo() {
    if (redoStack.value.length === 0) return
    undoStack.value.push(cloneNotes())
    notes.value = redoStack.value.pop()!
    selectedIndex.value = null
  }

  // --- derived instance-e (funkcionalno, ne čuvaju sopstveni state) ------
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

  // --- IndexedDB perzistencija ---------------------------------------------
  async function migrateFromLocalStorage() {
    const migratedFlag = await idbGet<boolean>('migrated')
    if (migratedFlag) return

    const lsNotes = safeParse<TabNoteData[]>(localStorage.getItem(LEGACY_LS_KEYS.notes), [])
    if (lsNotes.length) {
      await idbSet(
        KEYS.notes,
        lsNotes
          .filter((n) => n && Number.isInteger(n.string) && Number.isInteger(n.fret))
          .map((n) => ({ ...n, duration: n.duration ?? 'quarter' })),
      )
    }
    const lsMode = localStorage.getItem(LEGACY_LS_KEYS.mode)
    if (lsMode) await idbSet(KEYS.mode, lsMode)
    const lsFretTheme = localStorage.getItem(LEGACY_LS_KEYS.fretTheme)
    if (lsFretTheme) await idbSet(KEYS.fretTheme, lsFretTheme)
    const lsCustomColor = localStorage.getItem(LEGACY_LS_KEYS.customColor)
    if (lsCustomColor) await idbSet(KEYS.customColor, lsCustomColor)
    const lsAdvanced = localStorage.getItem(LEGACY_LS_KEYS.advanced)
    if (lsAdvanced) await idbSet(KEYS.advanced, lsAdvanced === '1')
    const lsNumFrets = localStorage.getItem(LEGACY_LS_KEYS.numOfFrets)
    if (lsNumFrets) await idbSet(KEYS.numOfFrets, parseInt(lsNumFrets, 10))
    const lsNotation = localStorage.getItem(LEGACY_LS_KEYS.notation)
    if (lsNotation) await idbSet(KEYS.notation, lsNotation)
    const lsHarmonicaKey = localStorage.getItem(LEGACY_LS_KEYS.harmonicaKey)
    if (lsHarmonicaKey) await idbSet(KEYS.harmonicaKey, lsHarmonicaKey)

    await idbSet('migrated', true)
  }

  async function init() {
    if (ready.value) return
    await migrateFromLocalStorage()

    const [dbNotes, dbMode, dbFretTheme, dbCustomColor, dbAdvanced, dbNumFrets, dbNotation, dbHarmonicaKey, dbTuning] =
      await Promise.all([
        idbGet<TabNoteData[]>(KEYS.notes),
        idbGet<EditMode>(KEYS.mode),
        idbGet<FretTheme>(KEYS.fretTheme),
        idbGet<string>(KEYS.customColor),
        idbGet<boolean>(KEYS.advanced),
        idbGet<number>(KEYS.numOfFrets),
        idbGet<NotationPreference>(KEYS.notation),
        idbGet<string>(KEYS.harmonicaKey),
        idbGet<string[]>(KEYS.tuning),
      ])

    if (dbNotes) notes.value = dbNotes.map((n) => ({ ...n, duration: n.duration ?? 'quarter' }))
    if (dbMode) mode.value = dbMode
    if (dbFretTheme) fretTheme.value = dbFretTheme
    if (dbCustomColor) customColor.value = dbCustomColor
    if (dbAdvanced !== undefined) advanced.value = dbAdvanced
    if (dbNumFrets) numOfFrets.value = dbNumFrets
    if (dbNotation) notation.value = dbNotation
    if (dbHarmonicaKey) harmonicaKey.value = dbHarmonicaKey
    if (dbTuning && dbTuning.length === tuning.value.length) tuning.value = dbTuning

    ready.value = true

    watch(
      notes,
      (val) =>
        idbSet(
          KEYS.notes,
          val.map((n) => ({ ...n })),
        ),
      { deep: true },
    )
    watch(mode, (val) => idbSet(KEYS.mode, val))
    watch(harmonicaKey, (val) => idbSet(KEYS.harmonicaKey, val))
    watch(advanced, (val) => idbSet(KEYS.advanced, val))
    watch(notation, (val) => idbSet(KEYS.notation, val))
    watch(fretTheme, (val) => idbSet(KEYS.fretTheme, val))
    watch(customColor, (val) => idbSet(KEYS.customColor, val))
    watch(numOfFrets, (val) => idbSet(KEYS.numOfFrets, val))
    watch(tuning, (val) => idbSet(KEYS.tuning, [...val]), { deep: true })
  }

  void init()

  // --- akcije nad notama -----------------------------------------------------
  function reindex() {
    notes.value.forEach((n, i) => (n.position = i))
  }

  function insertNote(
    string: number,
    fret: number,
    position: number,
    note: string,
    duration: NoteDuration = 'quarter',
  ) {
    pushHistory()
    const tabNote: TabNoteData = { string, fret, position, note, duration }
    notes.value.splice(position, 0, tabNote)
    reindex()
    if (posthogConfigured) posthog.capture('tab_note_added', { duration, insert_mode: mode.value })
  }

  function deleteNote(position: number) {
    pushHistory()
    notes.value = notes.value.filter((n) => n.position !== position)
    reindex()
  }

  /** Menja fret selektovane note. Snapshot za undo se pravi spolja (jednom po edit-sesiji), ne po tasteru. */
  function editNote(position: number, newFret: number) {
    const note = notes.value.find((n) => n.position === position)
    if (!note) return
    note.fret = newFret
    const openNote = tuning.value[note.string]
    note.note = noteSystem.value.getFullNote(openNote, newFret)
  }

  function setNoteDuration(position: number, duration: NoteDuration) {
    const note = notes.value.find((n) => n.position === position)
    if (!note) return
    pushHistory()
    note.duration = duration
  }

  function clearAll() {
    pushHistory()
    notes.value = []
    selectedIndex.value = null
  }

  function loadParsedNotes(newNotes: TabNoteData[]) {
    pushHistory()
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
      pushHistory()
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

  // --- settings akcije ---------------------------------------------------------
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

  /** Menja tuning i rekomputuje visinu tona postojećih nota (fret pozicije ostaju iste) */
  function setTuning(newTuning: string[]) {
    tuning.value = [...newTuning]
    notes.value.forEach((n) => {
      const openNote = tuning.value[n.string]
      if (openNote) n.note = noteSystem.value.getFullNote(openNote, n.fret)
    })
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
    ready,
    canUndo,
    canRedo,
    harmonica,
    noteSystem,
    playableNotes,
    init,
    pushHistory,
    undo,
    redo,
    insertNote,
    deleteNote,
    editNote,
    setNoteDuration,
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
    setTuning,
  }
})
