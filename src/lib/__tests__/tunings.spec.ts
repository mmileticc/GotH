import { describe, expect, it } from 'vitest'
import {
  TUNING_PRESETS,
  CUSTOM_TUNING_ID,
  findPresetByTuning,
  isValidNoteString,
  tuningStringBreakdown,
  tuningDisplayName,
} from '../tunings'

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

  it('ispisuje štim po žicama od 6. (najdeblje) ka 1. (najtanjoj), standardna konvencija', () => {
    const standard = TUNING_PRESETS.find((p) => p.id === 'standard')!
    expect(tuningStringBreakdown(standard.tuning)).toBe('6=E2  5=A2  4=D3  3=G3  2=B3  1=E4')
  })

  it('radi i za netipičan broj žica (npr. 7-žična gitara)', () => {
    expect(tuningStringBreakdown(['E4', 'B3', 'G3', 'D3', 'A2', 'D2', 'B1'])).toBe(
      '7=B1  6=D2  5=A2  4=D3  3=G3  2=B3  1=E4',
    )
  })

  it('DADGAD preset ima ispravan label (6->1 konvencija, ne redosled internog niza)', () => {
    const dadgad = TUNING_PRESETS.find((p) => p.id === 'dadgad')!
    expect(dadgad.label).toBe('DADGAD')
  })

  it('Open G i Open D presetovi imaju label u 6->1 konvenciji (ranije bili obrnuti)', () => {
    const openG = TUNING_PRESETS.find((p) => p.id === 'open-g')!
    const openD = TUNING_PRESETS.find((p) => p.id === 'open-d')!
    expect(openG.label).toBe('Open G (D G D G B D)')
    expect(openD.label).toBe('Open D (D A D F# A D)')
  })

  it('tuningDisplayName ispisuje custom štim okrenut u 6->1 konvenciju', () => {
    expect(tuningDisplayName(['E4', 'B3', 'G3', 'D3', 'A2', 'F2'])).toBe('F2 A2 D3 G3 B3 E4')
  })
})
