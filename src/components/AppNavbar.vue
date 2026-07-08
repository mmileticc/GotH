<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { setStoredLocale } from '@/i18n'
import { useDarkMode } from '@/composables/useDarkMode'
import AppIcon from '@/components/icons/AppIcon.vue'

const { locale } = useI18n()
const route = useRoute()
const { isDark, toggle } = useDarkMode()

const navOpen = ref(false)
const langOpen = ref(false)

function setLang(lang: 'en' | 'sr') {
  locale.value = lang
  setStoredLocale(lang)
  langOpen.value = false
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container-fluid">
      <RouterLink class="navbar-brand d-flex align-items-center" to="/">
        <img src="/img/icon-192.png" alt="GotH logo" width="50" height="50" class="d-inline-block align-text-top me-2" />
        <span class="logo-text">{{ $t('nav_brand') }}</span>
      </RouterLink>

      <button class="navbar-toggler" type="button" @click="navOpen = !navOpen">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" :class="{ show: navOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-3">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/about">{{ $t('about_nav') }}</RouterLink>
          </li>
        </ul>
        <div class="d-flex align-items-center flex-column flex-lg-row gap-2 gap-lg-0 ms-lg-auto">
          <RouterLink v-if="route.name !== 'home'" to="/" class="btn btn-outline-light me-2">
            {{ $t('back_btn') }}
          </RouterLink>
          <button class="btn btn-outline-light me-2" type="button" title="Tamna/Svetla tema" @click="toggle">
            <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
          </button>
          <div class="btn-group me-lg-2 w-100 w-lg-auto position-relative">
            <button
              type="button"
              class="btn btn-outline-light dropdown-toggle"
              @click="langOpen = !langOpen"
            >
              {{ locale.toUpperCase() }}
            </button>
            <ul class="dropdown-menu" :class="{ show: langOpen }">
              <li><a class="dropdown-item" href="#" @click.prevent="setLang('en')">English</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="setLang('sr')">Srpski</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
