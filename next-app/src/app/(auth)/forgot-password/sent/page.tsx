/**
 * Password Reset Email Sent Page
 * Mirrors: app/controllers/forgot_password_controller.rb
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { requestPasswordReset } from '../actions';
import { useState } from 'react';

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resent, setResent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setIsResending(true);
    await requestPasswordReset(email);
    setResent(true);
    setIsResending(false);
  }

  return (
    <div className="forgot-password-sent">
      <h1>Check your email</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            We sent an email to <strong>{email}</strong> with instructions to reset your password.
          </p>
        </div>
      </div>

      <div className="usa-prose">
        <h2>What to do next</h2>
        <ol>
          <li>Check your email inbox for a message from Login.gov</li>
          <li>Click the link in the email to reset your password</li>
          <li>The link expires in 6 hours</li>
        </ol>

        <h2>Didn&apos;t receive the email?</h2>
        <ul>
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email address</li>
          <li>
            {resent ? (
              <span className="text-green">Email resent!</span>
            ) : (
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Resend the email'}
              </button>
            )}
          </li>
        </ul>
      </div>

      <div className="margin-top-4">
        <Link href="/login" className="usa-link">
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordSentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SentContent />
    </Suspense>
  );
}
