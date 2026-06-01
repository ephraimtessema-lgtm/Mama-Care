import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithPassword, signInWithGoogle, resetPasswordForEmail } from '@/api/auth';
import { formatAuthError } from '@/lib/authErrors';
import { useAuth } from '@/lib/AuthContext';
import { AuthBrand, AuthShell, AuthDivider } from '@/components/auth/AuthShell';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/';
  const { isAuthenticated, checkUserAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect.startsWith('http') ? '/' : redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, redirect]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const user = await signInWithPassword(email, password);
      await checkUserAuth();
      if (!user.email_confirmed_at) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
        });
        return;
      }
      navigate(redirect.startsWith('http') ? '/' : redirect, { replace: true });
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
        });
        return;
      }
      setError(formatAuthError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setMessage('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle(redirect);
    } catch (err) {
      setError(formatAuthError(err).message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first, then click Forgot password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      setMessage('Password reset link sent to your email.');
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthBrand title="Welcome to Mama-Care" subtitle="Sign in to continue" />

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
      >
        <GoogleIcon />
        <span className="ml-2">{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
      </Button>

      <AuthDivider />

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-800">
            Email
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-slate-800">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center justify-between mt-5 text-sm">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-slate-600 hover:text-rose-600 font-medium"
        >
          Forgot password?
        </button>
        <p className="text-slate-500">
          Need an account?{' '}
          <Link to={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-slate-900 hover:text-rose-600">
            Sign up
          </Link>
        </p>
      </div>

      <p className="text-center mt-6">
        <Link to="/" className="text-sm text-rose-500 hover:text-rose-600">
          ← Back to home
        </Link>
      </p>
    </AuthShell>
  );
}
