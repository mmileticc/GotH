import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { alphaTab } from '@coderline/alphatab-vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // repo se servira sa https://mmileticc.github.io/GotH/ — base se primenjuje
  // SAMO na build, ne i na dev server. Vite dev server ima poznat problem sa
  // non-root base + ESM Web Worker bundling-om (alphaTab koristi module
  // worker za pozadinsku obradu): interni "@vite/env" skript dobije pogrešan
  // prefiks i dev server puca sa "Failed to resolve import /GotH/@vite/env".
  base: command === 'build' ? '/GotH/' : '/',
  plugins: [vue(), alphaTab()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}))
