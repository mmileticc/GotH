<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as alphaTab from '@coderline/alphatab'
import { useEditorStore } from '@/stores/editorStore'
import { buildAlphaTex } from '@/lib/alphaTex'

// @coderline/alphatab-vite plugin kopira font/soundfont fajlove u build
// output i servira ih na `<root>/soundfont/` i `<root>/font/`. Koristimo
// import.meta.env.BASE_URL (a ne hardkodovanu putanju) da radi i u dev
// modu i posle build-a sa `base: '/GotH/'` na GitHub Pages.
const soundFontUrl = `${import.meta.env.BASE_URL}soundfont/sonivox.sf3`

const store = useEditorStore()

const container = ref<HTMLElement | null>(null)
const api = shallowRef<InstanceType<typeof alphaTab.AlphaTabApi> | null>(null)
const isPlaying = ref(false)
const isReady = ref(false)
const loadError = ref<string | null>(null)

// alphaTex.ts uvek generiše tačno 2 trake u ovom redosledu: [0]=Gitara, [1]=Harmonika.
const tracks = shallowRef<alphaTab.model.Track[]>([])
const playbackTrack = ref<'guitar' | 'harmonica'>('harmonica')

function currentTex(): string {
  return buildAlphaTex(store.notes, store.tuning, store.harmonicaKey)
}

// Reprodukuje se uvek samo jedna traka odjednom (mute na drugoj) da zvuk ne
// bude pomešan gitara+harmonika istovremeno — korisnik bira šta sluša.
function applyTrackSelection() {
  if (!api.value || tracks.value.length < 2) return
  const [guitarTrack, harmonicaTrack] = tracks.value
  const wantGuitar = playbackTrack.value === 'guitar'
  api.value.changeTrackMute([guitarTrack], !wantGuitar)
  api.value.changeTrackMute([harmonicaTrack], wantGuitar)
}

function reload() {
  if (!api.value) return
  loadError.value = null
  try {
    api.value.tex(currentTex())
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
  }
}

onMounted(() => {
  if (!container.value) return

  const instance = new alphaTab.AlphaTabApi(container.value, {
    core: {
      tex: false,
    },
    player: {
      enablePlayer: true,
      enableCursor: true,
      soundFont: soundFontUrl,
      scrollElement: container.value,
    },
  })

  instance.error.on((e) => {
    loadError.value = e instanceof Error ? e.message : String(e)
  })
  instance.playerReady.on(() => {
    isReady.value = true
  })
  instance.playerStateChanged.on((args) => {
    isPlaying.value = args.state === alphaTab.synth.PlayerState.Playing
  })
  instance.scoreLoaded.on((score) => {
    tracks.value = score.tracks
    applyTrackSelection()
  })

  api.value = instance
  reload()
})

onBeforeUnmount(() => {
  api.value?.destroy()
  api.value = null
})

// Regeneriši alphaTex kad god se promene note, štim ili tonalitet harmonike.
watch(
  () => [store.notes, store.tuning, store.harmonicaKey],
  () => reload(),
  { deep: true },
)

watch(playbackTrack, () => applyTrackSelection())

function onPlayPause() {
  api.value?.playPause()
}

function onStop() {
  api.value?.stop()
}
</script>

<template>
  <div class="alphatab-player">
    <div class="alphatab-controls d-flex align-items-center gap-2 mb-2 flex-wrap">
      <button
        type="button"
        class="btn btn-sm"
        :class="isPlaying ? 'btn-secondary' : 'btn-outline-secondary'"
        :disabled="!isReady"
        @click="onPlayPause"
      >
        {{ isPlaying ? '⏸ Pauza' : '▶ Sviraj' }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!isReady" @click="onStop">
        ⏹ Stop
      </button>

      <div class="btn-group btn-group-sm ms-1" role="group" aria-label="Izbor trake za reprodukciju">
        <button
          type="button"
          class="btn"
          :class="playbackTrack === 'guitar' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="playbackTrack = 'guitar'"
        >
          🎸 Gitara
        </button>
        <button
          type="button"
          class="btn"
          :class="playbackTrack === 'harmonica' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="playbackTrack = 'harmonica'"
        >
          🎵 Harmonika
        </button>
      </div>

      <span v-if="!isReady" class="text-muted small">Učitavanje sound fonta…</span>
      <span v-if="loadError" class="text-danger small">Greška: {{ loadError }}</span>
    </div>
    <div ref="container" class="alphatab-surface"></div>
  </div>
</template>

<style scoped>
.alphatab-surface {
  overflow-x: auto;
  min-height: 120px;
}
</style>
