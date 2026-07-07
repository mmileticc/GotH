import type { TabNoteData } from '@/types/tab'
import { DiatonicHarmonica } from './harmonica'

export type ExportType = 'guitar+harmonica' | 'harmonica-only'

function harmonicaTabFor(note: TabNoteData, harmonica: DiatonicHarmonica): string {
  const playable = harmonica.getPlayableNotes().findLast((h) => h.note === note.note)
  return playable ? playable.tab.toString() : 'no'
}

export function buildHarmonicaLine(notes: TabNoteData[], harmonica: DiatonicHarmonica): string {
  let line = ''
  notes.forEach((n, i) => {
    line += harmonicaTabFor(n, harmonica)
    line += ' '
    if ((i + 1) % 10 === 0) line += '\n'
  })
  return line
}

// gitara: 6 redova sa razbijanjem na blokove
export function buildGuitarTabsTxt(notes: TabNoteData[], tuning: string[], num = 100): string {
  const lines: string[] = []
  const stringRows = tuning.map((openNote) => openNote.padEnd(3, ' ') + '|')

  notes.forEach((note) => {
    tuning.forEach((_openNote, stringIndex) => {
      if (note.string === stringIndex) {
        stringRows[stringIndex] += note.fret.toString().padStart(3, '-')
      } else {
        stringRows[stringIndex] += '---'
      }
    })
  })

  const maxLen = Math.max(...stringRows.map((r) => r.length))
  for (let start = 0; start < maxLen; start += num) {
    tuning.forEach((_openNote, stringIndex) => {
      lines.push(stringRows[stringIndex].slice(start, start + num))
    })
    lines.push('')
  }

  return lines.join('\n')
}

export function buildExportText(
  notes: TabNoteData[],
  tuning: string[],
  harmonica: DiatonicHarmonica,
  type: ExportType,
): string {
  const lines: string[] = []
  if (type !== 'harmonica-only') {
    lines.push(buildGuitarTabsTxt(notes, tuning, 100))
  }
  lines.push('\nHarmonica tabs: \n')
  lines.push(buildHarmonicaLine(notes, harmonica))
  return lines.join('\n')
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
