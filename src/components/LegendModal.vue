<script setup lang="ts">
import BaseModal from './BaseModal.vue'

const open = defineModel<boolean>({ default: false })

const keys = [
  'legend_blow',
  'legend_draw',
  'legend_draw_bend_half',
  'legend_draw_bend_full',
  'legend_draw_bend_onehalf',
  'legend_blow_bend_half',
  'legend_blow_bend_full',
  'legend_overblow',
  'legend_overdraw',
]
</script>

<template>
  <BaseModal v-model="open" :title="$t('legend_modal_title')">
    <ul>
      <li v-for="k in keys" :key="k">{{ $t(k) }}</li>
    </ul>
  </BaseModal>
</template>
