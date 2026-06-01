import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailOtp, resendVerificationEmail } from '@/api/auth';
import { useAuth } from '@/lib/AuthContext';
import { formatAuthError } from '@/lib/authErrors';
import VerifyEmailCard from '@/components/auth/VerifyEmailCard';
import { OTP_LENGTH, isCompleteOtp, normalizeOtp } from '@/lib/otpConfig';

const RESEND_SECONDS = 60;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/';
  const email = searchParams.get('email') || '';
  const { checkUserAuth } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleVerify = async (code) => {
    if (!isCompleteOtp(code)) return;
    setError('');
    setLoading(true);
    try {
      await verifyEmailOtp(email, normalizeOtp(code), 'signup');
      await checkUserAuth();
      navigate(redirect.startsWith('http') ? '/' : redirect, { replace: true });
    } catch (err) {
      setError(formatAuthError(err).message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await resendVerificationEmail(email);
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(formatAuthError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <VerifyEmailCard
      email={email}
      otp={otp}
      onOtpChange={setOtp}
      onSubmit={() => handleVerify(otp)}
      loading={loading}
      error={error}
      resendIn={resendIn}
      onResend={handleResend}
    />
  );
}
