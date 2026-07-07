<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import { useEditorStore } from '@/stores/editorStore'
import { parseGuitarTab } from '@/lib/tabParser'

const store = useEditorStore()
const open = defineModel<boolean>({ default: false })
const text = ref('')
const error = ref('')

function confirm() {
  try {
    const parsed = parseGuitarTab(text.value, store.tuning, store.noteSystem)
    store.loadParsedNotes(parsed)
    error.value = ''
    open.value = false
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <BaseModal v-model="open" :title="$t('paste_modal_title')">
    <p>{{ $t('paste_modal_p') }}</p>
    <textarea
      v-model="text"
      rows="8"
      class="form-control"
      placeholder="e|--3--5--7--|&#10;B|------------|&#10;G|------------|&#10;D|------------|&#10;A|------------|&#10;E|--0--2--3--|"
    ></textarea>
    <div v-if="error" class="text-danger mt-2">{{ error }}</div>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="open = false">{{ $t('modal_cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="confirm">{{ $t('paste_confirm_button') }}</button>
    </template>
  </BaseModal>
</template>
