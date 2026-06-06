const ETHIOPIA_CENTER = { lat: 9.032, lng: 38.7469 }; // Addis Ababa fallback

export function isSecureContextForGeolocation() {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext === true;
}

/** Google Maps — hospitals search viewport centered on GPS (not "near me" history). */
export function hospitalMapsUrl(lat, lng) {
  const latStr = Number(lat).toFixed(6);
  const lngStr = Number(lng).toFixed(6);
  return `https://www.google.com/maps/search/hospitals/@${latStr},${lngStr},14z`;
}

function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Your browser does not support location services.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Tap the lock icon in your browser address bar and allow location for this site.',
          2: 'Could not detect GPS. Enable location on your device or try outdoors.',
          3: 'Location request timed out. Check that GPS/location is on and try again.',
        };
        reject(new Error(messages[error.code] || 'Could not get your location.'));
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? false,
        timeout: options.timeout ?? 15_000,
        maximumAge: options.maximumAge ?? 0,
      },
    );
  });
}

/** Rough city-level position when GPS is blocked (better than random history). */
async function getLocationFromNetwork() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data?.success && data.latitude != null && data.longitude != null) {
      return {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: 50_000,
        source: 'network estimate',
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve user coordinates: GPS (accurate) → network IP (approximate).
 */
export async function resolveUserLocation() {
  if (!isSecureContextForGeolocation()) {
    throw new Error(
      'Location only works on HTTPS. Open Mama-Care with https:// in the address bar (not http://).',
    );
  }

  // Try GPS — high accuracy first, then faster network-assisted
  const attempts = [
    { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0, source: 'GPS' },
    { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000, source: 'device location' },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const pos = await getCurrentPosition(attempt);
      return { ...pos, source: attempt.source };
    } catch (err) {
      lastError = err;
    }
  }

  const network = await getLocationFromNetwork();
  if (network) return network;

  throw lastError ?? new Error('Could not determine your location.');
}

/** Open Maps in a new tab (no about:blank intermediate page). */
function openInNewTab(url) {
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) return true;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

export async function openNearestHospitalMaps() {
  const { lat, lng, source, accuracy } = await resolveUserLocation();
  const url = hospitalMapsUrl(lat, lng);
  openInNewTab(url);
  return { lat, lng, source, accuracy, url };
}

export { ETHIOPIA_CENTER };
