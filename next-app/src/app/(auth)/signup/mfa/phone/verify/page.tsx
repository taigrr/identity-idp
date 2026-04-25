/**
 * Phone OTP Verification Page - Signup Flow
 * Mirrors: app/controllers/idv/otp_verification_controller.rb (reused for phone setup)
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPhoneOtp, resendPhoneOtp } from './actions';

export default function PhoneVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deliveryPreference = (searchParams.get('delivery') as 'sms' | 'voice') || 'sms';
  const wasResent = searchParams.get('resent') === 'true';

  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResent, setShowResent] = useState(wasResent);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setShowResent(false);

    try {
      const result = await verifyPhoneOtp({
        code: code.replace(/\D/g, ''),
        rememberDevice,
      });

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setError(result.error || 'Invalid code');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend(newDelivery: 'sms' | 'voice') {
    setError(null);
    setIsResending(true);

    try {
      const result = await resendPhoneOtp({
        otpDeliveryPreference: newDelivery,
      });

      if (result.success) {
        setShowResent(true);
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

      <p className="usa-intro">
        {deliveryPreference === 'sms'
          ? "We sent a text message with a one-time code to your phone."
          : "We're calling your phone with a one-time code."}
      </p>

      {showResent && (
        <div className="usa-alert usa-alert--success margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              {deliveryPreference === 'sms'
                ? 'A new code has been sent to your phone.'
                : "We're calling you with a new code."}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            One-time code <span className="usa-hint text-base">(required)</span>
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
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            aria-describedby="code-hint"
          />
          <span id="code-hint" className="usa-hint">
            Enter the 6-digit code
          </span>
        </div>

        <div className="usa-form-group">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="remember-device"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <label className="usa-checkbox__label" htmlFor="remember-device">
              Remember this browser for 30 days
            </label>
          </div>
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="margin-top-4 padding-top-2 border-top-1px border-base-lighter">
        <p className="text-bold">Didn&apos;t receive a code?</p>
        <ul className="usa-list">
          <li>
            <button
              type="button"
              className="usa-button usa-button--unstyled"
              onClick={() => handleResend('sms')}
              disabled={isResending}
            >
              Send another text message
            </button>
          </li>
          <li>
            <button
              type="button"
              className="usa-button usa-button--unstyled"
              onClick={() => handleResend('voice')}
              disabled={isResending}
            >
              Call me instead
            </button>
          </li>
        </ul>
      </div>

      <div className="margin-top-4">
        <Link href="/signup/mfa/phone" className="usa-link">
          Use a different phone number
        </Link>
      </div>
    </div>
  );
}
