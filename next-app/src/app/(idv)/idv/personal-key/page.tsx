/**
 * IDV Personal Key Page
 * Mirrors: app/controllers/idv/personal_key_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatePersonalKey, acknowledgePersonalKey } from '../actions';

export default function IdvPersonalKeyPage() {
  const router = useRouter();
  const [personalKey, setPersonalKey] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function getKey() {
      const key = await generatePersonalKey();
      setPersonalKey(key);
      setIsLoading(false);
    }
    getKey();
  }, []);

  async function handleContinue() {
    if (!acknowledged) {
      setError('Please confirm you have saved your personal key');
      return;
    }

    setIsSubmitting(true);
    await acknowledgePersonalKey();
  }

  function handleDownload() {
    if (!personalKey) return;
    
    const content = `Login.gov Personal Key\n\n${personalKey}\n\nSave this key in a safe place. You may need it to recover your account.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login-gov-personal-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="idv-personal-key">
        <h1>Your personal key</h1>
        <p>Generating your personal key...</p>
      </div>
    );
  }

  return (
    <div className="idv-personal-key">
      <h1>Identity verification complete!</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Your identity has been verified</h2>
          <p className="usa-alert__text">
            You can now use Login.gov with government services that require identity verification.
          </p>
        </div>
      </div>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Save your personal key</h2>
          <p className="usa-alert__text">
            Your personal key is the only way to recover your account if you lose all your other
            sign-in methods. Save it somewhere safe and don&apos;t share it with anyone.
          </p>
        </div>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-base-lightest padding-4 margin-bottom-4">
        <h2 className="margin-top-0">Your personal key</h2>
        <p className="font-mono-lg text-center padding-4 bg-white border-1px border-base-lighter">
          {personalKey}
        </p>
        <button
          type="button"
          className="usa-button usa-button--outline margin-top-2"
          onClick={handleDownload}
        >
          Download key
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
          I have saved my personal key in a secure location
        </label>
      </div>

      <button
        type="button"
        className="usa-button usa-button--big"
        onClick={handleContinue}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Continuing...' : 'Continue to your account'}
      </button>
    </div>
  );
}
