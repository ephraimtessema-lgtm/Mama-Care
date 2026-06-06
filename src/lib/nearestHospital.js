/** Google Maps search centered on the user's GPS coordinates */
export function hospitalMapsUrl(lat, lng) {
  const query = encodeURIComponent('hospital');
  return `https://www.google.com/maps/search/${query}/@${lat},${lng},15z`;
}

export function getCurrentPosition() {
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
        });
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Allow location access to find hospitals near you.',
          2: 'Could not detect your location. Check GPS or Wi‑Fi and try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || 'Could not get your location.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 0,
      },
    );
  });
}

/**
 * Opens Google Maps with hospitals near the user's real GPS position.
 */
export async function openNearestHospitalMaps() {
  const { lat, lng } = await getCurrentPosition();
  const url = hospitalMapsUrl(lat, lng);
  window.open(url, '_blank', 'noopener,noreferrer');
  return { lat, lng };
}
