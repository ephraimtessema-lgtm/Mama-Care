import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUpWithPassword } from '@/api/auth';
import { formatAuthError } from '@/lib/authErrors';
import { validatePassword, PASSWORD_HINT } from '@/lib/password';
import { AuthBrand, AuthShell } from '@/components/auth/AuthShell';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError({ message: passwordError });
      return;
    }
    if (password !== confirmPassword) {
      setError({ message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const { session } = await signUpWithPassword(email, password);
      const q = new URLSearchParams({
        email,
        redirect,
      });
      if (session) {
        navigate(redirect.startsWith('http') ? '/' : redirect, { replace: true });
        return;
      }
      navigate(`/verify-email?${q.toString()}`, { replace: true });
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Link
        to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600 mb-4 -mt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>

      <AuthBrand title="Create your account" subtitle="Join Mama-Care — safe pregnancy support" />

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Min. 8 characters"
              className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{PASSWORD_HINT}</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-800">
            Confirm password
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
            />
          </div>
        </div>

        {error?.message && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <p>{error.message}</p>
            {error.showSignIn && (
              <Link
                to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="inline-block mt-2 font-semibold text-rose-600 hover:text-rose-700"
              >
                Sign in instead →
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold shadow-md shadow-rose-200/50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{' '}
        <Link
          to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className="font-semibold text-slate-900 hover:text-rose-600"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
