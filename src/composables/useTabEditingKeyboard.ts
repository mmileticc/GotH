import { onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Port legacy/js/tabManager.js listen() — unos cifara sa tastature za
 * editovanje selektovane note, Delete/Escape, i deselekcija klikom van note.
 */
export function useTabEditingKeyboard() {
  const store = useEditorStore()
  const inputBuffer = ref('')

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      store.selectByPosition(null)
      inputBuffer.value = ''
      return
    }

    if (store.selectedIndex === null) return

    if (e.key >= '0' && e.key <= '9') {
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
