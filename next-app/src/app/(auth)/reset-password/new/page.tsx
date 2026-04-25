/**
 * Password Reset - New Password Page
 * Mirrors: app/controllers/users/reset_passwords_controller.rb#edit
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateResetToken, resetPassword } from './actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function validate() {
      const result = await validateResetToken(token!);
      if (result.success) {
        setIsValid(true);
        setEmail(result.email || null);
      } else {
        setError(result.error || 'Invalid token');
      }
      setIsValidating(false);
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);

    const result = await resetPassword({
      token,
      password,
      passwordConfirmation,
    });

    if (result.success) {
      router.push('/login?flash=password_reset');
    } else {
      setError(result.error || 'Failed to reset password');
    }
    setIsSubmitting(false);
  }

  // No token - redirect to forgot password
  if (!token) {
    return (
      <div className="reset-password">
        <h1>Reset your password</h1>
        <p>No reset token provided.</p>
        <Link href="/forgot-password" className="usa-button">
          Request a password reset
        </Link>
      </div>
    );
  }

  // Validating
  if (isValidating) {
    return (
      <div className="reset-password">
        <h1>Reset your password</h1>
        <p>Validating your reset link...</p>
      </div>
    );
  }

  // Invalid token
  if (!isValid) {
    return (
      <div className="reset-password">
        <h1>Reset your password</h1>

        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <p>Password reset links expire after 6 hours. Please request a new one.</p>

        <Link href="/forgot-password" className="usa-button">
          Request a new reset link
        </Link>
      </div>
    );
  }

  // Valid - show form
  return (
    <div className="reset-password">
      <h1>Reset your password</h1>

      <p>
        Create a new password for <strong>{email}</strong>
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
            New password <span className="usa-hint text-base">(required)</span>
          </label>
          <span className="usa-hint">Must be at least 12 characters</span>
          <div className="position-relative">
            <input
              className="usa-input"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="password-confirmation">
            Confirm new password <span className="usa-hint text-base">(required)</span>
          </label>
          <input
            className="usa-input"
            id="password-confirmation"
            name="password-confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={12}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </div>

        <div className="usa-form-group">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            <label className="usa-checkbox__label" htmlFor="show-password">
              Show password
            </label>
          </div>
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </div>
      </form>

      <div className="margin-top-4">
        <p className="text-base">
          Password requirements:
        </p>
        <ul className="usa-list text-base">
          <li>At least 12 characters</li>
          <li>Cannot be a commonly used password</li>
          <li>Cannot contain your email address</li>
        </ul>
      </div>
    </div>
  );
}
