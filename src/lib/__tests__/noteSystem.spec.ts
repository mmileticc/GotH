import { describe, expect, it } from 'vitest'
import { NoteSystem } from '../noteSystem'

describe('NoteSystem', () => {
  it('računa punu notu za otvorenu žicu + prag (sharp)', () => {
    const ns = new NoteSystem()
    expect(ns.getFullNote('E4', 0)).toBe('E4')
    expect(ns.getFullNote('E4', 1)).toBe('F4')
    expect(ns.getFullNote('E4', 3)).toBe('G4')
    expect(ns.getFullNote('E4', 8)).toBe('C5')
  })

  it('prebacuje na flat notaciju', () => {
    const ns = new NoteSystem()
    ns.setNotation('flat')
    expect(ns.getFullNote('A2', 1)).toBe('Bb2')
  })

  it('getSharpNote uvek vraća sharp bez obzira na notaciju', () => {
    const ns = new NoteSystem()
    ns.setNotation('flat')
    expect(ns.getSharpNote('A2', 1)).toBe('A#2')
  })
})
