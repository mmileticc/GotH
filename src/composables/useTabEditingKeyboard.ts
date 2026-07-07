import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Port legacy/js/tabManager.js listen() — unos cifara sa tastature za
 * editovanje selektovane note, Delete/Escape, deselekcija klikom van note,
 * plus Ctrl+Z/Ctrl+Y za undo/redo (Faza 2).
 */
export function useTabEditingKeyboard() {
  const store = useEditorStore()
  const inputBuffer = ref('')

  // Snapshot za undo se pravi samo JEDNOM po "edit sesiji" (od trenutka
  // selekcije note do promene selekcije), a ne na svaki pritisak cifre.
  let editSnapshotTaken = false
  watch(
    () => store.selectedIndex,
    () => {
      editSnapshotTaken = false
    },
  )

  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      store.undo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault()
      store.redo()
      return
    }

    if (e.key === 'Escape') {
      store.selectByPosition(null)
      inputBuffer.value = ''
      return
    }

    if (store.selectedIndex === null) return

    if (e.key >= '0' && e.key <= '9') {
      if (!editSnapshotTaken) {
        store.pushHistory()
        editSnapshotTaken = true
      }

      const digit = e.key
      inputBuffer.value += digit
      const fretNum = parseInt(inputBuffer.value, 10)

      if (!isNaN(fretNum) && fretNum <= store.numOfFrets) {
        store.editSelected(fretNum)
      } else {
        store.editSelected(parseInt(digit, 10))
        inputBuffer.value = digit
      }
    }

    if (e.key === 'Enter') {
      inputBuffer.value = ''
    }

    if (e.key === 'Delete') {
      store.deleteSelected()
      inputBuffer.value = ''
    }
  }

  function onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null
    if (!target?.closest('.tab-note')) {
      store.selectByPosition(null)
      inputBuffer.value = ''
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('click', onDocumentClick)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('click', onDocumentClick)
  })

  return { inputBuffer }
}
