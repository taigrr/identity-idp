/**
 * TOTP (Auth App) Setup Page - Signup Flow
 * Mirrors: app/controllers/users/totp_setup_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initTotpSetup, verifyTotpSetup, type TotpSetupData } from './actions';

export default function AuthAppSetupPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSetup() {
      const result = await initTotpSetup();
      if (result.success && result.data) {
        setSetupData(result.data);
      } else {
        setError(result.error || 'Failed to initialize setup');
      }
      setIsLoading(false);
    }
    initSetup();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await verifyTotpSetup({
        code: code.replace(/\s/g, ''),
        name: name.trim() || 'My authentication app',
        rememberDevice,
      });

      if (result.success) {
        router.push(result.redirectTo || '/signup/completed');
      } else {
        setError(result.error || 'Invalid code');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="totp-setup">
        <h1>Set up an authentication app</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="totp-setup">
        <h1>Set up an authentication app</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error || 'Failed to initialize setup'}</p>
          </div>
        </div>
        <Link href="/signup/mfa" className="usa-link">
          Go back to authentication options
        </Link>
      </div>
    );
  }

  return (
    <div className="totp-setup">
      <h1>Set up an authentication app</h1>

      <p className="usa-intro">
        Authentication apps generate secure codes that you&apos;ll use to sign in.
      </p>

      <div className="margin-bottom-4">
        <h2>Step 1: Download an app</h2>
        <p>
          If you don&apos;t already have one, download an authentication app like Google
          Authenticator, Authy, or 1Password.
        </p>
      </div>

      <div className="margin-bottom-4">
        <h2>Step 2: Scan this QR code</h2>
        <p>Open your authentication app and scan this code:</p>

        <div
          className="qr-code margin-y-2 display-flex flex-justify-center"
          dangerouslySetInnerHTML={{ __html: setupData.qrCodeSvg }}
        />

        <details className="margin-top-2">
          <summary className="usa-link cursor-pointer">Can&apos;t scan the code?</summary>
          <div className="margin-top-2 padding-2 bg-base-lightest">
            <p className="margin-0">Enter this key manually in your app:</p>
            <code className="display-block margin-top-1 text-mono font-mono-lg">
              {setupData.secret}
            </code>
          </div>
        </details>
      </div>

      <form onSubmit={handleSubmit}>
        <h2>Step 3: Enter the code from your app</h2>

        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            One-time code <span className="usa-hint text-base">(required)</span>
          </label>
          <input
            className="usa-input usa-input--medium"
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9\s]*"
            maxLength={7}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            aria-describedby="code-hint"
          />
          <span id="code-hint" className="usa-hint">
            Enter the 6-digit code from your authentication app
          </span>
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="name">
            Nickname <span className="usa-hint text-base">(optional)</span>
          </label>
          <input
            className="usa-input"
            id="name"
            name="name"
            type="text"
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My authentication app"
          />
          <span className="usa-hint">
            Give this app a name to help you identify it later
          </span>
        </div>

        <div className="usa-form-group">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="remember-device"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <label className="usa-checkbox__label" htmlFor="remember-device">
              Remember this browser
            </label>
          </div>
          <span className="usa-hint margin-left-4">
            You won&apos;t need to use two-factor authentication on this browser for 30 days
          </span>
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </button>
          <Link href="/signup/mfa" className="usa-button usa-button--outline margin-left-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
