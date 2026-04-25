/**
 * MFA Confirmation Page
 * Mirrors: app/controllers/mfa_confirmation_controller.rb
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MfaConfirmationPage() {
  const router = useRouter();

  return (
    <div className="mfa-confirmation">
      <h1>Two-factor authentication set up</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Success!</h2>
          <p className="usa-alert__text">
            You&apos;ve successfully set up two-factor authentication for your account.
          </p>
        </div>
      </div>

      <h2>Recommended: Add a backup method</h2>

      <p>
        We strongly recommend adding a second authentication method. This ensures you can still
        access your account if you lose access to your primary method.
      </p>

      <div className="usa-card-group margin-bottom-4">
        <div className="usa-card">
          <div className="usa-card__container">
            <div className="usa-card__body">
              <p>
                <strong>Why add a backup?</strong> If you lose your phone or security key, a backup
                method prevents you from being locked out of your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="margin-top-4">
        <Link href="/signup/mfa" className="usa-button">
          Add another method
        </Link>
        <button
          type="button"
          className="usa-button usa-button--outline margin-left-2"
          onClick={() => router.push('/signup/completed')}
        >
          Skip for now
        </button>
      </div>

      <p className="margin-top-4 text-base">
        You can always add more authentication methods later from your account settings.
      </p>
    </div>
  );
}
