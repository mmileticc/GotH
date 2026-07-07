import { describe, expect, it } from 'vitest'
import { DiatonicHarmonica } from '../harmonica'

describe('DiatonicHarmonica', () => {
  it('mapira osnovne duvane note u tonalitetu C (C3, C4, C5, C6 na rupama 1,4,7,10)', () => {
    const h = new DiatonicHarmonica('C')
    const notes = h.getPlayableNotes()

    expect(notes.find((n) => n.tab === '1')?.note).toBe('C3')
    expect(notes.find((n) => n.tab === '4')?.note).toBe('C4')
    expect(notes.find((n) => n.tab === '7')?.note).toBe('C5')
    expect(notes.find((n) => n.tab === '10')?.note).toBe('C6')
  })

  it('skriva napredne note (bend/overblow/overdraw) dok advanced mode nije uključen', () => {
    const h = new DiatonicHarmonica('C')
    expect(h.getPlayableNotes().some((n) => n.advanced)).toBe(false)

    h.setAdvancedMode(true)
    expect(h.getPlayableNotes().some((n) => n.advanced)).toBe(true)
    expect(h.getPlayableNotes().find((n) => n.tab === '-1/')?.type).toBe('bend')
  })

  it('setKey transponuje sve note', () => {
    const h = new DiatonicHarmonica('C')
    const cNote = h.getPlayableNotes().find((n) => n.tab === '1')?.note

    h.setKey('G')
    const gNote = h.getPlayableNotes().find((n) => n.tab === '1')?.note

    expect(gNote).not.toBe(cNote)
    expect(gNote).toBe('G2')
  })
})
