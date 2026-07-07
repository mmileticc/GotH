<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { lightenColor } from '@/lib/colorUtils'

const store = useEditorStore()

const BOLD_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])

const frets = computed(() => Array.from({ length: store.numOfFrets + 1 }, (_, i) => i))

interface CellInfo {
  fret: number
  fullNote: string
  searchNote: string
  playable: boolean
  advanced: boolean
}

function rowCells(openNote: string): CellInfo[] {
  return frets.value.map((fret) => {
    const fullNote = store.noteSystem.getFullNote(openNote, fret)
    const searchNote = store.noteSystem.getSharpNote(openNote, fret)
    const playable = store.playableNotes.find((n) => n.note === searchNote)
    return {
      fret,
      fullNote,
      searchNote,
      playable: !!playable,
      advanced: !!playable?.advanced,
    }
  })
}

function cellStyle(cell: CellInfo) {
  if (store.fretTheme !== 'custom') return undefined
  if (cell.playable) {
    return { backgroundColor: store.customColor, color: '#fff' }
  }
  return {
    backgroundColor: lightenColor(store.customColor, 0.3),
    color: '#aaa',
    pointerEvents: 'none' as const,
  }
}

function cellClass(cell: CellInfo) {
  const classes: (string | Record<string, boolean>)[] = [{ zeroFret: cell.fret === 0 }]
  if (store.fretTheme === 'custom') return classes
  if (cell.playable) {
    classes.push('fretField', `fret-${store.fretTheme}`)
    if (cell.advanced) classes.push('advancedNote')
  } else {
    classes.push(`fret-${store.fretTheme}-disabled`)
  }
  return classes
}

function onCellClick(stringIndex: number, cell: CellInfo) {
  if (!cell.playable) return
  store.handleFretboardClick(stringIndex, cell.fret, cell.searchNote)
}
</script>

<template>
  <table>
    <tbody>
      <tr v-for="(openNote, stringIndex) in store.tuning" :key="stringIndex">
        <td
          v-for="cell in rowCells(openNote)"
          :key="cell.fret"
          :class="cellClass(cell)"
          :style="cellStyle(cell)"
          @click="onCellClick(stringIndex, cell)"
        >
          {{ cell.fullNote }}
        </td>
      </tr>

      <tr>
        <td
          v-for="fret in frets"
          :key="fret"
          class="tdNoBorder numeration"
          :class="{ boldNumeration: BOLD_FRETS.has(fret) }"
        >
          {{ fret }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
