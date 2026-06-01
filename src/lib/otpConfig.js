/** Must match Supabase: Authentication → Providers → Email → OTP length */
export const OTP_LENGTH = 6;

export function normalizeOtp(value) {
  return String(value).replace(/\s/g, '');
}

export function isCompleteOtp(value) {
  return normalizeOtp(value).length === OTP_LENGTH;
}
