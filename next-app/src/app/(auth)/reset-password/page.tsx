/**
 * Password Reset Page (with token)
 * Mirrors: app/controllers/users/reset_passwords_controller.rb#edit
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateResetToken, resetPassword } from '../forgot-password/actions';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function validate() {
      const result = await validateResetToken(token);
      setIsValid(result.valid);
      setTokenError(result.error || null);
      setIsValidating(false);
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await resetPassword({
        token,
        password,
        passwordConfirmation,
      });

      if (result.success) {
        router.push('/login?password_reset=true');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <div className="reset-password">
        <h1>Reset your password</h1>
        <p>Validating your reset link...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="reset-password">
        <h1>Reset your password</h1>

        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Invalid or expired link</h2>
            <p className="usa-alert__text">
              {tokenError || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <p>
          <Link href="/forgot-password" className="usa-link">
            Request a new password reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="reset-password">
      <h1>Create a new password</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="password">
            New password
          </label>
          <span className="usa-hint">Must be at least 12 characters</span>
          <input
            className="usa-input"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            required
          />
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="password_confirmation">
            Confirm new password
          </label>
          <input
            className="usa-input"
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            minLength={12}
            required
          />
        </div>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
