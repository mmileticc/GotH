import { describe, expect, it } from 'vitest'
import { TUNING_PRESETS, CUSTOM_TUNING_ID, findPresetByTuning, isValidNoteString, tuningStringBreakdown } from '../tunings'

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

  it('ispisuje štim po žicama, numerisano od 1 (najviša žica)', () => {
    const standard = TUNING_PRESETS.find((p) => p.id === 'standard')!
    expect(tuningStringBreakdown(standard.tuning)).toBe('1=E4  2=B3  3=G3  4=D3  5=A2  6=E2')
  })

  it('radi i za netipičan broj žica (npr. 7-žična gitara)', () => {
    expect(tuningStringBreakdown(['E4', 'B3', 'G3', 'D3', 'A2', 'D2', 'B1'])).toBe(
      '1=E4  2=B3  3=G3  4=D3  5=A2  6=D2  7=B1',
    )
  })
})
