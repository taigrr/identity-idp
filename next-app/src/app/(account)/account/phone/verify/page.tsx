/**
 * Phone Verification Page
 * Mirrors: app/views/two_factor_authentication/otp_verification/show.html.erb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPhoneOtp, resendPhoneOtp } from '../add/actions';

export default function VerifyPhonePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await verifyPhoneOtp(code.replace(/\s/g, ''));

      if (result.success) {
        router.push('/account?mfa=phone_added');
      } else {
        setError(result.error || 'Invalid code');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    setIsResending(true);

    try {
      const result = await resendPhoneOtp();
      if (result.success) {
        setMessage('A new code has been sent');
        setCode('');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="phone-verify">
      <h1>Enter your one-time code</h1>

      <p className="usa-intro">We sent a code to your phone. Enter it below to verify.</p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        {message && (
          <div className="usa-alert usa-alert--success margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{message}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            One-time code
          </label>
          <input
            className="usa-input usa-input--medium"
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="margin-top-3">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="margin-top-4">
        <p>
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            className="usa-button usa-button--unstyled"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? 'Sending...' : 'Send a new code'}
          </button>
        </p>
      </div>
    </div>
  );
}
