/**
 * TOTP Setup Page
 * Mirrors: app/controllers/users/totp_setup_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupTotp, verifyTotpSetup, type TotpSetupData } from './actions';

export default function TotpSetupPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSetup() {
      const result = await setupTotp();
      if (result.success && result.data) {
        setSetupData(result.data);
      } else {
        setError(result.error || 'Failed to initialize TOTP setup');
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
      });

      if (result.success) {
        router.push('/account?mfa=totp_added');
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
        <h1>Set up authentication app</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="totp-setup">
        <h1>Set up authentication app</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error || 'Failed to initialize setup'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="totp-setup">
      <h1>Set up authentication app</h1>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Use an authentication app like Google Authenticator, Authy, or 1Password to scan the QR
            code below.
          </p>
        </div>
      </div>

      <div className="totp-qr-section margin-bottom-4">
        <h2>Step 1: Scan this QR code</h2>
        {/* QR Code rendered as SVG */}
        <div
          className="qr-code margin-y-2"
          dangerouslySetInnerHTML={{ __html: setupData.qrCodeSvg }}
        />

        <details className="margin-top-2">
          <summary>Can&apos;t scan the code?</summary>
          <p className="margin-top-1">
            Enter this key manually in your authentication app:
            <br />
            <code className="text-mono bg-base-lightest padding-1">{setupData.secret}</code>
          </p>
        </details>
      </div>

      <form onSubmit={handleSubmit}>
        <h2>Step 2: Enter the code from your app</h2>

        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="code">
            One-time code
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
          />
        </div>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="name">
            Nickname (optional)
          </label>
          <span className="usa-hint">Give this authentication app a name to help you identify it</span>
          <input
            className="usa-input"
            id="name"
            name="name"
            type="text"
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
