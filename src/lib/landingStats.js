const MIN_DISPLAY_COUNT = 10;

/** Show "-" until count reaches 10; then show the real number. */
export function formatLandingStatCount(count) {
  if (count == null || count < MIN_DISPLAY_COUNT) return '-';
  return count.toLocaleString();
}
