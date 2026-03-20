/**
 * IDV SSN Page
 * Mirrors: app/controllers/idv/ssn_controller.rb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitSsn } from '../actions';

export default function IdvSsnPage() {
  const router = useRouter();
  const [ssn, setSsn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format SSN as user types
  function handleSsnChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
    // Format as XXX-XX-XXXX
    if (value.length > 5) {
      value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    
    setSsn(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('ssn', ssn);
      
      const result = await submitSsn(formData);
      
      if (result.success) {
        router.push('/idv/verify-info');
      } else {
        setError(result.error || 'Invalid SSN');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="idv-ssn">
      <h1>Enter your Social Security number</h1>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Why we need your Social Security number</h2>
          <p className="usa-alert__text">
            We use your Social Security number to verify your identity with authoritative sources.
            Your SSN is encrypted and securely stored.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="ssn">
            Social Security number
          </label>
          <span className="usa-hint">For example, 123-45-6789</span>
          <input
            className="usa-input usa-input--medium"
            id="ssn"
            name="ssn"
            type="text"
            inputMode="numeric"
            pattern="[0-9-]*"
            maxLength={11}
            autoComplete="off"
            value={ssn}
            onChange={handleSsnChange}
            required
          />
        </div>

        <div className="margin-top-4">
          <button type="submit" className="usa-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </button>
        </div>
      </form>

      <div className="usa-alert usa-alert--warning margin-top-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            <strong>Privacy notice:</strong> Your Social Security number is never shared with
            third parties. We only use it to verify your identity.
          </p>
        </div>
      </div>

      <div className="margin-top-4">
        <Link href="/idv/document-capture" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}
