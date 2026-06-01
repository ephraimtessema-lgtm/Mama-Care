export function formatAuthError(error) {
  const msg =
    error?.message ||
    error?.msg ||
    error?.error_description ||
    (typeof error === 'string' ? error : '') ||
    'Something went wrong';

  const lower = msg.toLowerCase();

  if (
    msg.includes('provider is not enabled') ||
    msg.includes('Unsupported provider') ||
    error?.error_code === 'validation_failed'
  ) {
    return {
      message: 'Google sign-in is not set up yet. Please use email and password, or try again later.',
      isGoogleDisabled: true,
    };
  }

  if (lower.includes('email not confirmed')) {
    return {
      message: 'Please enter the verification code we sent to your email.',
      needsVerification: true,
    };
  }

  if (
    lower.includes('password should contain') ||
    lower.includes('password must contain') ||
    lower.includes('weak password') ||
    lower.includes('abcdefghijklmnopqrstuvwxyz')
  ) {
    return {
      message: 'Use at least 8 characters with letters and at least one number.',
    };
  }

  if (lower.includes('error sending confirmation email') || lower.includes('error sending email')) {
    return {
      message: "We couldn't send a verification email. You may already have an account.",
      emailSendFailed: true,
      showSignIn: true,
    };
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already exists')
  ) {
    return {
      message: 'This email is already registered.',
      alreadyRegistered: true,
      showSignIn: true,
    };
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      message: 'Too many tries. Please wait a few minutes.',
    };
  }

  return { message: 'Something went wrong. Please try again.', isGoogleDisabled: false };
}
