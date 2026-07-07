export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export interface TabNoteData {
  string: number
  fret: number
  position: number
  note: string // npr. "C#4"
  duration: NoteDuration
}

export type HarmonicaNoteType = 'bend' | 'overblow' | 'overdraw'

export interface HarmonicaLayoutEntry {
  tab: string
  offset: number
  advanced?: boolean
  type?: HarmonicaNoteType
}

export interface PlayableNote {
  note: string
  tab: string
  advanced: boolean
  type: HarmonicaNoteType | null
}

export type FretTheme = 'mahogany' | 'maple' | 'ebony' | 'custom'
export type NotationPreference = 'sharp' | 'flat'
export type EditMode = 'editFromFretboard' | 'insertAfter'
