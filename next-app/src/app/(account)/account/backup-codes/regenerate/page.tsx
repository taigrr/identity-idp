/**
 * Regenerate Backup Codes Page
 * Mirrors: app/views/users/backup_code_setup/edit.html.erb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { regenerateBackupCodes, confirmBackupCodesSaved } from '../create/actions';

export default function RegenerateBackupCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await regenerateBackupCodes();
      if (result.success && result.codes) {
        setCodes(result.codes);
      } else {
        setError(result.error || 'Failed to regenerate backup codes');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleContinue() {
    if (!acknowledged) {
      setError('Please confirm you have saved these codes');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmBackupCodesSaved();
      if (result.success) {
        router.push('/account?mfa=backup_codes_regenerated');
      } else {
        setError(result.error || 'Failed to confirm backup codes');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDownload() {
    if (!codes) return;
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

  if (!codes) {
    return (
      <div className="backup-codes-regenerate">
        <h1>Regenerate backup codes</h1>

        <div className="usa-alert usa-alert--warning margin-bottom-4">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Your current backup codes will be deleted</h2>
            <p className="usa-alert__text">
              When you regenerate backup codes, your old codes will stop working. Make sure you
              save your new codes in a safe place.
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

        <button
          type="button"
          className="usa-button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate new backup codes'}
        </button>
      </div>
    );
  }

  return (
    <div className="backup-codes-regenerate">
      <h1>Your new backup codes</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Your backup codes have been regenerated. Your old codes are no longer valid.
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
          className="usa-button usa-button--outline"
          onClick={handleDownload}
        >
          Download codes
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
          I have saved my new backup codes in a secure location
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
