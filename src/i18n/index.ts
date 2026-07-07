import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import sr from './locales/sr.json'

const STORAGE_KEY = 'goth_lang'

export function getStoredLocale(): 'en' | 'sr' {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'sr' ? 'sr' : 'en'
}

export function setStoredLocale(locale: 'en' | 'sr') {
  localStorage.setItem(STORAGE_KEY, locale)
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en',
  messages: { en, sr },
})

export default i18n
