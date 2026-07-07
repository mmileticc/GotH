const I18N = (function(){
  const STORAGE_KEY = 'goth_lang';
  const DEFAULT = 'en';

  function getChosen(){
    return localStorage.getItem(STORAGE_KEY) || DEFAULT;
  }

  function setChosen(code){
    localStorage.setItem(STORAGE_KEY, code);
    apply(code);
  }

  function getLangPath(code){
    // if page is inside /en/ use ../lang, else ./lang
    const inEnFolder = window.location.pathname.split('/').includes('en');
    const prefix = inEnFolder ? '../' : './';
    return prefix + 'lang/' + code + '.json';
  }

  async function apply(code){
    try{
      const res = await fetch(getLangPath(code));
      if(!res.ok) throw new Error('lang not found');
      const data = await res.json();

      // set document title and relevant meta if provided
      if(data._title) document.title = data._title;
      if(data._description){
        const meta = document.querySelector('meta[name="description"]');
        if(meta) meta.setAttribute('content', data._description);
      }

      document.documentElement.lang = code;

      document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key = el.getAttribute('data-i18n');
        if(!key) return;
        const val = data[key];
        if(val===undefined) return;
        if(el.placeholder !== undefined && el.tagName === 'INPUT'){
          el.placeholder = val;
        } else if(el.tagName === 'OPTION' && el.value){
          // for options, set textContent
          el.textContent = val;
        } else {
          el.textContent = val;
        }
      });

      // update lang button label
      const langBtn = document.getElementById('langBtn');
      if(langBtn) langBtn.textContent = code.toUpperCase();

    }catch(err){
      console.warn('i18n load failed', err);
    }
  }

  function init(){
    // wire up language selection clicks
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('.lang-select');
      if(!t) return;
      e.preventDefault();
      const lang = t.getAttribute('data-lang');
      if(lang) setChosen(lang);
    });

    // apply chosen language on load
    const chosen = getChosen();
    apply(chosen);
  }

  return {init, setChosen, getChosen};
})();

document.addEventListener('DOMContentLoaded', ()=> I18N.init());
