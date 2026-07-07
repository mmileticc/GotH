<script setup lang="ts">
defineProps<{ title?: string }>()
const open = defineModel<boolean>({ default: false })

function close() {
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <template v-if="open">
      <div class="modal-backdrop show"></div>
      <div class="modal d-block" tabindex="-1" @click.self="close">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><slot name="title">{{ title }}</slot></h5>
              <button type="button" class="btn-close" @click="close"></button>
            </div>
            <div class="modal-body">
              <slot />
            </div>
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer" :close="close" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>
