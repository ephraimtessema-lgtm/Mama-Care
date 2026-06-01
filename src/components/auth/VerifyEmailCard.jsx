import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthBrand, AuthShell } from '@/components/auth/AuthShell';
import { OTP_LENGTH } from '@/lib/otpConfig';

export default function VerifyEmailCard({
  email,
  otp,
  onOtpChange,
  onSubmit,
  loading,
  error,
  resendIn,
  onResend,
}) {
  return (
    <AuthShell>
      <AuthBrand
        title="Verify your email"
        subtitle={`Enter the ${OTP_LENGTH}-digit code we sent to ${email}`}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="otp" className="text-sm font-semibold text-slate-800">
            Verification code
          </label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={`${'0'.repeat(OTP_LENGTH)}`}
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            disabled={loading}
            className="mt-1.5 h-11 rounded-xl text-center text-lg tracking-[0.3em] font-mono"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || otp.length !== OTP_LENGTH}
          className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
        >
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Didn&apos;t get it?{' '}
        <button
          type="button"
          disabled={resendIn > 0 || loading}
          onClick={onResend}
          className="text-rose-600 hover:text-rose-700 font-medium disabled:text-slate-400"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend email'}
        </button>
      </p>

      <p className="text-center text-sm text-slate-400 mt-2">
        Check your spam folder if you don&apos;t see the email.
      </p>

      <p className="text-center mt-6">
        <Link to="/login" className="text-sm text-rose-500 hover:text-rose-600">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
