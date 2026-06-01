import { supabase } from '@/lib/supabase';
import { formatAuthError } from '@/lib/authErrors';
import { getOrCreateFlowerName } from '@/api/userProfile';

function throwAuthError(error) {
  const { message } = formatAuthError(error);
  const err = new Error(message);
  err.raw = error;
  throw err;
}

export async function mapUser(user) {
  if (!user) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, flower_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Profile load failed:', profileError.message);
  }

  let flower_name = profile?.flower_name || null;
  if (!flower_name && user.id) {
    try {
      flower_name = await getOrCreateFlowerName(user.id);
    } catch (e) {
      console.warn('Flower name setup failed:', e.message);
    }
  }

  return {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '',
    flower_name,
    role: profile?.role || 'user',
    user_metadata: user.user_metadata,
  };
}

export async function getCurrentUser() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('Not authenticated');
  return mapUser(session.user);
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throwAuthError(error);
  return mapUser(data.user);
}

export async function signUpWithPassword(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: fullName ? { full_name: fullName.trim() } : {},
      emailRedirectTo: `${window.location.origin}/verify-email`,
    },
  });
  if (error) throwAuthError(error);

  // Supabase returns an empty identities array when the email is already registered
  if (data.user?.identities?.length === 0) {
    throwAuthError(new Error('User already registered'));
  }

  return { user: data.user ? await mapUser(data.user) : null, session: data.session };
}

export async function signInWithGoogle(redirectPath = '/') {
  const path = redirectPath.startsWith('/') ? redirectPath : '/';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        next: path,
      },
    },
  });
  if (error) throwAuthError(error);
  if (data?.url) {
    window.location.assign(data.url);
  }
}

export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}

/** Resend 6-digit OTP (Magic Link template with {{ .Token }}) */
export async function sendEmailOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email, token, preferredType = 'signup') {
  const code = token.replace(/\s/g, '');
  const normalizedEmail = email.trim().toLowerCase();
  const types = preferredType === 'signup' ? ['signup', 'email'] : [preferredType, 'signup', 'email'];

  let lastError = null;
  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type,
    });
    if (!error && data?.user) {
      return mapUser(data.user);
    }
    lastError = error;
  }
  throwAuthError(lastError);
}

export async function resetPasswordForEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function redirectToLogin(returnUrl) {
  const redirect = returnUrl || window.location.pathname + window.location.search;
  const path = redirect.startsWith('http')
    ? '/login'
    : `/login?redirect=${encodeURIComponent(redirect)}`;
  window.location.href = path;
}

export async function logout(redirectUrl) {
  await signOut();
  window.location.href = redirectUrl || '/';
}

export const auth = {
  me: getCurrentUser,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  resendVerificationEmail,
  sendEmailOtp,
  verifyEmailOtp,
  resetPasswordForEmail,
  signOut,
  logout,
  redirectToLogin,
};
