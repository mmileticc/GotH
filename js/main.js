import { DiatonicHarmonica } from './harmonica.js';
import { TabManager } from './tabManager.js';
import { NoteSystem } from './noteSystem.js';
import { Fretboard } from './fretboard.js';

// Pomoćna funkcija za promenu boje
function lightenColor(hex, percent) {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));
  return "#" + r.toString(16).padStart(2, '0')
             + g.toString(16).padStart(2, '0')
             + b.toString(16).padStart(2, '0');
}

class AppController {
  constructor() {
    this.noteSystem = new NoteSystem();
    this.harmonica = new DiatonicHarmonica('C');
    this.fretboard = new Fretboard(
      document.getElementById("fretboard"),
      ['E4','B3','G3','D3','A2','E2'],
      this.noteSystem,
      this.harmonica
    );
    this.tabs = new TabManager(
      document.getElementById("guitarTabs"),
      document.getElementById("harmonicaTabs"),
      this.harmonica,
      this.fretboard.tuning,
      this.fretboard
    );

    this.initListeners();
    this.loadTheme(); // učitaj sačuvanu temu
    this.fretboard.render();
    setTimeout(() => this.tabs.refresh(), 0);
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('goth_fret_theme') || 'mahogany';
    const themeSelect = document.getElementById('fretTheme');
    const colorPicker = document.getElementById('customColor');

    themeSelect.value = savedTheme;

    if (savedTheme === 'custom') {
      const customColor = localStorage.getItem('goth_fret_custom_color') || '#4b2e2e';
      colorPicker.value = customColor;
      colorPicker.style.display = 'inline';
      this.fretboard.setTheme('custom', customColor);
      
      // Postavi CSS varijable
      document.documentElement.style.setProperty('--custom-main', customColor);
      document.documentElement.style.setProperty('--custom-accent', lightenColor(customColor, 0.3));
    } else {
      colorPicker.style.display = 'none';
      this.fretboard.setTheme(savedTheme);
    }

    // Postavi button klase
    const buttons = document.querySelectorAll('.btn-theme');
    buttons.forEach(btn => {
      btn.classList.remove('btn-mahogany', 'btn-maple', 'btn-ebony', 'btn-custom');
      btn.classList.add(`btn-${savedTheme}`);
    });
  }

  saveTheme(theme, customColor = null) {
    localStorage.setItem('goth_fret_theme', theme);
    if (customColor) {
      localStorage.setItem('goth_fret_custom_color', customColor);
    }
  }

  initListeners() {
    // sharp/flat toggle
    document.querySelectorAll('input[name="sharpflat"]').forEach(radio => {
      radio.addEventListener('change', e => {
        this.noteSystem.setNotation(e.target.value);
        this.fretboard.render();
      });
    });

    // broj pragova
    document.getElementById('fretForm').addEventListener('submit', e => {
      e.preventDefault();
      const num = e.target.elements.numOfFrets.value;
      this.fretboard.setNumOfFrets(parseInt(num));
    });

    // promena tonaliteta harmonike
    document.getElementById('harmonicaKey').addEventListener('change', e => {
      this.harmonica.setKey(e.target.value);
      this.fretboard.render();
      this.tabs.refresh();
    });

    // resize
    window.addEventListener('resize', () => this.tabs.refresh());


    // color theme picker
    const themeSelect = document.getElementById('fretTheme');
    const colorPicker = document.getElementById('customColor');
        const buttons = document.querySelectorAll('.btn-theme');

    themeSelect.addEventListener('change', e => {
      const theme = e.target.value;

      buttons.forEach(btn => {
        btn.classList.remove('btn-mahogany', 'btn-maple', 'btn-ebony', 'btn-custom');
        btn.classList.add(`btn-${theme}`);
      });

      if (e.target.value === 'custom') {
        colorPicker.style.display = 'inline';
        this.fretboard.setTheme('custom', colorPicker.value);

        document.documentElement.style.setProperty('--custom-main', colorPicker.value);
        document.documentElement.style.setProperty('--custom-accent', lightenColor(colorPicker.value, 0.3));
        this.saveTheme('custom', colorPicker.value);
      } else {
        colorPicker.style.display = 'none';
        this.fretboard.setTheme(e.target.value);
        this.saveTheme(e.target.value);
      }
    });

    colorPicker.addEventListener('input', e => {
      this.fretboard.setTheme('custom', e.target.value);

      document.documentElement.style.setProperty('--custom-main', e.target.value);
      document.documentElement.style.setProperty('--custom-accent', lightenColor(e.target.value, 0.3));
      this.saveTheme('custom', e.target.value);
    });

    // advanced mode toggle (bends / overblows)
    const advToggle = document.getElementById('advancedModeToggle');
    if (advToggle) {
      // initialize from localStorage if present
      const saved = localStorage.getItem('goth_advanced') === '1';
      advToggle.checked = saved;
      this.harmonica.setAdvancedMode(saved);

      advToggle.addEventListener('change', e => {
        const enabled = !!e.target.checked;
        localStorage.setItem('goth_advanced', enabled ? '1' : '0');
        this.harmonica.setAdvancedMode(enabled);
        // refresh UI
        this.fretboard.render();
        this.tabs.refresh();
      });
    }

    // when harmonica advanced mode changes elsewhere, refresh tabs
    document.addEventListener('harmonicaAdvancedChange', () => this.tabs.refresh());




  
    const btnDelete = document.getElementById('btnDelete');
    const btnClearConfirm = document.getElementById('confirmClear');

    const modeSwitch = document.getElementById('modeSwitch');
    const modeLabel = document.getElementById('modeLabel');

   //const lang1 = localStorage.getItem('goth_lang') || 'sr';

    // postavi inicijalno stanje modeSwitch na osnovu učitanog mode
    modeSwitch.checked = this.tabs.mode === 'insertAfter';
    if (modeSwitch.checked) {
      modeLabel.setAttribute('data-i18n', 'mode_insert');
    } else {
      modeLabel.setAttribute('data-i18n', 'mode_edit');
    }
    //I18N.setChosen(lang1);

    modeSwitch.addEventListener('change', () => {
      if (modeSwitch.checked) {
        this.tabs.mode = 'insertAfter';
        modeLabel.removeAttribute('data-i18n');
        modeLabel.setAttribute('data-i18n', 'mode_insert');
      } else {
        this.tabs.mode = 'editFromFretboard';
        modeLabel.removeAttribute('data-i18n');
        modeLabel.setAttribute('data-i18n', 'mode_edit');
      }
      this.tabs.saveMode(); // sačuvaj mode
      I18N.setChosen(localStorage.getItem('goth_lang') || 'en');

    });

    

    btnDelete.addEventListener('click', () => {
      this.tabs.deleteSelected();
    });

    // potvrda brisanja cele tablature
    btnClearConfirm.addEventListener('click', () => {
      this.tabs.clearAll();
      // zatvori modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('clearModal'));
      modal.hide();
    });
  }
}

// Start aplikacije
// Initialize AppController only if the necessary DOM elements exist (on editor pages)
if (document.getElementById("fretboard") && document.getElementById("guitarTabs")) {
  new AppController();
}

// Dark mode toggle
function initDarkMode() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Učitaj sačuvanu temu
  const savedTheme = localStorage.getItem('goth_site_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  // Toggle event
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('goth_site_theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });
}

// Inicijalizuj dark mode pri učitavanju
document.addEventListener('DOMContentLoaded', initDarkMode);
// Ili ako je skripti defer
if (document.readyState !== 'loading') {
  initDarkMode();
}