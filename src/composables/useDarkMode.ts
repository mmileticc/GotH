import { onMounted, ref } from 'vue'

const STORAGE_KEY = 'goth_site_theme'
const isDark = ref(false)

function apply(dark: boolean) {
  document.body.classList.toggle('dark-mode', dark)
}

let initialized = false

export function useDarkMode() {
  onMounted(() => {
    if (initialized) return
    initialized = true
    const saved = localStorage.getItem(STORAGE_KEY) || 'light'
    isDark.value = saved === 'dark'
    apply(isDark.value)
  })

  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
