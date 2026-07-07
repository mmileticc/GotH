import { TabNote } from './tabNote.js';

const TAB_LINE_RE = /^\s*[A-Ga-g][#b]?\s*[-|]/;

function stripLabelAndBars(line) {
  return line.replace(/^\s*[A-Ga-g][#b]?\s*/, '').replace(/\|/g, '');
}

// Parsira jedan "trag" (fret track) skidajući label/barove, akumulirajući
// uzastopne cifre u brojeve pragova i beležeći kolonu na kojoj počinju.
function parseFretTrack(rawLine) {
  const track = stripLabelAndBars(rawLine);
  const hits = [];
  let current = '';
  let startCol = -1;

  for (let col = 0; col < track.length; col++) {
    const ch = track[col];
    if (ch >= '0' && ch <= '9') {
      if (current === '') startCol = col;
      current += ch;
    } else if (current !== '') {
      hits.push({ fret: parseInt(current, 10), column: startCol });
      current = '';
    }
  }
  if (current !== '') {
    hits.push({ fret: parseInt(current, 10), column: startCol });
  }

  return hits;
}

/**
 * Parsira nalepljeni gitarski tab (standardna 6-linijska ASCII notacija,
 * visoko->nisko) u niz TabNote objekata koristeći isti model kao klik
 * po fretboard-u.
 */
export function parseGuitarTab(text, tuning, noteSystem) {
  const lines = text.split('\n').filter(line => TAB_LINE_RE.test(line));

  if (lines.length < tuning.length) {
    throw new Error('Nije pronađen validan tab sa 6 linija (e/B/G/D/A/E).');
  }

  // Grupiši linije u blokove od po `tuning.length` redova (podržava tab
  // koji je nalepljen u više naslaganih segmenata).
  const blockCount = Math.floor(lines.length / tuning.length);
  const rows = new Array(tuning.length).fill('');

  for (let block = 0; block < blockCount; block++) {
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      rows[stringIndex] += lines[block * tuning.length + stringIndex];
    }
  }

  const allHits = [];
  rows.forEach((rowText, stringIndex) => {
    parseFretTrack(rowText).forEach(hit => {
      allHits.push({ stringIndex, fret: hit.fret, column: hit.column });
    });
  });

  if (allHits.length === 0) {
    throw new Error('Nije pronađena nijedna nota u nalepljenom tabu.');
  }

  allHits.sort((a, b) => a.column - b.column || a.stringIndex - b.stringIndex);

  return allHits.map((hit, i) => {
    const openNote = tuning[hit.stringIndex];
    const noteName = noteSystem.getFullNote(openNote, hit.fret);
    return new TabNote(hit.stringIndex, hit.fret, i, noteName);
  });
}
