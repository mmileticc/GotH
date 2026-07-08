<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as alphaTab from '@coderline/alphatab'
import { useEditorStore } from '@/stores/editorStore'
import { buildAlphaTexForExport } from '@/lib/alphaTex'
import { downloadBlob } from '@/lib/exportImage'
import type { TabNoteData } from '@/types/tab'

// Ova komponenta se ne prikazuje korisniku direktno (renderuje se van
// vidljivog ekrana) — njena jedina svrha je da na zahtev (exportPng())
// napravi PRIVREMENI alphaTab render (odvojen od AlphaTabPlayer-a koji
// korisnik gleda/sluša), pročita tačne piksel-pozicije svake note preko
// api.boundsLookup, i sve zajedno "uslika" u jedan PNG fajl za preuzimanje.
//
// NAPOMENA O ISTORIJI OVOG FAJLA (bitno za buduće izmene): prve dve verzije
// su koristile html2canvas biblioteku da "uslika" ceo DOM kontejner.
// - html2canvas u podrazumevanom režimu iscrtava tekst preko SOPSTVENOG
//   canvas 2D fillText mehanizma (ne oslanja se na pravo renderovanje
//   browsera) — Bravura SMuFL notni font (note glave, viole, taktovi) mu je
//   nevidljiv (ne parsira font-face koji alphaTab dinamički ubacuje preko
//   Font Loading API-ja, bez CSS @font-face pravila u document.styleSheets),
//   pa su note ispadale kao prazni kvadratići ("tofu").
// - `foreignObjectRendering: true` opcija (koja prebacuje html2canvas da
//   pusti SAM BROWSER da rasterizuje DOM preko SVG <foreignObject>) je
//   umesto toga davala potpuno CRNU sliku — poznat, često prijavljivan bag
//   html2canvas biblioteke sa foreignObject + eksterni font resursi.
// Rešenje: html2canvas je NAPUŠTEN u potpunosti. Umesto toga, direktno
// serijalizujemo alphaTab-ov stvarni <svg> DOM (alphaTab na webu uvek
// renderuje kao pravi SVG, ne canvas), UGRADIMO Bravura font kao base64
// unutar samog SVG-a (da bude samodovoljan van stranice), i pustimo
// BROWSER (native <img> + <svg xmlns="...">) da ga ispravno rasterizuje —
// isti mehanizam koji već ispravno prikazuje notaciju na ekranu. Harmonika
// overlay (obični monospace brojevi) se crta direktno preko canvas
// fillText/fillRect poziva — bez custom fonta, bez rizika.

const { t } = useI18n()
const store = useEditorStore()

const fontDirectoryUrl = `${import.meta.env.BASE_URL}font/`
const BRAVURA_FONT_URL = `${fontDirectoryUrl}Bravura.woff2`

// alphaTab pre renderovanja proverava dimenzije kontejnera i TIHO PRESKAČE
// ceo render ("[AlphaTab][Rendering] skipped rendering because of width=0
// (element invisible)") ako u trenutku kreiranja API-ja kontejner ima
// width=0. Kontejner MORA imati konkretnu, ne-nultu širinu VEĆ PRE nego
// što se AlphaTabApi konstruiše (ne tek posle, kad se širina inače tačno
// izračuna iz stvarnog sadržaja).
const PLACEHOLDER_WIDTH = 1600
// Vremenski budžet za render — ako alphaTab iz bilo kog razloga nikad ne
// okine postRenderFinished/error, ne smemo da ostanemo zaglavljeni zauvek
// na "Generating...".
const RENDER_TIMEOUT_MS = 20000

const ALPHATAB_ATTRIBUTION_TEXT = 'rendered by alphaTab'
const EXPORT_PADDING = 16
const HARMONICA_LABEL_H = 20
const HARMONICA_ROW_GAP = 10
const HARMONICA_ROW_H = 32
const OUTPUT_SCALE = 2

function removeAttributionText(root: HTMLElement) {
  root.querySelectorAll('text').forEach((el) => {
    if (el.textContent?.trim() === ALPHATAB_ATTRIBUTION_TEXT) el.remove()
  })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// Ubacuje Bravura font kao base64 @font-face DIREKTNO u svaki <svg>, tako
// da bude samodovoljan kad se izdvoji i prikaže kao samostalna slika (SVG
// prikazan preko <img> ne nasleđuje stilove roditeljske stranice — zato
// font mora biti UNUTAR samog SVG-a, ne samo u document.head-u).
async function embedFontIntoSvgs(svgs: SVGSVGElement[]): Promise<void> {
  if (svgs.length === 0) return
  const sampleText = svgs[0].querySelector('text')
  const fontFamily = sampleText ? getComputedStyle(sampleText).fontFamily : 'alphaTab'

  const resp = await fetch(BRAVURA_FONT_URL)
  if (!resp.ok) throw new Error(`Font fetch failed (${resp.status}): ${BRAVURA_FONT_URL}`)
  const buf = await resp.arrayBuffer()
  const base64 = arrayBufferToBase64(buf)
  const css = `@font-face { font-family: ${fontFamily}; src: url(data:font/woff2;base64,${base64}) format('woff2'); }`

  for (const svg of svgs) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = css
    svg.insertBefore(style, svg.firstChild)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Učitavanje SVG slike nije uspelo'))
    img.src = src
  })
}

function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const serialized = new XMLSerializer().serializeToString(svg)
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized)
  return loadImage(dataUrl)
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const isExporting = ref(false)
const exportError = ref<string | null>(null)

const atContainer = ref<HTMLElement | null>(null)
const surfaceWidth = ref(PLACEHOLDER_WIDTH)

interface HarmonicaLabel {
  x: number
  text: string
}

function harmonicaTabFor(note: TabNoteData): string {
  const playable = store.playableNotes.findLast((h) => h.note === note.note)
  return playable ? playable.tab.toString() : '—'
}

// Isti obrazac kao beatIndexMap u AlphaTabPlayer.vue: buildAlphaTexForExport
// generiše tačno jedan beat po noti, istim redosledom kao sortedNotes, pa se
// i-ti beat u ovom nizu direktno mapira na sortedNotes[i].
function collectBeatsInOrder(track: alphaTab.model.Track): alphaTab.model.Beat[] {
  const beats: alphaTab.model.Beat[] = []
  for (const staff of track.staves) {
    for (const bar of staff.bars) {
      for (const voice of bar.voices) {
        for (const beat of voice.beats) {
          beats.push(beat)
        }
      }
    }
  }
  return beats
}

let api: InstanceType<typeof alphaTab.AlphaTabApi> | null = null

function destroyApi() {
  api?.destroy()
  api = null
}

// renderFinished znači "layout gotov", ali BoundsLookup zapisi se
// finalizuju (finish()) tek kroz pun rendering pipeline — postRenderFinished
// je dokumentovano kao trenutak kad je "ceo rendering pipeline gotov", pa je
// to pouzdaniji signal za čitanje api.boundsLookup.
function waitForRender(instance: InstanceType<typeof alphaTab.AlphaTabApi>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Render timeout (alphaTab nije završio renderovanje na vreme)'))
    }, RENDER_TIMEOUT_MS)
    instance.error.on((e) => {
      clearTimeout(timer)
      reject(e instanceof Error ? e : new Error(String(e)))
    })
    instance.postRenderFinished.on(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function exportPng() {
  if (isExporting.value) return
  if (store.notes.length === 0) {
    exportError.value = t('export_image_empty_error')
    return
  }

  isExporting.value = true
  exportError.value = null
  surfaceWidth.value = PLACEHOLDER_WIDTH

  await nextTick()
  if (!atContainer.value) {
    exportError.value = 'export container not mounted'
    isExporting.value = false
    return
  }

  destroyApi()
  atContainer.value.innerHTML = ''

  // Dodatni "sledeći frame" da browser stvarno primeni layout (širinu) na
  // kontejner pre nego što alphaTab pri konstrukciji izmeri dimenzije.
  await new Promise((r) => requestAnimationFrame(r))

  try {
    const sortedNotes = [...store.notes].sort((a, b) => a.position - b.position)

    api = new alphaTab.AlphaTabApi(atContainer.value, {
      core: {
        tex: false,
        fontDirectory: fontDirectoryUrl,
        enableLazyLoading: false,
      },
      display: {
        // Jedan beskonačan horizontalni red, bez prelamanja — pojednostavljuje
        // poravnanje harmonika overlay-a (vidi napomenu na vrhu fajla).
        layoutMode: alphaTab.LayoutMode.Horizontal,
      },
      player: {
        enablePlayer: false,
      },
    })

    const renderPromise = waitForRender(api)
    api.tex(buildAlphaTexForExport(sortedNotes, store.tuning))
    await renderPromise

    const track = api.score?.tracks[0]
    const bounds = api.boundsLookup
    let harmonicaLabels: HarmonicaLabel[] = []
    if (track && bounds) {
      const beats = collectBeatsInOrder(track)
      harmonicaLabels = beats.map((beat, i) => {
        const beatBounds = bounds.findBeat(beat)
        const note = sortedNotes[i]
        return {
          x: beatBounds ? beatBounds.onNotesX : 0,
          text: note ? harmonicaTabFor(note) : '—',
        }
      })
    }

    removeAttributionText(atContainer.value)

    const svgEls = Array.from(atContainer.value.querySelectorAll('svg')) as SVGSVGElement[]
    if (svgEls.length === 0) {
      throw new Error('alphaTab nije generisao SVG notaciju (prazan render)')
    }

    await document.fonts.ready
    await embedFontIntoSvgs(svgEls)

    const containerRect = atContainer.value.getBoundingClientRect()
    const svgPositions = svgEls.map((svg) => {
      const r = svg.getBoundingClientRect()
      return {
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        w: r.width,
        h: r.height,
      }
    })
    const images = await Promise.all(svgEls.map((svg) => svgToImage(svg)))

    const notationWidth = Math.max(...svgPositions.map((p) => p.x + p.w), PLACEHOLDER_WIDTH)
    const notationHeight = Math.max(...svgPositions.map((p) => p.y + p.h), 100)
    const harmonicaBlockHeight = harmonicaLabels.length
      ? HARMONICA_LABEL_H + HARMONICA_ROW_GAP + HARMONICA_ROW_H
      : 0

    const totalWidth = notationWidth + EXPORT_PADDING * 2
    const totalHeight = notationHeight + harmonicaBlockHeight + EXPORT_PADDING * 2
    surfaceWidth.value = totalWidth

    const canvas = document.createElement('canvas')
    canvas.width = totalWidth * OUTPUT_SCALE
    canvas.height = totalHeight * OUTPUT_SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context nije dostupan')
    ctx.scale(OUTPUT_SCALE, OUTPUT_SCALE)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    svgPositions.forEach((p, i) => {
      ctx.drawImage(images[i], EXPORT_PADDING + p.x, EXPORT_PADDING + p.y, p.w, p.h)
    })

    if (harmonicaLabels.length) {
      const labelY = EXPORT_PADDING + notationHeight + HARMONICA_LABEL_H
      ctx.fillStyle = '#333333'
      ctx.font = "600 13px 'Segoe UI', Tahoma, sans-serif"
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(`${t('alphatab_track_harmonica')} (${store.harmonicaKey})`, EXPORT_PADDING, labelY)

      const rowCenterY = labelY + HARMONICA_ROW_GAP + HARMONICA_ROW_H / 2
      ctx.font = "600 13px monospace"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      harmonicaLabels.forEach((label) => {
        const cx = EXPORT_PADDING + label.x
        const textW = ctx.measureText(label.text).width
        const pillW = Math.max(22, textW + 10)
        const pillH = 22
        ctx.fillStyle = '#f0ece0'
        ctx.strokeStyle = '#dddddd'
        drawRoundedRect(ctx, cx - pillW / 2, rowCenterY - pillH / 2, pillW, pillH, 4)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#4b2e2e'
        ctx.fillText(label.text, cx, rowCenterY + 1)
      })
    }

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('canvas.toBlob failed')

    downloadBlob(blob, 'goth-notacija.png')
  } catch (e) {
    exportError.value = e instanceof Error ? e.message : String(e)
  } finally {
    destroyApi()
    isExporting.value = false
  }
}

onBeforeUnmount(() => destroyApi())

defineExpose({ exportPng, isExporting, exportError })
</script>

<template>
  <div class="notation-export-hidden" aria-hidden="true">
    <div ref="atContainer" class="export-at-surface" :style="{ width: `${surfaceWidth}px` }"></div>
  </div>
</template>

<style scoped>
/*
 * position: absolute (ne "fixed") — neke biblioteke (uklj. verovatno
 * alphaTab-ovu proveru vidljivosti) koriste offsetParent kao deo provere
 * da li je element "vidljiv"; position:fixed elementi UVEK imaju
 * offsetParent === null u DOM-u, što može lažno izgledati kao "nevidljiv"
 * element bez obzira na širinu. position:absolute nema tu osobinu.
 */
.notation-export-hidden {
  position: absolute;
  left: -99999px;
  top: 0;
  pointer-events: none;
}

.export-at-surface {
  background: #ffffff;
  min-height: 100px;
}
</style>
