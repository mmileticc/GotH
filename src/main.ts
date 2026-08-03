import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import posthog from 'posthog-js'

import './assets/style.css'
import './assets/customButtons.css'

const app = createApp(App)

const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const posthogHost = import.meta.env.VITE_POSTHOG_HOST
const posthogConfigured = Boolean(posthogToken && posthogHost)

if (posthogConfigured) {
  posthog.init(posthogToken, { api_host: posthogHost })
} else if (import.meta.env.DEV) {
  if (!posthogToken) {
    console.error(
      'VITE_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_PROJECT_TOKEN is configured',
    )
  }
  if (!posthogHost) {
    console.error(
      'VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured',
    )
  }
}

app.use(createPinia())
app.use(router)
app.use(i18n)

app.config.errorHandler = (error) => {
  if (posthogConfigured) {
    posthog.captureException(error)
  }
}

app.mount('#app')
