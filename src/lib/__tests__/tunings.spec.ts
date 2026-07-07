import { describe, expect, it } from 'vitest'
import { TUNING_PRESETS, CUSTOM_TUNING_ID, findPresetByTuning, isValidNoteString } from '../tunings'

describe('tunings', () => {
  it('prepoznaje standard tuning kao preset', () => {
    const standard = TUNING_PRESETS.find((p) => p.id === 'standard')!
    expect(findPresetByTuning(standard.tuning)).toBe('standard')
  })

  it('prepoznaje drop D tuning', () => {
    expect(findPresetByTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'D2'])).toBe('drop-d')
  })

  it('vraća custom za nepoznat tuning', () => {
    expect(findPresetByTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'F2'])).toBe(CUSTOM_TUNING_ID)
  })

  it('validira format note-a', () => {
    expect(isValidNoteString('E4')).toBe(true)
    expect(isValidNoteString('F#3')).toBe(true)
    expect(isValidNoteString('Bb2')).toBe(true)
    expect(isValidNoteString('H4')).toBe(false)
    expect(isValidNoteString('E')).toBe(false)
    expect(isValidNoteString('')).toBe(false)
  })
})
