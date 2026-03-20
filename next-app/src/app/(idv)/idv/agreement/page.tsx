/**
 * IDV Agreement Page
 * Mirrors: app/controllers/idv/agreement_controller.rb
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitAgreement } from '../actions';

export default function IdvAgreementPage() {
  const router = useRouter();
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!consented) {
      setError('You must agree to continue');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set('idv_consent_given', 'true');
    
    await submitAgreement(formData);
  }

  return (
    <div className="idv-agreement">
      <h1>How we verify your identity</h1>

      <div className="usa-prose margin-bottom-4">
        <p>
          Login.gov is a secure government website. When you verify your identity with Login.gov,
          we follow strict rules to protect your personal information.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Information from your ID document (name, address, date of birth)</li>
          <li>A photo of your face to match against your ID</li>
          <li>Your Social Security number</li>
          <li>A phone number to verify your identity</li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>We verify your identity with authoritative sources</li>
          <li>We check that your information matches official records</li>
          <li>We share your verified information only with government agencies you authorize</li>
        </ul>

        <h2>Your privacy</h2>
        <ul>
          <li>Your information is encrypted and securely stored</li>
          <li>We don&apos;t sell your information to third parties</li>
          <li>You can delete your account and information at any time</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="usa-alert usa-alert--error margin-bottom-2">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        <div className="usa-checkbox margin-bottom-4">
          <input
            className="usa-checkbox__input"
            id="consent"
            type="checkbox"
            checked={consented}
            onChange={(e) => {
              setConsented(e.target.checked);
              if (e.target.checked) setError(null);
            }}
          />
          <label className="usa-checkbox__label" htmlFor="consent">
            I have read and agree to the above terms. I consent to Login.gov verifying my identity
            and sharing my verified information with government agencies I authorize.
          </label>
        </div>

        <button type="submit" className="usa-button" disabled={isSubmitting}>
          {isSubmitting ? 'Continuing...' : 'Continue'}
        </button>
      </form>

      <div className="margin-top-4">
        <Link href="/idv" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}
