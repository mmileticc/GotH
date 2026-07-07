import type { HarmonicaLayoutEntry, PlayableNote } from '@/types/tab'

// Port 1:1 sa legacy/js/harmonica.js
const SEMITONE_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const ROOT_MIDI: Record<string, number> = {
  G: 43,
  Ab: 44,
  A: 45,
  Bb: 46,
  B: 47,
  C: 48,
  Db: 49,
  D: 50,
  Eb: 51,
  E: 52,
  F: 53,
  'F#': 54,
}

// Standardni raspored diatonske harmonike (Richter). Svaki element:
// { tab, offset } gde je offset relativan broj polutonova u odnosu na tonalitet (root).
const LAYOUT: HarmonicaLayoutEntry[] = [
  // Hole 1
  { tab: '1', offset: 0 },
  { tab: '-1', offset: 2 },
  { tab: '-1/', offset: 1, advanced: true, type: 'bend' },
  { tab: '1*', offset: 3, advanced: true, type: 'overblow' },

  // Hole 2
  { tab: '2', offset: 4 },
  { tab: '-2', offset: 7 },
  { tab: '-2/', offset: 6, advanced: true, type: 'bend' },
  { tab: '-2//', offset: 5, advanced: true, type: 'bend' },

  // Hole 3
  { tab: '3', offset: 7 },
  { tab: '-3', offset: 11 },
  { tab: '-3/', offset: 10, advanced: true, type: 'bend' },
  { tab: '-3//', offset: 9, advanced: true, type: 'bend' },
  { tab: '-3///', offset: 8, advanced: true, type: 'bend' },

  // Hole 4
  { tab: '4', offset: 12 },
  { tab: '-4', offset: 14 },
  { tab: '-4/', offset: 13, advanced: true, type: 'bend' },
  { tab: '4*', offset: 15, advanced: true, type: 'overblow' },

  // Hole 5
  { tab: '5', offset: 16 },
  { tab: '-5', offset: 17 },
  { tab: '5*', offset: 18, advanced: true, type: 'overblow' },

  // Hole 6
  { tab: '6', offset: 19 },
  { tab: '-6', offset: 21 },
  { tab: '-6/', offset: 20, advanced: true, type: 'bend' },
  { tab: '6*', offset: 22, advanced: true, type: 'overblow' },

  // Hole 7
  { tab: '7', offset: 24 },
  { tab: '-7', offset: 23 },
  { tab: '-7*', offset: 25, advanced: true, type: 'overdraw' },

  // Hole 8
  { tab: '8', offset: 28 },
  { tab: '+8/', offset: 27, advanced: true, type: 'bend' },
  { tab: '-8', offset: 26 },

  // Hole 9
  { tab: '9', offset: 31 },
  { tab: '+9/', offset: 30, advanced: true, type: 'bend' },
  { tab: '-9', offset: 29 },
  { tab: '-9*', offset: 32, advanced: true, type: 'overdraw' },

  // Hole 10
  { tab: '10', offset: 36 },
  { tab: '+10/', offset: 35, advanced: true, type: 'bend' },
  { tab: '+10//', offset: 34, advanced: true, type: 'bend' },
  { tab: '-10', offset: 33 },
  { tab: '-10*', offset: 37, advanced: true, type: 'overdraw' },
]

export class DiatonicHarmonica {
  key: string
  rootMidi: number
  advanced = false
  layout = LAYOUT

  constructor(key = 'C') {
    this.key = key
    this.rootMidi = ROOT_MIDI[key]
  }

  semitoneToNoteWithOctave(abs: number): string {
    const noteName = SEMITONE_TO_NOTE[((abs % 12) + 12) % 12]
    const octave = Math.floor(abs / 12) - 1
    return noteName + octave
  }

  /** Vraća listu objekata { note, tab } za trenutni tonalitet harmonike */
  getPlayableNotes(): PlayableNote[] {
    return this.layout
      .filter((entry) => !entry.advanced || (entry.advanced && this.advanced))
      .map((entry) => {
        const absolute = this.rootMidi + entry.offset
        const note = this.semitoneToNoteWithOctave(absolute)
        return {
          note,
          tab: entry.tab,
          advanced: !!entry.advanced,
          type: entry.type ?? null,
        }
      })
  }

  setKey(newKey: string) {
    this.key = newKey
    this.rootMidi = ROOT_MIDI[newKey]
  }

  setAdvancedMode(enabled: boolean) {
    this.advanced = !!enabled
  }
}

export const HARMONICA_KEYS_COMMON = ['C', 'G', 'A', 'D', 'F']
export const HARMONICA_KEYS_OTHER = ['Ab', 'Bb', 'B', 'Db', 'Eb', 'E', 'F#']
