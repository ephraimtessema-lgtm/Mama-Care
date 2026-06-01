const GOOGLE_SCRIPT_ID = 'mamacare-google-translate-script';
const GOOGLE_ELEMENT_ID = 'google_translate_element';
const GOOGLE_INIT_KEY = '__mamacareGoogleTranslateInit';

const GOOGLE_LANG_MAP = {
  en: 'en',
  am: 'am',
  om: 'om',
  ti: 'ti',
};

function ensureTranslateContainer() {
  if (document.getElementById(GOOGLE_ELEMENT_ID)) return;
  const div = document.createElement('div');
  div.id = GOOGLE_ELEMENT_ID;
  div.style.position = 'fixed';
  div.style.pointerEvents = 'none';
  div.style.opacity = '0';
  div.style.bottom = '0';
  div.style.left = '0';
  div.style.width = '1px';
  div.style.height = '1px';
  document.body.appendChild(div);
}

function loadGoogleTranslateScript() {
  if (document.getElementById(GOOGLE_SCRIPT_ID)) return;

  window[GOOGLE_INIT_KEY] = () => {
    if (!window.google?.translate?.TranslateElement) return;
    ensureTranslateContainer();
    // Auto-display disabled; we only drive the hidden selector programmatically.
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        autoDisplay: false,
      },
      GOOGLE_ELEMENT_ID,
    );
  };

  const script = document.createElement('script');
  script.id = GOOGLE_SCRIPT_ID;
  script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_INIT_KEY}`;
  script.async = true;
  document.head.appendChild(script);
}

function setGoogleLanguage(targetLang) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  combo.value = targetLang;
  combo.dispatchEvent(new Event('change'));
  return true;
}

export function applyAppLanguage(code) {
  const lang = GOOGLE_LANG_MAP[code] ? code : 'en';
  document.documentElement.lang = lang;
  localStorage.setItem('mamacare_language', lang);

  // English is the source language; reset by reloading once if needed.
  if (lang === 'en') {
    if (window.location.hash !== '#lang-reset') {
      window.location.hash = 'lang-reset';
      window.location.reload();
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }

  ensureTranslateContainer();
  loadGoogleTranslateScript();

  const targetLang = GOOGLE_LANG_MAP[lang];
  let retries = 0;
  const timer = window.setInterval(() => {
    const ok = setGoogleLanguage(targetLang);
    retries += 1;
    if (ok || retries > 25) {
      window.clearInterval(timer);
    }
  }, 300);
}
