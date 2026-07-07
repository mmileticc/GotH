import type { NoteDuration, TabNoteData } from '@/types/tab'

// Mapiranje internog trajanja note na alphaTex brojčanu vrednost trajanja
// (1=cela, 2=polovina, 4=četvrtina, 8=osmina, 16=šesnaestina).
const DURATION_VALUE: Record<NoteDuration, number> = {
  whole: 1,
  half: 2,
  quarter: 4,
  eighth: 8,
  sixteenth: 16,
}

// Trajanje izraženo u "jedinicama" od 1/16 note, radi računanja koliko nota
// staje u jedan takt (4/4 takt = 16 šesnaestinki).
const DURATION_UNITS: Record<NoteDuration, number> = {
  whole: 16,
  half: 8,
  quarter: 4,
  eighth: 2,
  sixteenth: 1,
}

const BAR_UNITS = 16

// GM instrument imena su case-insensitive i bez razmaka (npr. "acousticguitarsteel"
// mapira na General MIDI program 25) — vidi GeneralMidi._values tabelu u alphaTab-u.
const GUITAR_INSTRUMENT = 'AcousticGuitarSteel'
const HARMONICA_INSTRUMENT = 'Harmonica'

function escapeAlphaTexString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Grupiše note u "taktove" tako da zbir trajanja u jednom taktu ne pređe
 * 16 šesnaestinki (4/4). Nije muzikološki savršeno (ne deli note na vezane
 * preko granice takta), ali daje čitljiv i validan alphaTex bez potrebe da
 * korisnik ručno unosi taktove — dovoljno za notaciju/ritam/audio prikaz.
 */
function splitIntoBars(sortedNotes: TabNoteData[]): TabNoteData[][] {
  const bars: TabNoteData[][] = []
  let current: TabNoteData[] = []
  let unitsUsed = 0

  for (const note of sortedNotes) {
    const units = DURATION_UNITS[note.duration]
    if (unitsUsed + units > BAR_UNITS && current.length > 0) {
      bars.push(current)
      current = []
      unitsUsed = 0
    }
    current.push(note)
    unitsUsed += units
  }
  if (current.length > 0) bars.push(current)

  return bars
}

/**
 * Generiše alphaTex izvor za trenutni tab: jedna traka za gitaru (tab
 * notacija, stvarni štim korisnika, GM instrument "AcousticGuitarSteel" da
 * zvuk zaista liči na gitaru umesto default GM instrumenta) i jedna traka za
 * harmoniku (standardna notacija, GM instrument "Harmonica"), sa istim
 * ritmom preuzetim iz note.duration polja.
 *
 * store.tuning je niz visoko->nisko (string 1 = najviša žica), što je tačno
 * isti redosled koji alphaTex očekuje u `\tuning (...)` tagu, pa se
 * prosleđuje direktno bez remapiranja. Isto tako note.string (0-indeksirano,
 * 0 = najviša žica) mapira se u alphaTex string broj kao `string + 1`.
 */
export function buildAlphaTex(notes: TabNoteData[], tuning: string[], harmonicaKey: string): string {
  if (notes.length === 0) {
    return [
      '\\tempo 120',
      '\\track "Gitara"',
      `\\instrument "${GUITAR_INSTRUMENT}"`,
      'r.4',
      '\\track "Harmonika"',
      `\\instrument "${HARMONICA_INSTRUMENT}"`,
      'r.4',
    ].join('\n')
  }

  const sorted = [...notes].sort((a, b) => a.position - b.position)
  const bars = splitIntoBars(sorted)

  const guitarBars = bars.map((bar) =>
    bar.map((n) => `${n.fret}.${n.string + 1}.${DURATION_VALUE[n.duration]}`).join(' '),
  )
  const harmonicaBars = bars.map((bar) => bar.map((n) => `${n.note}.${DURATION_VALUE[n.duration]}`).join(' '))

  const tuningStr = tuning.join(' ')
  const harmonicaLabel = escapeAlphaTexString(`Harmonika (${harmonicaKey})`)

  return [
    '\\tempo 120',
    '\\track "Gitara"',
    `\\instrument "${GUITAR_INSTRUMENT}"`,
    `\\tuning (${tuningStr})`,
    '\\staff {tabs}',
    guitarBars.join(' | '),
    `\\track "${harmonicaLabel}"`,
    `\\instrument "${HARMONICA_INSTRUMENT}"`,
    '\\staff {score}',
    harmonicaBars.join(' | '),
  ].join('\n')
}
