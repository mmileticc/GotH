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

  it('eksplicitno postavlja \\ts kad takt ne sabira tačno na 4/4 (sprečava tihu pauzu)', () => {
    // 3 četvrtine + 1 osmina = 14/16 -> sledeća četvrtina (4) bi prešla 16, pa se
    // takt zatvara na 14 jedinica. Bez eksplicitnog \ts, alphaTab bi ovaj takt
    // tretirao kao nepotpun 4/4 i tiho dopunio ostatak pauzom (14/16 -> 7/8 takt).
    const notes: TabNoteData[] = [
      note({ position: 0, duration: 'quarter', fret: 0 }),
      note({ position: 1, duration: 'quarter', fret: 1 }),
      note({ position: 2, duration: 'quarter', fret: 2 }),
      note({ position: 3, duration: 'eighth', fret: 3 }),
      note({ position: 4, duration: 'quarter', fret: 4 }),
    ]
    const tex = buildAlphaTex(notes, TUNING, 'C')
    const guitarLine = tex.split('\n')[5]
    const bars = guitarLine.split('|').map((b) => b.trim())
    expect(bars[0]).toMatch(/^\\ts \(7 8\)/)
    expect(bars[1]).toMatch(/^\\ts \(1 4\)/)
  })

  it('ne dodaje \\ts kad je takt puna 4/4 (podrazumevano, bez nepotrebnog šuma)', () => {
    const notes: TabNoteData[] = [note({ position: 0, duration: 'whole' })]
    const tex = buildAlphaTex(notes, TUNING, 'C')
    const guitarLine = tex.split('\n')[5]
    expect(guitarLine).not.toContain('\\ts')
  })
})
