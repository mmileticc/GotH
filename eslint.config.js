import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue}'] },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/legacy/**', '**/node_modules/**', '**/coverage/**'],
  },
  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  {
    name: 'app/rules-override',
    rules: {
      // domenska imena (Fretboard i sl.) su namerno jednorečna
      'vue/multi-word-component-names': 'off',
    },
  },
]
