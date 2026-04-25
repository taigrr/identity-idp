/**
 * Account Reset Cancel Page
 * Mirrors: app/controllers/account_reset/cancel_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateCancelToken, confirmCancelReset } from './actions';

export default function AccountResetCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function validate() {
      const result = await validateCancelToken(token!);
      if (result.success) {
        setIsValid(true);
      } else {
        setError(result.error || 'Invalid token');
        // Redirect to home with error after a delay
        setTimeout(() => {
          router.push('/login?error=invalid_cancel_token');
        }, 3000);
      }
      setIsValidating(false);
    }
    validate();
  }, [token, router]);

  async function handleConfirmCancel() {
    if (!token) return;

    setIsCancelling(true);
    setError(null);

    const result = await confirmCancelReset(token);
    if (result.success) {
      router.push('/login?flash=reset_cancelled');
    } else {
      setError(result.error || 'Failed to cancel reset');
    }
    setIsCancelling(false);
  }

  // No token provided - show informational page
  if (!token) {
    return (
      <div className="account-reset-cancel">
        <h1>Cancel account reset</h1>

        <p>
          If you received an email about an account reset that you didn&apos;t request, click the
          cancel link in that email to stop the reset process.
        </p>

        <p>
          If you can&apos;t find the email, check your spam folder. The cancel link expires after 24
          hours.
        </p>

        <div className="margin-top-4">
          <Link href="/login" className="usa-button">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Validating token
  if (isValidating) {
    return (
      <div className="account-reset-cancel">
        <h1>Cancel account reset</h1>
        <p>Validating your cancel link...</p>
      </div>
    );
  }

  // Invalid token
  if (!isValid) {
    return (
      <div className="account-reset-cancel">
        <h1>Cancel account reset</h1>

        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              {error || 'This cancel link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <p className="margin-top-2">Redirecting to sign in...</p>
      </div>
    );
  }

  // Valid token - show confirmation
  return (
    <div className="account-reset-cancel">
      <h1>Cancel account reset</h1>

      <p>
        Are you sure you want to cancel your account reset request? Your account will remain active
        with your current settings.
      </p>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="margin-top-4">
        <button
          type="button"
          className="usa-button"
          onClick={handleConfirmCancel}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling...' : 'Yes, cancel the reset'}
        </button>
        <Link href="/login" className="usa-button usa-button--outline margin-left-2">
          No, continue with reset
        </Link>
      </div>
    </div>
  );
}
