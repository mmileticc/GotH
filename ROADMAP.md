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
| Notacija/tab/audio/import (istražiti) | **alphaTab** | renderuje standard notation + tab, ima ugrađen soundfont playback (uklj. GM instrument "Harmonica"), uvozi Guitar Pro/MusicXML. Ako se uklopi, pokriva notaciju + ritam + playback + import u jednom potezu — proveriti u Fazi 0 pre nego što se gradi custom rešenje |
| Pitch detection (kasnije) | Pitchy (autocorrelation/MPM) | lagano, dovoljno za monofoni gitarski ton |
| UI komponente | Zadržati Bootstrap CSS klase/grid, ukloniti Bootstrap JS (modal/dropdown) i zameniti Vue komponentama | izbegava sudar dva sistema koji manipulišu DOM-om |

## Faza 0 — Priprema (pre rewrite-a)

- [x] Vue + Vite + TS scaffold (Vue 3, Vue Router, Pinia, Vitest, ESLint flat config) — proveren build/tsc/test/lint, sve prolazi
- [x] Stari statički sajt prebačen u `legacy/` (nedirnut, i dalje kompletan)
- [ ] GitHub Pages deploy pipeline (GitHub Actions → gh-pages)
- [ ] IndexedDB sloj (šema: projects, notes, settings) + migracija postojećih `goth_notes`/`goth_mode`/`goth_*` iz localStorage pri prvom pokretanju
- [ ] Spike: alphaTab u Vue komponenti — da li render/playback/import rade dovoljno dobro da zamene planiranu custom notaciju

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

1. **Import/export overhaul** — trenutni parser je strog i lomi se na tehnikama (h/p/slide/bend); dugme za paste je zakomentarisano jer je nepouzdano. Cilj: tolerantniji parser, prepoznavanje tehnika, export u PDF/PNG/shareable link, po mogućstvu Guitar Pro/MusicXML import preko alphaTab-a ako spike iz Faze 0 uspe.
2. **Tuning UI** — selektor sa presetovima + custom unos po žici (logika je već u Fazi 2, ovo je UI deo).
3. **Audio playback** — reprodukcija konvertovane harmonike (i gitare) — Tone.js sintisajzer ili alphaTab soundfont ako pokrije harmoniku.
4. **Notni zapis + ritam** — prikaz standardne notacije uz tab, na bazi proširenog data modela iz Faze 2.
5. **Mic pitch detection** — automatsko prepoznavanje odsvirane note na gitari bez klika (Pitchy + Web Audio AnalyserNode).
6. **Samostalni tuner** — reuse modula za pitch detection iz tačke 5, kao zaseban alat/stranica.
7. **UI/UX redizajn editora** — kad su undo/redo, tuning i audio na mestu, preći na finalni pass nad interakcijama i mobile touch iskustvom.

## Otvoreno / za proveru usput

- Da li alphaTab realno pokriva i notaciju i playback dovoljno dobro, ili treba kombinacija VexFlow (notacija) + Tone.js (audio) posebno
- Format IndexedDB šeme za više sačuvanih projekata (trenutno postoji samo jedan aktivni tab)
- Da li export/import .json fajla (kao "Save As" projekat) ima smisla dodati uz IndexedDB kao backup/prenosivost između uređaja, s obzirom da nema naloga
