import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AuthBrand,
  AuthShell,
  AuthError,
  authLabelClass,
  authInputClass,
  authMutedClass,
} from '@/components/auth/AuthShell';
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
          <label htmlFor="otp" className={authLabelClass}>
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
            className={`mt-1.5 text-center text-lg tracking-[0.3em] font-mono ${authInputClass}`}
          />
        </div>

        {error && <AuthError>{error}</AuthError>}

        <Button
          type="submit"
          disabled={loading || otp.length !== OTP_LENGTH}
          className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
        >
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <p className={`text-center mt-4 ${authMutedClass}`}>
        Didn&apos;t get it?{' '}
        <button
          type="button"
          disabled={resendIn > 0 || loading}
          onClick={onResend}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium disabled:text-slate-400 dark:disabled:text-gray-600"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend email'}
        </button>
      </p>

      <p className="text-center text-sm text-slate-400 dark:text-gray-500 mt-2">
        Check your spam folder if you don&apos;t see the email.
      </p>

      <p className="text-center mt-6">
        <Link to="/login" className="text-sm text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
