/**
 * Backup Codes Setup Page
 * Mirrors: app/controllers/users/backup_code_setup_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateBackupCodes, confirmBackupCodesSaved, type BackupCodesResult } from './actions';

export default function BackupCodesCreatePage() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError('Please confirm you have saved these codes');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmBackupCodesSaved();
      if (result.success) {
        router.push('/account?mfa=backup_codes_added');
      } else {
        setError(result.error || 'Failed to confirm backup codes');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDownload() {
    const content = codes.join('\n');
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

  if (isLoading) {
    return (
      <div className="backup-codes-setup">
        <h1>Backup codes</h1>
        <p>Generating your backup codes...</p>
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="backup-codes-setup">
        <h1>Backup codes</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error || 'Failed to generate backup codes'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-codes-setup">
      <h1>Save your backup codes</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Save these codes in a safe place</h2>
          <p className="usa-alert__text">
            If you lose access to your phone or authentication app, you can use these backup codes
            to sign in. Each code can only be used once.
          </p>
        </div>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="backup-codes-container bg-base-lightest padding-3 margin-bottom-4">
        <ul className="backup-codes-list usa-list usa-list--unstyled">
          {codes.map((code, index) => (
            <li key={index} className="backup-code font-mono-md padding-y-05">
              {index + 1}. {code}
            </li>
          ))}
        </ul>
      </div>

      <div className="margin-bottom-4">
        <button
          type="button"
          className="usa-button usa-button--outline margin-right-2"
          onClick={handleDownload}
        >
          Download codes
        </button>
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={handlePrint}
        >
          Print codes
        </button>
      </div>

      <div className="usa-checkbox margin-bottom-4">
        <input
          className="usa-checkbox__input"
          id="acknowledged"
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => {
            setAcknowledged(e.target.checked);
            if (e.target.checked) setError(null);
          }}
        />
        <label className="usa-checkbox__label" htmlFor="acknowledged">
          I have saved my backup codes in a secure location
        </label>
      </div>

      <button
        type="button"
        className="usa-button"
        onClick={handleContinue}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
