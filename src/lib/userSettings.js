export const FLOWER_NAMES = [
  'Blue Lily',
  'Desert Rose',
  'Golden Dahlia',
  'Silver Orchid',
  'Pink Jasmine',
  'Violet Tulip',
  'White Magnolia',
  'Crimson Poppy',
  'Amber Sunflower',
  'Jade Hibiscus',
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromo' },
  { code: 'ti', label: 'Tigrinya' },
];

export const DEFAULT_PREFERENCES = {
  language: 'en',
  notifications: {
    dailyTips: true,
    appointmentReminders: true,
    communityReplies: true,
    weeklyBabyGrowth: true,
  },
  privacy: {
    whoCanMessage: 'flower_only',
    showProfileInCommunity: true,
    blockedUsers: [],
  },
  community: {
    allowDirectMessages: true,
    showFlowerNamePublicly: true,
    participationEnabled: true,
  },
};

const STORAGE_KEY = 'mamacare_user_preferences';

export function mergePreferences(stored) {
  const base = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  if (!stored || typeof stored !== 'object') return base;
  return {
    language: stored.language ?? base.language,
    notifications: { ...base.notifications, ...stored.notifications },
    privacy: { ...base.privacy, ...stored.privacy },
    community: { ...base.community, ...stored.community },
  };
}

export function loadLocalPreferences(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? mergePreferences(JSON.parse(raw)) : mergePreferences(null);
  } catch {
    return mergePreferences(null);
  }
}

export function saveLocalPreferences(userId, preferences) {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(preferences));
}

export function applyLanguage(code) {
  const lang = LANGUAGES.some((l) => l.code === code) ? code : 'en';
  document.documentElement.lang = lang === 'en' ? 'en' : lang;
  localStorage.setItem('mamacare_language', lang);
}

export function getSavedLanguage() {
  const lang = localStorage.getItem('mamacare_language');
  return LANGUAGES.some((l) => l.code === lang) ? lang : 'en';
}

export function formatDisplayDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
