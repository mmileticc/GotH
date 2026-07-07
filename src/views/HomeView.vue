<script setup lang="ts"></script>

<template>
  <div class="container mt-5">
    <!-- Hero section -->
    <section class="text-center mb-5 py-5">
      <h1 class="display-4 fw-bold mb-3">{{ $t('hero_h1') }}</h1>
      <p class="lead fs-5 mb-4">{{ $t('hero_subtitle') }}</p>
      <p class="text-muted fs-6 mb-4">{{ $t('hero_desc') }}</p>
      <RouterLink to="/editor" class="btn btn-lg btn-theme btn-mahogany">{{ $t('editor_btn') }}</RouterLink>
    </section>

    <!-- Features section -->
    <section class="mb-5 py-5">
      <h2 class="text-center mb-4">{{ $t('features_title') }}</h2>
      <div class="row g-4">
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="fs-1 mb-3">🎸</div>
              <h5 class="card-title">{{ $t('feature_1_title') }}</h5>
              <p class="card-text text-muted">{{ $t('feature_1_desc') }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="fs-1 mb-3">🎼</div>
              <h5 class="card-title">{{ $t('feature_2_title') }}</h5>
              <p class="card-text text-muted">{{ $t('feature_2_desc') }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="fs-1 mb-3">⚙️</div>
              <h5 class="card-title">{{ $t('feature_3_title') }}</h5>
              <p class="card-text text-muted">{{ $t('feature_3_desc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="mb-5 py-5 bg-light rounded p-4">
      <h2 class="text-center mb-4">{{ $t('how_works_title') }}</h2>
      <div class="row g-4">
        <div class="col-md-3 text-center">
          <div class="rounded-circle text-white d-inline-flex align-items-center justify-content-center mahogany-circle">1</div>
          <h5 class="mt-3">{{ $t('step_1_title') }}</h5>
          <p class="text-muted small">{{ $t('step_1_desc') }}</p>
        </div>
        <div class="col-md-3 text-center">
          <div class="rounded-circle text-white d-inline-flex align-items-center justify-content-center mahogany-circle">2</div>
          <h5 class="mt-3">{{ $t('step_2_title') }}</h5>
          <p class="text-muted small">{{ $t('step_2_desc') }}</p>
        </div>
        <div class="col-md-3 text-center">
          <div class="rounded-circle text-white d-inline-flex align-items-center justify-content-center mahogany-circle">3</div>
          <h5 class="mt-3">{{ $t('step_3_title') }}</h5>
          <p class="text-muted small">{{ $t('step_3_desc') }}</p>
        </div>
        <div class="col-md-3 text-center">
          <div class="rounded-circle text-white d-inline-flex align-items-center justify-content-center mahogany-circle">4</div>
          <h5 class="mt-3">{{ $t('step_4_title') }}</h5>
          <p class="text-muted small">{{ $t('step_4_desc') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section
      class="text-center mb-5 py-5 rounded p-4 mahogany-bg"
      style="background-color: var(--mahogany-main) !important; color: #fff !important"
    >
      <h2 class="mb-3" style="color: white">{{ $t('cta_title') }}</h2>
      <p class="fs-5 mb-4">{{ $t('cta_desc') }}</p>
      <RouterLink to="/editor" class="btn btn-light btn-lg">{{ $t('editor_btn') }}</RouterLink>
    </section>
  </div>

  <footer class="text-center mt-4 py-4 border-top bg-light">
    <small>{{ $t('footer_text') }}</small>
  </footer>
</template>
