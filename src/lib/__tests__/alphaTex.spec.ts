import { describe, expect, it } from 'vitest'
import { buildAlphaTex } from '../alphaTex'
import type { TabNoteData } from '@/types/tab'

const TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']

function note(partial: Partial<TabNoteData> & { position: number }): TabNoteData {
  return {
    string: 0,
    fret: 0,
    note: 'E4',
    duration: 'quarter',
    ...partial,
  }
}

describe('buildAlphaTex', () => {
  it('vraća prazan takt za praznu tab notaciju', () => {
    const tex = buildAlphaTex([], TUNING, 'C')
    expect(tex).toContain('r.4')
    expect(tex).toContain('\\track "Gitara"')
  })

  it('mapira string+1 i fret u gitarsku traku (fret.string.trajanje)', () => {
    const notes: TabNoteData[] = [note({ position: 0, string: 0, fret: 3, note: 'G4', duration: 'quarter' })]
    const tex = buildAlphaTex(notes, TUNING, 'C')
    expect(tex).toContain('3.1.4')
  })

  it('koristi \\tuning sa istim redosledom kao store.tuning (visoko->nisko)', () => {
    const tex = buildAlphaTex([note({ position: 0 })], TUNING, 'C')
    expect(tex).toContain('\\tuning (E4 B3 G3 D3 A2 E2)')
  })

  it('gitarska traka koristi GM instrument AcousticGuitarSteel da zvuk liči na gitaru', () => {
    const tex = buildAlphaTex([note({ position: 0 })], TUNING, 'C')
    const lines = tex.split('\n')
    expect(lines[1]).toBe('\\track "Gitara"')
    expect(lines[2]).toBe('\\instrument "AcousticGuitarSteel"')
  })

  it('harmonička traka koristi note.note i GM instrument Harmonica', () => {
    const notes: TabNoteData[] = [note({ position: 0, note: 'C#5', duration: 'eighth' })]
    const tex = buildAlphaTex(notes, TUNING, 'C')
    expect(tex).toContain('\\instrument "Harmonica"')
    expect(tex).toContain('C#5.8')
  })

  it('deli note u nove taktove kad zbir trajanja pređe 4/4 (16 šesnaestinki)', () => {
    // 5 celih nota (whole = 16 jedinica svaka) -> svaka u svom taktu -> 4 bar-separatora '|'
    const notes: TabNoteData[] = Array.from({ length: 5 }, (_, i) =>
      note({ position: i, duration: 'whole', fret: i }),
    )
    const tex = buildAlphaTex(notes, TUNING, 'C')
    const guitarLine = tex.split('\n')[5]
    expect(guitarLine.split('|').length).toBe(5)
  })

  it('poštuje sortiranje po position, ne po redosledu u nizu', () => {
    const notes: TabNoteData[] = [
      note({ position: 1, fret: 2, note: 'A4' }),
      note({ position: 0, fret: 1, note: 'G4' }),
    ]
    const tex = buildAlphaTex(notes, TUNING, 'C')
    const guitarLine = tex.split('\n')[5]
    expect(guitarLine.indexOf('1.1.4')).toBeLessThan(guitarLine.indexOf('2.1.4'))
  })
})
