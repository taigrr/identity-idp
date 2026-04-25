/**
 * Email Confirmation Page
 * Mirrors: app/controllers/sign_up/email_confirmations_controller.rb
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { confirmEmail } from './actions';

function EmailConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('confirmation_token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const result = await confirmEmail(token);

      if (result.success) {
        setStatus('success');
        // Redirect to password setup after short delay
        setTimeout(() => {
          router.push(`/signup/password?token=${token}`);
        }, 2000);
      } else {
        setStatus('error');
        setError(result.error || 'Failed to confirm email');
      }
    }

    if (token) {
      confirm();
    } else {
      setStatus('error');
      setError('Missing confirmation token');
    }
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div className="email-confirmation">
        <h1>Confirming your email</h1>
        <p>Please wait while we confirm your email address...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="email-confirmation">
        <h1>Email confirmation</h1>

        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Confirmation failed</h2>
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>

        <p>
          The confirmation link may have expired or already been used.
        </p>

        <div className="margin-top-4">
          <Link href="/signup" className="usa-button">
            Start over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="email-confirmation">
      <h1>Email confirmed!</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Your email address has been confirmed. Redirecting you to create your password...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={<div>Confirming your email...</div>}>
      <EmailConfirmationContent />
    </Suspense>
  );
}
