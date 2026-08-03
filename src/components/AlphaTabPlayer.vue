<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as alphaTab from '@coderline/alphatab'
import { useEditorStore } from '@/stores/editorStore'
import { buildAlphaTex } from '@/lib/alphaTex'
import AppIcon from '@/components/icons/AppIcon.vue'
import posthog from 'posthog-js'

const posthogConfigured = Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_POSTHOG_HOST)

const { t } = useI18n()

// @coderline/alphatab-vite plugin kopira font/soundfont fajlove u build
// output i servira ih na `<root>/soundfont/` i `<root>/font/`. Koristimo
// import.meta.env.BASE_URL (a ne hardkodovanu putanju) da radi i u dev
// modu i posle build-a sa `base: '/GotH/'` na GitHub Pages.
//
// Napomena: alphaTab podrazumevano pokušava da SAM pronađe font folder na
// osnovu URL-a sopstvenog script fajla ("AlphaTabScriptFolder/font/"), ali
// pod Vite dev serverom taj auto-detektovani URL ne odgovara stvarnoj
// putanji na kojoj plugin servira font (isti problem kao i sa soundFont-om),
// pa NetworkError sprečava učitavanje Bravura fonta i notacija se uopšte ne
// iscrtava. Zato i core.fontDirectory eksplicitno postavljamo, ne samo
// player.soundFont.
const soundFontUrl = `${import.meta.env.BASE_URL}soundfont/sonivox.sf3`
const fontDirectoryUrl = `${import.meta.env.BASE_URL}font/`

// alphaTab (web/svg render engine) na kraju svakog rendera uvek iscrtava
// fiksni tekst "rendered by alphaTab" (hardkodovano u njihovom rendereru,
// bez settings opcije da se isključi). MPL-2.0 licenca ne zahteva da ovaj
// tekst ostane vidljiv korisniku, pa ga uklanjamo iz DOM-a.
//
// renderFinished event NIJE dovoljan za ovo: alphaTab interno registruje
// SVG "partial"-e (registerPartial) koji se u DOM upisuju odloženo/lenjo
// (core.enableLazyLoading je podrazumevano uključeno), pa se <text> element
// sa ovim natpisom pojavi u DOM-u POSLE renderFinished-a i naš jednokratni
// query ga ne bi našao. Zato koristimo MutationObserver koji kontinuirano
// prati DOM izmene unutar kontejnera i uklanja natpis čim se pojavi, bez
// obzira na tačan trenutak kad ga alphaTab ubaci.
const ALPHATAB_ATTRIBUTION_TEXT = 'rendered by alphaTab'
const GUITAR_TEXT = 'Gitara'



function removeAttributionText(root: HTMLElement) {
  root.querySelectorAll('text').forEach((el) => {
    if (el.textContent?.trim() === ALPHATAB_ATTRIBUTION_TEXT || el.textContent?.trim() === GUITAR_TEXT) {
      el.remove()
    }
  })
}

let attributionObserver: MutationObserver | null = null

function startAttributionObserver(root: HTMLElement) {
  removeAttributionText(root)
  attributionObserver = new MutationObserver(() => removeAttributionText(root))
  attributionObserver.observe(root, { childList: true, subtree: true })
}

const store = useEditorStore()

const container = ref<HTMLElement | null>(null)
const api = shallowRef<InstanceType<typeof alphaTab.AlphaTabApi> | null>(null)
const isPlaying = ref(false)
const isReady = ref(false)
const loadError = ref<string | null>(null)

// alphaTex.ts uvek generiše tačno 2 trake u ovom redosledu: [0]=Gitara, [1]=Harmonika.
const tracks = shallowRef<alphaTab.model.Track[]>([])
const playbackTrack = ref<'guitar' | 'harmonica'>('harmonica')

// Mapira alphaTab Beat objekte (iz OBE trake) nazad na poziciju note u
// store.notes, za sinhronizovano markiranje trenutno svirane/selektovane note
// u Fretboard/GuitarTabView/HarmonicaTabView (i obrnuto, vidi positionToBeat
// ispod). alphaTex.ts generiše tačno jedan beat po noti po traci, istim
// redosledom kao store.notes, pa je redni broj beat-a (kroz sve taktove
// trake, po redu) == note.position.
let beatIndexMap = new Map<alphaTab.model.Beat, number>()
// Obrnuta mapa: pozicija note -> jedan reprezentativni Beat za tu poziciju.
// Koristi se da pri selekciji note (klik u gitarskim/harmonika tabovima)
// pomerimo alphaTab-ov reprodukcioni kursor na tu notu u notnom zapisu — vidi
// updateCursorForSelection.
let positionToBeat = new Map<number, alphaTab.model.Beat>()

function buildBeatIndexMap(scoreTracks: alphaTab.model.Track[]): {
  toPosition: Map<alphaTab.model.Beat, number>
  toBeat: Map<number, alphaTab.model.Beat>
} {
  const toPosition = new Map<alphaTab.model.Beat, number>()
  const toBeat = new Map<number, alphaTab.model.Beat>()
  for (const track of scoreTracks) {
    let idx = 0
    for (const staff of track.staves) {
      for (const bar of staff.bars) {
        for (const voice of bar.voices) {
          for (const beat of voice.beats) {
            toPosition.set(beat, idx)
            if (!toBeat.has(idx)) toBeat.set(idx, beat)
            idx++
          }
        }
      }
    }
  }
  return { toPosition, toBeat }
}

// Pomera alphaTab-ov reprodukcioni kursor (isti onaj koji se pomera tokom
// puštanja muzike, .at-cursor-beat/.at-cursor-bar) na notu koja odgovara
// trenutno selektovanoj poziciji — NE pokreće reprodukciju, samo postavlja
// kursor da "sedi" na toj noti u notnom zapisu, kao vizuelna potvrda selekcije.
function updateCursorForSelection() {
  if (!api.value) return
  const pos = store.selectedIndex
  const beat = pos !== null ? positionToBeat.get(pos) : undefined
  if (beat) {
    api.value.tickPosition = beat.absolutePlaybackStart
  }
}

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

  startAttributionObserver(container.value)

  const instance = new alphaTab.AlphaTabApi(container.value, {
    core: {
      tex: false,
      fontDirectory: fontDirectoryUrl,
    },
    player: {
      enablePlayer: true,
      enableCursor: true,
      enableAnimatedBeatCursor: true,
      soundFont: soundFontUrl,
      scrollElement: container.value,
    },
  })

  instance.error.on((e) => {
    loadError.value = e instanceof Error ? e.message : String(e)
  })
  instance.playerReady.on(() => {
    isReady.value = true
    // playerReady se okida (i ponovo, na svaki reload) tek kad je pesma
    // učitana u player KAO MIDI — deo tog učitavanja interno resetuje
    // reprodukcionu poziciju na početak. Zato se kursor za trenutno
    // selektovanu notu mora postaviti OVDE, a ne u scoreLoaded (koji se
    // okida ranije, pre tog internog reseta, pa bi nam postavljanje tamo
    // odmah bilo pregaženo — otud bug da kursor "skoči" na prvu notu).
    updateCursorForSelection()
  })
  instance.playerStateChanged.on((args) => {
    isPlaying.value = args.state === alphaTab.synth.PlayerState.Playing
  })
  instance.scoreLoaded.on((score) => {
    tracks.value = score.tracks
    const maps = buildBeatIndexMap(score.tracks)
    beatIndexMap = maps.toPosition
    positionToBeat = maps.toBeat
    applyTrackSelection()
  })
  // Prati alphaTab-ov ugrađeni kursor tokom reprodukcije i markira odgovarajuću
  // notu u našim sopstvenim komponentama (isti mehanizam kao ručni klik na notu).
  instance.playedBeatChanged.on((beat) => {
    const position = beatIndexMap.get(beat)
    if (position !== undefined) store.selectByPosition(position)
  })
  // Klik na notu u notnom zapisu selektuje odgovarajuću notu u editoru (isto
  // kao klik u gitarskim/harmonika tabovima) — omogućava izmenu/brisanje note
  // direktno preko fretboard-a nakon klika na notaciju.
  instance.beatMouseDown.on((beat) => {
    const position = beatIndexMap.get(beat)
    if (position !== undefined) store.selectByPosition(position)
  })

  api.value = instance
  reload()
})

onBeforeUnmount(() => {
  attributionObserver?.disconnect()
  attributionObserver = null
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

// Klik na notu u gitarskim/harmonika tabovima (ili bilo gde drugde preko
// store.selectByPosition) menja store.selectedIndex — ovde se to prevodi u
// pomeranje reprodukcionog kursora na odgovarajuću notu u notnom zapisu.
watch(() => store.selectedIndex, () => updateCursorForSelection())

function onPlayPause() {
  if (!isPlaying.value && posthogConfigured) {
    posthog.capture('notation_playback_started', { playback_track: playbackTrack.value, note_count: store.notes.length })
  }
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
        <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="15" />
        {{ isPlaying ? $t('alphatab_pause') : $t('alphatab_play') }}
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!isReady" @click="onStop">
        <AppIcon name="stop" :size="15" /> {{ $t('alphatab_stop') }}
      </button>

      <div class="btn-group btn-group-sm ms-1" role="group" :aria-label="t('alphatab_track_aria')">
        <button
          type="button"
          class="btn"
          :class="playbackTrack === 'guitar' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="playbackTrack = 'guitar'"
        >
          <AppIcon name="guitar" :size="15" /> {{ $t('alphatab_track_guitar') }}
        </button>
        <button
          type="button"
          class="btn"
          :class="playbackTrack === 'harmonica' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="playbackTrack = 'harmonica'"
        >
          <AppIcon name="harmonica" :size="15" /> {{ $t('alphatab_track_harmonica') }}
        </button>
      </div>

      <span v-if="!isReady" class="text-muted small">{{ $t('alphatab_loading') }}</span>
      <span v-if="loadError" class="text-danger small">{{ $t('alphatab_error_prefix') }}{{ loadError }}</span>
    </div>
    <div ref="container" class="alphatab-surface"></div>
  </div>
</template>

<style scoped>
.alphatab-surface {
  overflow-x: auto;
  min-height: 120px;
  /* Notacija se crta kao tamna nota-glava/linije na pretpostavljeno svetloj
     pozadini — u dark mode-u bi bez ovoga bila skoro nevidljiva na tamnoj
     pozadini stranice, pa notni zapis uvek drži svetlu "papirnu" podlogu. */
  background: #ffffff;
  border-radius: 6px;
  padding: 0.5rem;
}

/*
 * alphaTab ubacuje kursor/highlight elemente direktno u DOM (mimo Vue
 * template-a), pa im obična scoped pravila ne "vide" klase — otud :deep().
 * Sami elementi nemaju nijednu boju/pozadinu podešenu iz JS-a, oslanjaju se
 * potpuno na spoljašnji CSS (bez ovoga kursor postoji ali je nevidljiv).
 */
.alphatab-surface :deep(.at-cursor-bar) {
  background: rgba(255, 200, 0, 0.25);
}

.alphatab-surface :deep(.at-cursor-beat) {
  background: #d9534f;
}

.alphatab-surface :deep(.at-selection div) {
  background: rgba(64, 64, 255, 0.22);
  border-radius: 3px;
}

.alphatab-surface :deep(.at-highlight) * {
  fill: #d9534f !important;
  stroke: #d9534f !important;
}
</style>
