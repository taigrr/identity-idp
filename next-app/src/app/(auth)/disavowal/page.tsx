/**
 * Event Disavowal Page
 * Mirrors: app/controllers/event_disavowal_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DisavowalData {
  eventType: string;
  eventDate: string;
  email: string;
}

export default function EventDisavowalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('disavowal_token');

  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(false);
  const [data, setData] = useState<DisavowalData | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function validate() {
      // TODO: Validate disavowal token
      // Mock validation
      if (token && token.length >= 10) {
        setIsValid(true);
        setData({
          eventType: 'password_changed',
          eventDate: new Date().toISOString(),
          email: 'user@example.gov',
        });
      } else {
        setError('This link is invalid or has expired');
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

    // TODO: Handle disavowal
    // 1. Validate token
    // 2. Verify user's password
    // 3. Mark event as disavowed
    // 4. Force password reset
    // 5. Revoke all sessions
    // 6. Track analytics

    // For now, redirect to password reset
    router.push('/reset-password?disavowed=true');
  }

  if (!token) {
    return (
      <div className="event-disavowal">
        <h1>Report suspicious activity</h1>
        <p>No disavowal token provided.</p>
        <Link href="/login" className="usa-button">
          Return to sign in
        </Link>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="event-disavowal">
        <h1>Report suspicious activity</h1>
        <p>Validating your link...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="event-disavowal">
        <h1>Report suspicious activity</h1>

        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>

        <p>
          If you believe your account has been compromised, please{' '}
          <Link href="/forgot-password" className="usa-link">
            reset your password
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="event-disavowal">
      <h1>Report suspicious activity</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Did you make this change?</h2>
          <p className="usa-alert__text">
            We detected a {data?.eventType?.replace('_', ' ')} on your account. If you didn&apos;t
            make this change, secure your account below.
          </p>
        </div>
      </div>

      <p>
        If you clicked this link by mistake and you did make this change, you can safely ignore this
        page.
      </p>

      <h2>Secure your account</h2>

      <p>
        To report this activity as suspicious and secure your account, enter your password below.
        This will:
      </p>

      <ul className="usa-list">
        <li>Sign out all devices</li>
        <li>Require you to reset your password</li>
        <li>Alert our security team</li>
      </ul>

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
            Current password <span className="usa-hint text-base">(required)</span>
          </label>
          <input
            className="usa-input"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <button type="submit" className="usa-button usa-button--secondary" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'This wasn\'t me - secure my account'}
          </button>
        </div>
      </form>

      <div className="margin-top-4">
        <Link href="/login" className="usa-link">
          This was me - return to sign in
        </Link>
      </div>
    </div>
  );
}
