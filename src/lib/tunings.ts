export interface TuningPreset {
  id: string
  label: string
  tuning: string[]
}

// Format note-a: [A-G](#|b)?[octava], visoko->nisko (isti redosled kao tuning niz u store-u)
export const TUNING_PRESETS: TuningPreset[] = [
  { id: 'standard', label: 'Standard (E A D G B E)', tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'] },
  { id: 'drop-d', label: 'Drop D', tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'] },
  {
    id: 'half-step-down',
    label: 'Half Step Down (Eb Ab Db Gb Bb Eb)',
    tuning: ['Eb4', 'Bb3', 'Gb3', 'Db3', 'Ab2', 'Eb2'],
  },
  { id: 'dadgad', label: 'DADGAD', tuning: ['D4', 'A3', 'G3', 'D3', 'A2', 'D2'] },
  { id: 'open-g', label: 'Open G (D G D G B D)', tuning: ['D4', 'B3', 'G3', 'D3', 'G2', 'D2'] },
  { id: 'open-d', label: 'Open D (D A D F# A D)', tuning: ['D4', 'A3', 'F#3', 'D3', 'A2', 'D2'] },
]

export const CUSTOM_TUNING_ID = 'custom'

export function findPresetByTuning(tuning: string[]): string {
  const match = TUNING_PRESETS.find(
    (p) => p.tuning.length === tuning.length && p.tuning.every((n, i) => n === tuning[i]),
  )
  return match ? match.id : CUSTOM_TUNING_ID
}

// Čitljivo ime trenutnog štima — koristi se i u UI (pored naslova gitarskih
// tabova) i u PNG exportu (kao deo naslova trake, da se zna koji je štim
// korišćen kad se slika sačuva/podeli van aplikacije).
//
// Konvencija ispisa: štim se piše/čita OD NAJDEBLJE (6.) KA NAJTANJOJ (1.)
// žici — npr. "DADGAD", "EADGBE" — dok je tuning[] niz u SUPROTNOM redosledu
// (visoko->nisko, string 1 = index 0, vidi napomenu uz TUNING_PRESETS), pa se
// ovde niz OKREĆE pre spajanja u tekst za custom štimove. Gotovi presetovi
// imaju ručno upisan label koji već prati ovu konvenciju.
export function tuningDisplayName(tuning: string[]): string {
  const id = findPresetByTuning(tuning)
  if (id === CUSTOM_TUNING_ID) return [...tuning].reverse().join(' ')
  return TUNING_PRESETS.find((p) => p.id === id)?.label ?? [...tuning].reverse().join(' ')
}

// Detaljan prikaz štima po žicama — ispisuje se OD NAJDEBLJE (6.) KA
// NAJTANJOJ (1.) žici, isto kao standardna konvencija za imenovanje štimova
// (npr. "DADGAD" se čita 6->1, ne 1->6) — npr. "6=E2  5=A2  4=D3  3=G3
// 2=B3  1=E4". Brojevi žica ostaju standardni (1 = najviša/tanja žica), samo
// je REDOSLED ISPISA okrenut u odnosu na tuning[] niz (koji je visoko->nisko,
// vidi napomenu uz store.tuning). Koristi se na PNG exportu (vidi
// NotationExporter.vue) da se tačno vidi koja je žica na koji ton
// naštimovana, bez potrebe da se vraćaš u editor. Namerno se NE ugrađuje u
// alphaTab-ov naslov trake — taj naslov se iscrtava u uskoj, fiksne širine,
// ROTIRANOJ koloni napravljenoj za jednu kratku reč (npr. "Gitara"/
// "Harmonika"), pa duži tekst tu biva odsečen/nečitljiv. Umesto toga se
// ispisuje kao poseban red preko canvas-a.
export function tuningStringBreakdown(tuning: string[]): string {
  return tuning
    .map((note, i) => `${i + 1}=${note}`)
    .reverse()
    .join('  ')
}

const NOTE_PATTERN = /^[A-Ga-g](#|b)?[0-9]$/

export function isValidNoteString(value: string): boolean {
  return NOTE_PATTERN.test(value.trim())
}

// --- Selektovanje note preko dropdown-ova (bez slobodnog kucanja) ----------

// Uvek sharp zapis u dropdown-u (jednostavnije, jednoznačno; isti ton kao odgovarajući flat)
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Pokriva uobičajene i drop/alternativne štimove (od kontrabas registra do visokih altova)
export const OCTAVE_RANGE = [0, 1, 2, 3, 4, 5, 6]

export function parseNoteString(value: string): { name: string; octave: number } {
  const m = /^([A-Ga-g])([#b]?)([0-9])$/.exec(value.trim())
  if (!m) return { name: 'E', octave: 4 }
  const letter = m[1].toUpperCase()
  const accidental = m[2]
  return { name: letter + accidental, octave: parseInt(m[3], 10) }
}

export function buildNoteString(name: string, octave: number): string {
  return `${name}${octave}`
}
