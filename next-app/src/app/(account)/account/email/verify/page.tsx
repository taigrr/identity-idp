/**
 * Verify Email Page
 * Mirrors: app/views/users/emails/verify.html.erb
 */

'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { resendEmailConfirmation, EmailActionState } from '../actions';

const initialState: EmailActionState = { success: false };

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, formAction, pending] = useActionState(
    resendEmailConfirmation,
    initialState,
  );

  return (
    <div className="verify-email-page">
      <h1>Check your email</h1>

      <p>
        We sent a confirmation link to <strong>{email}</strong>.
      </p>

      <p>
        Click the link in the email to add this address to your account.
        The link expires in 24 hours.
      </p>

      {state.success && (
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Confirmation email resent!</p>
          </div>
        </div>
      )}

      {state.error && (
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{state.error}</p>
          </div>
        </div>
      )}

      <div className="action-links">
        <form action={formAction}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="usa-button usa-button--outline"
            disabled={pending}
          >
            {pending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        </form>
      </div>

      <p>
        <Link href="/account" className="usa-link">
          Back to account
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
