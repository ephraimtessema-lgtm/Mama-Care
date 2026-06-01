/** Matches Supabase-style rules: 8+ chars, letters and at least one digit */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Include at least one letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Include at least one number.';
  }
  return null;
}

export const PASSWORD_HINT =
  'At least 8 characters, with letters and at least one number.';
