/**
 * IDV Phone OTP Verification Page
 * Mirrors: app/controllers/idv/otp_verification_controller.rb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyPhoneOtp } from '../../actions';

export default function IdvPhoneVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('otp', otp);
      
      const result = await verifyPhoneOtp(formData);
      
      if (result.success) {
        router.push('/idv/personal-key');
      } else {
        setError(result.error || 'Invalid code');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="idv-phone-verify">
      <h1>Enter your verification code</h1>

      <p className="usa-intro margin-bottom-4">
        We sent a one-time code to your phone. Enter it below to complete verification.
      </p>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="otp">
            One-time code
          </label>
          <input
            className="usa-input usa-input--medium"
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="margin-top-4">
        <p>
          Didn&apos;t receive a code?{' '}
          <Link href="/idv/phone" className="usa-link">
            Try again
          </Link>
        </p>
      </div>

      <div className="margin-top-4">
        <Link href="/idv/phone" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}
