# GotH — Roadmap (Vue rewrite)

Plan nastao iz razgovora 07.07.2026. Odluke koje su već donete:

- **Framework:** Vue 3 (Composition API) + Vite + TypeScript
- **Pristup:** pun rewrite postojeće funkcionalnosti prvo (parity), pa tek onda nove funkcionalnosti
- **Storage:** IndexedDB, isključivo lokalno (bez naloga/backend-a) → sajt ostaje potpuno statički, hosting ostaje besplatan na GitHub Pages
- **Harmonika:** samo dijatonska (Richter), bez proširenja na hromatsku ili druge tipove
- **Smer konverzije:** samo gitara → harmonika (obrnuto se ne radi)

## Predloženi tech stack

| Potreba | Izbor | Napomena |
|---|---|---|
| Framework | Vue 3 + `<script setup>` | |
| Build | Vite | brz dev server, lak GitHub Pages deploy uz `base: '/GotH/'` |
| Jezik | TypeScript | bitno jer logika mapiranja nota lako puca na tihim bagovima |
| State | Pinia | standard za Vue 3, lako se testira odvojeno od komponenti |
| i18n | vue-i18n | postojeći `lang/en.json` i `lang/sr.json` se skoro 1:1 prebacuju |
| Lokalno čuvanje | IndexedDB preko `idb` biblioteke | zamena za localStorage, veći limit, strukturirano |
| Testovi | Vitest | za čistu logiku: harmonica mapping, tab parser, note system |
| Notacija/tab/audio/import | **alphaTab** | renderuje standard notation + tab, ima ugrađen soundfont playback (uklj. GM instrument "Harmonica"), uvozi Guitar Pro/MusicXML. Integrisano u Fazi 3 (vidi ispod). |
| Slika export notacije | native SVG → `<canvas>` (bez eksternih biblioteka) | alphaTab-ov stvarni SVG DOM se serijalizuje, Bravura font se ugradi kao base64 direktno u SVG, browser ga rasterizuje preko `<img>` + `drawImage` (vidi Faza 3, tačka 1 — `html2canvas` je isprobano i napušteno, vidi napomenu tamo) |
| Pitch detection (kasnije) | Pitchy (autocorrelation/MPM) | lagano, dovoljno za monofoni gitarski ton |
| UI komponente | Zadržati Bootstrap CSS klase/grid, ukloniti Bootstrap JS (modal/dropdown) i zameniti Vue komponentama | izbegava sudar dva sistema koji manipulišu DOM-om |

## Faza 0 — Priprema (pre rewrite-a)

- [x] Vue + Vite + TS scaffold (Vue 3, Vue Router, Pinia, Vitest, ESLint flat config) — proveren build/tsc/test/lint, sve prolazi
- [x] Stari statički sajt prebačen u `legacy/` (nedirnut, i dalje kompletan)
- [ ] GitHub Pages deploy pipeline (GitHub Actions → gh-pages)
- [ ] IndexedDB sloj (šema: projects, notes, settings) + migracija postojećih `goth_notes`/`goth_mode`/`goth_*` iz localStorage pri prvom pokretanju
- [x] Spike: alphaTab u Vue komponenti — radi dobro (notacija + tab + audio + cursor sync), zamenilo planirano custom rešenje

## Faza 1 — Rewrite postojećeg (bez novih fičera)

Cilj: identično ponašanje kao sad, samo na novom stacku.

- [x] `NoteSystem` → `src/lib/noteSystem.ts` (TS klasa, port 1:1)
- [x] `DiatonicHarmonica` → `src/lib/harmonica.ts` (port 1:1, testovi u `src/lib/__tests__`)
- [x] `Fretboard` → `src/components/Fretboard.vue` (klik na notu, teme vrata, custom boja)
- [x] `TabManager` state → `src/stores/editorStore.ts` (Pinia) + `GuitarTabView.vue`/`HarmonicaTabView.vue`
- [x] `TabParser` → `src/lib/tabParser.ts` (isti format uvoza kao pre, testiran)
- [x] Editor/Home/About stranice → Vue Router (`EditorView`, `HomeView`, `AboutView`)
- [x] i18n (en/sr) preko vue-i18n (`src/i18n`)
- [x] Dark mode + fretboard teme → i dalje localStorage (IndexedDB migracija ostaje za Fazu 2)
- [x] Export kao tekst (guitar+harmonica / harmonica-only) — `src/lib/exportText.ts`
- [x] Modali (clear/paste/save/legend) bez Bootstrap JS — `BaseModal.vue` + Teleport
- [ ] Regresioni test: uporediti izlaz starog i novog parsera/mapiranja na realnim primerima (ručna provera na dev serveru)
- [ ] Paste-import dugme je i dalje sakriveno kao u legacy verziji (parser je isti, kvalitet se rešava u Fazi 3)

## Faza 2 — Fundament za nove fičere

- [x] Prošireni data model: `TabNote` dobija `duration` polje (whole/half/quarter/eighth/sixteenth) — `src/types/tab.ts`
- [x] Undo/redo: snapshot stack u `editorStore.ts` (`pushHistory`/`undo`/`redo`), Ctrl+Z/Ctrl+Y prečice + dugmići u editoru, jedan snapshot po edit-sesiji (ne po tasteru)
- [x] Tuning sistem: 6 presetova (standard, drop D, half step down, DADGAD, open G, open D) + custom unos po žici sa validacijom — `src/lib/tunings.ts` + UI u `EditorSettingsPanel.vue`. Promena tuninga rekomputuje visinu tona postojećih nota (fret pozicije ostaju iste).
- [x] Migracija sa localStorage na IndexedDB (`idb` biblioteka, `src/lib/db.ts`) — jednokratna migracija starih `goth_*` localStorage podataka pri prvom pokretanju

## Faza 3 — Nove funkcionalnosti (prioritet po dogovoru)

1. **Import/export overhaul**
   - [x] **PNG export notacije + tabova** — novo dugme "Sačuvaj kao sliku (PNG)" u `SaveExportModal.vue`, pored postojećeg text export-a (koji ostaje kao zasebna opcija — text format ne može da predstavi notni zapis).
     - `src/lib/alphaTex.ts` → `buildAlphaTexForExport()`: jedna gitarska traka sa `{score tabs}` (notacija + tab zajedno), `LayoutMode.Horizontal` (jedan beskonačan red, bez prelamanja — pojednostavljuje poravnanje).
     - `src/components/NotationExporter.vue`: nevidljivi privremeni alphaTab render (`enableLazyLoading: false`), čita `api.boundsLookup.findBeat(beat).onNotesX` (na `postRenderFinished`, ne `renderFinished` — bounds se finalizuju kasnije) da precizno pozicionira harmonika brojeve rupica TAČNO ispod odgovarajuće note (harmonika traka se ne renderuje kroz alphaTab).
     - **Istorija/napomena o pristupu rasterizaciji** (bitno ako se ponovo dira ovaj kod): prve dve verzije su koristile `html2canvas` biblioteku. Podrazumevani režim je notne glave/simbole (Bravura SMuFL font) crtao kao prazne kvadratiće ("tofu") jer html2canvas ne parsira font koji alphaTab ubacuje dinamički preko Font Loading API-ja. `foreignObjectRendering: true` opcija (koja pusti browser da rasterizuje DOM) je davala potpuno CRNU sliku — poznat, često prijavljivan bag html2canvas-a. **html2canvas je u potpunosti napušten** (uklonjen i iz `package.json`) i zamenjen native pristupom: alphaTab-ov stvarni `<svg>` DOM se serijalizuje (`XMLSerializer`), Bravura font se fetch-uje i ugradi kao base64 `@font-face` DIREKTNO unutar svakog SVG-a (SVG prikazan kao samostalna slika ne nasleđuje stilove stranice), pa se učitava preko `<img>` i iscrtava na `<canvas>` preko `drawImage` — isti mehanizam koji browser već koristi da ispravno prikaže notaciju na ekranu. Harmonika overlay (obični monospace brojevi) se crta direktno preko `canvas.fillText`/`fillRect`, bez custom fonta.
     - **Nije vizuelno verifikovano od strane asistenta** (sandbox nema browser) — treba ručna provera kvaliteta/čitljivosti generisane slike, posebno za duže tabove.
   - Ostalo za kasnije: tolerantniji tekstualni parser (h/p/slide/bend), Guitar Pro/MusicXML import preko alphaTab-a.
2. [x] **Tuning UI** — selektor sa presetovima + custom unos po žici (Faza 2/3, redizajnirano u tačku 7 ispod).
3. [x] **Audio playback + notni zapis** — alphaTab integracija:
   - `@coderline/alphatab` + `@coderline/alphatab-vite` u `package.json`/`vite.config.ts`.
   - `src/lib/alphaTex.ts` — generiše alphaTex iz `store.notes`/`tuning`/`harmonicaKey`: traka "Gitara" (notacija, GM instrument `AcousticGuitarSteel` za realističan zvuk) + traka "Harmonika" (notacija, GM instrument `Harmonica`), deljeni ritam iz `note.duration`, auto bar-splitting sa eksplicitnim `\ts` po taktu (sprečava tihe/neočekivane pauze kod nepunih taktova). Testirano u `src/lib/__tests__/alphaTex.spec.ts` (12 testova).
   - `src/components/AlphaTabPlayer.vue` — render notacije + play/pause/stop + toggle gitara/harmonika traka za reprodukciju (mute na neaktivnoj), sinhronizovana selekcija note tokom reprodukcije (`playedBeatChanged` → `store.selectByPosition`), MutationObserver koji uklanja "rendered by alphaTab" natpis (lazy DOM insertion sprečava jednostavan one-shot pristup), forsirana svetla pozadina notnog zapisa u dark mode-u, vidljiv cursor/highlight preko `:deep()` CSS-a (alphaTab elementi nemaju boju iz JS-a).
   - Gitarska traka renderuje SAMO notaciju (`{score}`, bez tab-a) da ne duplira `GuitarTabView` iznad.
   - `core.fontDirectory` eksplicitno podešen (auto-detekcija fonta ne radi pod Vite dev serverom → notacija se uopšte nije renderovala bez ovoga).
   - `vite.config.ts`: `base` je uslovan (`'/'` u dev-u, `'/GotH/'` u build-u) zbog poznatog Vite dev-server + ESM Web Worker + non-root-base problema koji je pucao alphaTab worker bundling.
   - `public/manifest.json` prebačen na relativne putanje (radi i sa uslovnim base-om).
4. ~~Notni zapis + ritam~~ — pokriveno tačkom 3 iznad.
5. **Mic pitch detection** — automatsko prepoznavanje odsvirane note na gitari bez klika (Pitchy + Web Audio AnalyserNode). Sledeći veći fičer.
6. **Samostalni tuner** — reuse modula za pitch detection iz tačke 5, kao zaseban alat/stranica.
7. [x] **UI/UX redizajn editora (prvi pass)**
   - `#tabControls` toolbar u `EditorView.vue` reorganizovan u jasno odvojene grupe (Edit / History / Duration) sa mikro-labelama, mode-toggle prebačen sa čudnog checkbox-u-dugmetu na pravi radio-button-group (isti obrazac kao sharp/flat).
   - `EditorSettingsPanel.vue` redizajniran u 4 jasno odvojene kartice (Fretboard Design / Notation / Tuning / Harmonica) preko CSS grid-a sa `auto-fit` — automatski kolabira u jednu kolonu na uskim ekranima, bez potrebe za ručnim media query po sekciji.
   - Legend dugme ("?") pretvoreno u kružno dugme sa `aria-label`/`title`, harmonika header red poravnat preko flex-a.
   - **Nije vizuelno verifikovano od strane asistenta** (sandbox nema browser) — treba ručna provera na desktopu i mobilnom.
   - Fretboard koji vizuelno više liči na pravi vrat gitare (drvena tekstura i sl.) — eksplicitno deprioritizovano od strane korisnika, nije rađeno u ovom passu.

## Otvoreno / za proveru usput

- **Korisnik treba ručno da proveri u browseru**: notacija/audio playback (kao ranije), NOVO — kvalitet/čitljivost PNG export-a (posebno duži tabovi sa više taktova) posle prelaska na native SVG rasterizaciju, i izgled redizajniranog toolbar-a/settings panela na desktopu i mobilnom. `html2canvas` je uklonjen iz zavisnosti, pa `npm install` više ne mora njega da povuče (ali treba ga pokrenuti ako lockfile nije ažuriran).
- Bar-splitting u `alphaTex.ts` je pojednostavljen (greedy fill na 16 šesnaestinki po taktu, ne deli note preko granice takta) — dovoljno za prikaz/audio/export, ali nije muzikološki savršeno; ako zasmeta vizuelno, može se doraditi.
- PNG export trenutno pretpostavlja da ceo tab staje u jedan horizontalni red (`LayoutMode.Horizontal`, bez prelamanja) — kod jako dugih tabova slika može biti vrlo široka; ako to bude problem, razmisliti o multi-row exportu (znatno komplikovanije poravnanje harmonika overlay-a po sistemu/redu).
- Format IndexedDB šeme za više sačuvanih projekata (trenutno postoji samo jedan aktivni tab)
- Da li export/import .json fajla (kao "Save As" projekat) ima smisla dodati uz IndexedDB kao backup/prenosivost između uređaja, s obzirom da nema naloga
