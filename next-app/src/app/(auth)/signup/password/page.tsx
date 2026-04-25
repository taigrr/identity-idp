/**
 * Password Setup Page (during signup)
 * Mirrors: app/controllers/sign_up/passwords_controller.rb
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setupPassword } from './actions';

function PasswordSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await setupPassword({
        token,
        password,
        passwordConfirmation,
      });

      if (result.success) {
        // Redirect to MFA setup
        router.push('/signup/mfa');
      } else {
        setError(result.error || 'Failed to set password');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="password-setup">
      <h1>Create your password</h1>

      <p className="usa-intro">
        Create a strong password to protect your Login.gov account.
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
          <label className="usa-label" htmlFor="password">
            Password
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
            Confirm password
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

        <div className="usa-alert usa-alert--info margin-y-3">
          <div className="usa-alert__body">
            <p className="usa-alert__heading">Password tips</p>
            <ul className="margin-top-1">
              <li>Use 12 or more characters</li>
              <li>Don&apos;t use your email or common words</li>
              <li>Consider using a passphrase (several random words)</li>
            </ul>
          </div>
        </div>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create password'}
        </button>
      </form>
    </div>
  );
}

export default function PasswordSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordSetupContent />
    </Suspense>
  );
}
