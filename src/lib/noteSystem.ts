import type { NotationPreference } from '@/types/tab'

// Port 1:1 sa legacy/js/noteSystem.js
export class NoteSystem {
  notesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  isSharp = true
  notes: string[] = this.notesSharp

  setNotation(type: NotationPreference) {
    this.isSharp = type === 'sharp'
    this.notes = this.isSharp ? this.notesSharp : this.notesFlat
  }

  findIndex(note: string): number {
    if (note.includes('b')) return this.notesFlat.indexOf(note)
    if (note.includes('#')) return this.notesSharp.indexOf(note)
    return this.notes.indexOf(note)
  }

  private _computeIndexOctave(openNote: string, fret: number) {
    const octave = parseInt(openNote.slice(-1), 10)
    const rootIndex = this.findIndex(openNote.slice(0, -1))
    const idx = (rootIndex + fret) % this.notesSharp.length
    const octaveDiff = Math.floor((rootIndex + fret) / this.notesSharp.length)
    return { idx, octave: octave + octaveDiff }
  }

  getFullNote(openNote: string, fret: number): string {
    const { idx, octave } = this._computeIndexOctave(openNote, fret)
    return this.notes[idx] + octave
  }

  getSharpNote(openNote: string, fret: number): string {
    const { idx, octave } = this._computeIndexOctave(openNote, fret)
    return this.notesSharp[idx] + octave
  }
}
