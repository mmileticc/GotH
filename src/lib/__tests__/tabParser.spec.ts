import { describe, expect, it } from 'vitest'
import { parseGuitarTab } from '../tabParser'
import { NoteSystem } from '../noteSystem'

const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']

describe('parseGuitarTab', () => {
  it('parsira standardni 6-linijski tab i sortira po koloni', () => {
    const text = [
      'e|--3--5--7--|',
      'B|------------|',
      'G|------------|',
      'D|------------|',
      'A|------------|',
      'E|--0--2--3--|',
    ].join('\n')

    const notes = parseGuitarTab(text, tuning, new NoteSystem())

    expect(notes).toHaveLength(6)
    expect(notes.map((n) => n.string)).toEqual([0, 5, 0, 5, 0, 5])
    expect(notes.map((n) => n.fret)).toEqual([3, 0, 5, 2, 7, 3])
    expect(notes.map((n) => n.position)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('baca grešku ako nema dovoljno linija', () => {
    expect(() => parseGuitarTab('e|---3---|', tuning, new NoteSystem())).toThrow()
  })

  it('baca grešku ako nema nijedne note', () => {
    const text = ['e|------|', 'B|------|', 'G|------|', 'D|------|', 'A|------|', 'E|------|'].join('\n')
    expect(() => parseGuitarTab(text, tuning, new NoteSystem())).toThrow()
  })
})
