<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'

const store = useEditorStore()
const containerRef = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
const isMobile = ref(false)

function measure() {
  containerWidth.value = containerRef.value?.clientWidth ?? 0
  isMobile.value = window.matchMedia('(max-width: 576px)').matches
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(() => measure())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
  window.addEventListener('resize', measure)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measure)
})

// mora pratiti CSS: .tab-note flex-basis, .guitar-string gap (vidi style.css)
const notesPerBlock = computed(() => {
  const labelWidth = 40
  const noteWidth = isMobile.value ? 24 : 30
  const gap = 2
  return Math.max(1, Math.floor((containerWidth.value - labelWidth - gap) / (noteWidth + gap)))
})

const totalBlocks = computed(() => Math.ceil(store.notes.length / notesPerBlock.value) || 1)

function blockNotes(blockIndex: number) {
  const start = blockIndex * notesPerBlock.value
  const end = start + notesPerBlock.value
  return store.notes.slice(start, end)
}

function select(position: number) {
  store.selectByPosition(position)
}
</script>

<template>
  <div ref="containerRef" id="guitarTabs" class="m-3">
    <div v-for="blockIndex in totalBlocks" :key="blockIndex" class="measure">
      <div v-for="(openNote, stringIndex) in store.tuning" :key="stringIndex" class="guitar-string">
        <span class="tab-note-label" style="min-width: 40px">{{ openNote.padEnd(4, ' ') }}|</span>

        <span
          v-for="note in blockNotes(blockIndex - 1)"
          :key="note.position"
          class="tab-note"
          :class="{ selected: note.position === store.selectedIndex, 'no-hover': note.string !== stringIndex }"
          @click="note.string === stringIndex && select(note.position)"
        >
          {{ note.string === stringIndex ? note.fret : '-' }}
        </span>
      </div>
    </div>
  </div>
</template>
