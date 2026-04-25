/**
 * Backup Code Setup Page - Signup Flow
 * Mirrors: app/controllers/users/backup_code_setup_controller.rb
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateBackupCodes, confirmBackupCodesSaved } from './actions';

export default function BackupCodesSetupPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const codesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const result = await generateBackupCodes();
      if (result.success && result.codes) {
        setCodes(result.codes);
      } else {
        setError(result.error || 'Failed to generate backup codes');
      }
      setIsLoading(false);
    }
    init();
  }, []);

  async function handleContinue() {
    if (!acknowledged) {
      setError('Please confirm that you have saved your backup codes');
      return;
    }

    setError(null);
    setIsConfirming(true);

    try {
      const result = await confirmBackupCodesSaved();
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setError(result.error || 'Failed to confirm');
      }
    } finally {
      setIsConfirming(false);
    }
  }

  function handleDownload() {
    const content = [
      'Login.gov Backup Codes',
      '='.repeat(30),
      '',
      'Keep these codes in a safe place. Each code can only be used once.',
      '',
      ...codes.map((code, i) => `${(i + 1).toString().padStart(2, ' ')}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleDateString()}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login-gov-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  }

  if (isLoading) {
    return (
      <div className="backup-codes-setup">
        <h1>Set up backup codes</h1>
        <p>Generating your backup codes...</p>
      </div>
    );
  }

  if (error && codes.length === 0) {
    return (
      <div className="backup-codes-setup">
        <h1>Set up backup codes</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
        <Link href="/signup/mfa" className="usa-link">
          Go back to authentication options
        </Link>
      </div>
    );
  }

  return (
    <div className="backup-codes-setup">
      <h1>Save your backup codes</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Important</h2>
          <p className="usa-alert__text">
            Save these codes in a secure location. You can use them to sign in if you lose access to
            your other authentication methods. Each code can only be used once.
          </p>
        </div>
      </div>

      <div
        ref={codesRef}
        className="backup-codes-container bg-base-lightest padding-4 radius-md margin-bottom-4"
      >
        <div className="grid-row grid-gap">
          <div className="grid-col-6">
            <ul className="usa-list usa-list--unstyled">
              {codes.slice(0, 6).map((code, i) => (
                <li key={i} className="font-mono-md padding-y-05">
                  {i + 1}. {code}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid-col-6">
            <ul className="usa-list usa-list--unstyled">
              {codes.slice(6).map((code, i) => (
                <li key={i + 6} className="font-mono-md padding-y-05">
                  {i + 7}. {code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="margin-bottom-4">
        <button
          type="button"
          className="usa-button usa-button--outline margin-right-2"
          onClick={handleDownload}
        >
          Download
        </button>
        <button
          type="button"
          className="usa-button usa-button--outline margin-right-2"
          onClick={handlePrint}
        >
          Print
        </button>
        <button type="button" className="usa-button usa-button--outline" onClick={handleCopy}>
          Copy
        </button>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="usa-form-group margin-bottom-4">
        <div className="usa-checkbox">
          <input
            className="usa-checkbox__input"
            id="acknowledged"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <label className="usa-checkbox__label" htmlFor="acknowledged">
            I have saved my backup codes in a secure location
          </label>
        </div>
      </div>

      <div className="margin-top-4">
        <button
          type="button"
          className="usa-button"
          onClick={handleContinue}
          disabled={isConfirming}
        >
          {isConfirming ? 'Confirming...' : 'Continue'}
        </button>
        <Link href="/signup/mfa" className="usa-button usa-button--outline margin-left-2">
          Cancel
        </Link>
      </div>
    </div>
  );
}
