<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import type { TabNoteData } from '@/types/tab'

const store = useEditorStore()

function tabFor(note: TabNoteData): string {
  const playable = store.playableNotes.findLast((h) => h.note === note.note)
  return playable ? playable.tab.toString().padStart(6, ' ') : ' no '
}

const items = computed(() => store.notes.map((n) => ({ note: n, text: tabFor(n) })))

function select(position: number) {
  store.selectByPosition(position)
}
</script>

<template>
  <div id="harmonicaTabs" class="row m-3">
    <span
      v-for="item in items"
      :key="item.note.position"
      class="tab-note"
      :class="{ selected: item.note.position === store.selectedIndex }"
      @click="select(item.note.position)"
      >{{ item.text }}</span
    >
  </div>
</template>
