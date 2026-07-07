<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <div id="main">
    <AppNavbar />
    <RouterView />
  </div>
</template>
