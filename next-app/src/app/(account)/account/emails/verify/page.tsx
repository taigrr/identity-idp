/**
 * Verify Email Page
 * Mirrors: app/controllers/users/emails_controller.rb#verify
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resendEmailConfirmation } from '../actions';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const inSelectEmailFlow = searchParams.get('in_select_email_flow') === 'true';

  const [isResending, setIsResending] = useState(false);
  const [showResent, setShowResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;

    setIsResending(true);
    setError(null);

    const result = await resendEmailConfirmation(email);
    if (result.success) {
      setShowResent(true);
    } else {
      setError(result.error || 'Failed to resend');
    }
    setIsResending(false);
  }

  if (!email) {
    return (
      <div className="verify-email">
        <h1>Verify your email</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No email address to verify.</p>
          </div>
        </div>
        <Link href="/account/emails/add" className="usa-link">
          Add an email address
        </Link>
      </div>
    );
  }

  return (
    <div className="verify-email">
      <h1>Check your email</h1>

      {showResent && (
        <div className="usa-alert usa-alert--success margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">A new confirmation email has been sent.</p>
          </div>
        </div>
      )}

      <p>
        We sent an email to <strong>{email}</strong> with a link to confirm your email address.
      </p>

      <div className="usa-alert usa-alert--info margin-y-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            The link expires in 24 hours. If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
      </div>

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
          className="usa-button usa-button--outline"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Sending...' : 'Resend confirmation email'}
        </button>
      </div>

      <div className="margin-top-4">
        <Link
          href={inSelectEmailFlow ? '/signup/select-email' : '/account'}
          className="usa-link"
        >
          {inSelectEmailFlow ? 'Back to email selection' : 'Back to account'}
        </Link>
      </div>
    </div>
  );
}
