export interface TuningPreset {
  id: string
  label: string
  tuning: string[]
}

// Format note-a: [A-G](#|b)?[octava], visoko->nisko (isti redosled kao tuning niz u store-u)
export const TUNING_PRESETS: TuningPreset[] = [
  { id: 'standard', label: 'Standard (E A D G B E)', tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'] },
  { id: 'drop-d', label: 'Drop D', tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'] },
  {
    id: 'half-step-down',
    label: 'Half Step Down (Eb Ab Db Gb Bb Eb)',
    tuning: ['Eb4', 'Bb3', 'Gb3', 'Db3', 'Ab2', 'Eb2'],
  },
  { id: 'dadgad', label: 'DADGAD', tuning: ['D4', 'A3', 'G3', 'D3', 'A2', 'D2'] },
  { id: 'open-g', label: 'Open G (D B G D G D)', tuning: ['D4', 'B3', 'G3', 'D3', 'G2', 'D2'] },
  { id: 'open-d', label: 'Open D (D A F# D A D)', tuning: ['D4', 'A3', 'F#3', 'D3', 'A2', 'D2'] },
]

export const CUSTOM_TUNING_ID = 'custom'

export function findPresetByTuning(tuning: string[]): string {
  const match = TUNING_PRESETS.find(
    (p) => p.tuning.length === tuning.length && p.tuning.every((n, i) => n === tuning[i]),
  )
  return match ? match.id : CUSTOM_TUNING_ID
}

const NOTE_PATTERN = /^[A-Ga-g](#|b)?[0-9]$/

export function isValidNoteString(value: string): boolean {
  return NOTE_PATTERN.test(value.trim())
}
