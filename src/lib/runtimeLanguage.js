const GOOGLE_SCRIPT_ID = 'mamacare-google-translate-script';
const GOOGLE_ELEMENT_ID = 'google_translate_element';
const GOOGLE_INIT_KEY = '__mamacareGoogleTranslateInit';
const ACTIVE_KEY = 'mamacare_translate_active';

const GOOGLE_LANG_MAP = {
  en: 'en',
  am: 'am',
  om: 'om',
  ti: 'ti',
};

function pageIsTranslated() {
  return (
    document.body.classList.contains('translated-ltr') ||
    document.documentElement.classList.contains('translated-ltr') ||
    sessionStorage.getItem(ACTIVE_KEY) === '1'
  );
}

function ensureTranslateContainer() {
  if (document.getElementById(GOOGLE_ELEMENT_ID)) return;
  const div = document.createElement('div');
  div.id = GOOGLE_ELEMENT_ID;
  div.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;left:0;bottom:0;';
  document.body.appendChild(div);
}

function loadGoogleTranslateScript() {
  if (document.getElementById(GOOGLE_SCRIPT_ID)) return Promise.resolve();

  return new Promise((resolve) => {
    window[GOOGLE_INIT_KEY] = () => {
      if (!window.google?.translate?.TranslateElement) {
        resolve();
        return;
      }
      ensureTranslateContainer();
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        GOOGLE_ELEMENT_ID,
      );
      resolve();
    };

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_INIT_KEY}`;
    script.async = true;
    script.onload = () => setTimeout(resolve, 500);
    document.head.appendChild(script);
  });
}

function setGoogleLanguage(targetLang) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  combo.value = targetLang;
  combo.dispatchEvent(new Event('change'));
  sessionStorage.setItem(ACTIVE_KEY, targetLang === 'en' ? '0' : '1');
  return true;
}

/**
 * Apply language without reloading unless switching back to English from translation.
 * @param {string} code
 * @param {{ userInitiated?: boolean }} options
 */
export async function applyAppLanguage(code, options = {}) {
  const lang = GOOGLE_LANG_MAP[code] ? code : 'en';
  const prev = localStorage.getItem('mamacare_language') || 'en';
  document.documentElement.lang = lang;
  localStorage.setItem('mamacare_language', lang);

  if (lang === 'en') {
    sessionStorage.setItem(ACTIVE_KEY, '0');
    if (pageIsTranslated() && prev !== 'en' && options.userInitiated) {
      window.location.reload();
    }
    return;
  }

  if (prev === lang && pageIsTranslated() && !options.userInitiated) {
    return;
  }

  await loadGoogleTranslateScript();

  const targetLang = GOOGLE_LANG_MAP[lang];
  let retries = 0;
  await new Promise((resolve) => {
    const timer = window.setInterval(() => {
      const ok = setGoogleLanguage(targetLang);
      retries += 1;
      if (ok || retries > 25) {
        window.clearInterval(timer);
        resolve();
      }
    }, 200);
  });
}

/** Set lang attribute only — safe on Settings load (no translate flash) */
export function setDocumentLanguage(code) {
  const lang = GOOGLE_LANG_MAP[code] ? code : 'en';
  document.documentElement.lang = lang;
}
