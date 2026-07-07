<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const FORM_ACTION = 'https://formspree.io/f/xlgolpor'

const name = ref('')
const email = ref('')
const message = ref('')
const rating = ref<number | null>(null)
const hoverRating = ref<number | null>(null)
const submitting = ref(false)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

function setStars(value: number) {
  rating.value = value
}

async function onSubmit() {
  submitting.value = true
  feedback.value = null

  const formData = new FormData()
  formData.set('name', name.value)
  formData.set('email', email.value)
  formData.set('message', message.value)
  if (rating.value) formData.set('rating', String(rating.value))

  try {
    const res = await fetch(FORM_ACTION, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('server error')
    feedback.value = { type: 'success', text: t('about_form_success') }
    name.value = ''
    email.value = ''
    message.value = ''
    rating.value = null
  } catch {
    feedback.value = { type: 'error', text: t('about_form_error') }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container mt-4" style="max-width: 860px">
    <div class="text-center mb-5">
      <span class="about-wip-badge">{{ $t('about_badge') }}</span>
      <h1 class="mt-3">{{ $t('about_title') }}</h1>
    </div>

    <section class="about-section mb-4">
      <h2>{{ $t('about_intro_title') }}</h2>
      <p>{{ $t('about_intro_p1') }}</p>
      <p>{{ $t('about_intro_p2') }}</p>
    </section>

    <section class="about-section mb-4">
      <h2>{{ $t('about_name_title') }}</h2>
      <p>{{ $t('about_name_p1') }}</p>
      <p>{{ $t('about_name_p2') }}</p>
    </section>

    <section class="about-section mb-4">
      <h2>{{ $t('about_wip_title') }}</h2>
      <p>{{ $t('about_wip_desc') }}</p>

      <h3 class="mt-4">{{ $t('about_planned_title') }}</h3>
      <ul class="about-list">
        <li>{{ $t('about_plan_2') }}</li>
        <li>{{ $t('about_plan_3') }}</li>
        <li>{{ $t('about_plan_4') }}</li>
      </ul>
    </section>

    <section class="about-section mb-4">
      <h2>{{ $t('about_github_title') }}</h2>
      <p>{{ $t('about_github_text') }}</p>
      <a
        href="https://github.com/mmileticc/GotH"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-theme btn-mahogany"
        >{{ $t('about_github_btn') }}</a
      >
    </section>

    <section class="about-section mb-5">
      <h2>{{ $t('about_contact_title') }}</h2>
      <p>{{ $t('about_contact_desc') }}</p>

      <form class="about-form mt-3" @submit.prevent="onSubmit">
        <div class="mb-3">
          <label for="contactName" class="form-label">{{ $t('about_form_name') }}</label>
          <input id="contactName" v-model="name" type="text" class="form-control" maxlength="100" autocomplete="name" />
        </div>

        <div class="mb-3">
          <label for="contactEmail" class="form-label">{{ $t('about_form_email') }}</label>
          <input id="contactEmail" v-model="email" type="email" class="form-control" maxlength="254" autocomplete="email" />
        </div>

        <div class="mb-3">
          <label class="form-label">{{ $t('about_form_rating') }}</label>
          <div id="starRating" class="about-stars" role="group" aria-label="Ocena" @mouseleave="hoverRating = null">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="star-btn"
              :class="{ active: rating !== null && n <= rating, hover: hoverRating !== null && n <= hoverRating }"
              :aria-label="`${n} zvezda`"
              @click="setStars(n)"
              @mouseenter="hoverRating = n"
            >
              ★
            </button>
          </div>
        </div>

        <div class="mb-3">
          <label for="contactMessage" class="form-label">{{ $t('about_form_message') }}</label>
          <textarea
            id="contactMessage"
            v-model="message"
            class="form-control"
            rows="5"
            required
            maxlength="2000"
          ></textarea>
        </div>

        <div v-if="feedback" class="mb-3" role="alert" :class="feedback.type === 'success' ? 'text-success fw-semibold' : 'text-danger fw-semibold'">
          {{ feedback.text }}
        </div>

        <button type="submit" class="btn btn-theme btn-mahogany" :disabled="submitting">
          {{ $t('about_form_submit') }}
        </button>
      </form>
    </section>
  </div>

  <footer class="text-center mt-4 py-4 border-top bg-light">
    <small>{{ $t('footer_text') }}</small>
  </footer>
</template>
