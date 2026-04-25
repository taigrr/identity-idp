/**
 * Password Reset Request Page
 * Mirrors: app/controllers/users/reset_passwords_controller.rb#new
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        router.push(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="forgot-password">
      <h1>Reset your password</h1>

      <p className="usa-intro">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="email">
            Email address
          </label>
          <input
            className="usa-input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="margin-top-4">
        <Link href="/login" className="usa-link">
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
}
