/**
 * Account Reset Recovery Options Page
 * Mirrors: app/controllers/account_reset/recovery_options_controller.rb
 */

import Link from 'next/link';

export default function RecoveryOptionsPage() {
  return (
    <div className="recovery-options">
      <h1>Can&apos;t access your account?</h1>

      <p className="usa-intro">
        If you&apos;ve lost access to all your two-factor authentication methods, you have a few
        options.
      </p>

      <div className="usa-card-group">
        <div className="usa-card margin-bottom-4">
          <div className="usa-card__container">
            <div className="usa-card__header">
              <h2 className="usa-card__heading">Use backup codes</h2>
            </div>
            <div className="usa-card__body">
              <p>
                If you saved backup codes when setting up your account, you can use one to sign in.
              </p>
            </div>
            <div className="usa-card__footer">
              <Link href="/two-factor/backup-code" className="usa-button">
                Use backup code
              </Link>
            </div>
          </div>
        </div>

        <div className="usa-card margin-bottom-4">
          <div className="usa-card__container">
            <div className="usa-card__header">
              <h2 className="usa-card__heading">Use personal key</h2>
            </div>
            <div className="usa-card__body">
              <p>
                If you saved your personal key when verifying your identity, you can use it to
                recover your account.
              </p>
            </div>
            <div className="usa-card__footer">
              <Link href="/two-factor/personal-key" className="usa-button">
                Use personal key
              </Link>
            </div>
          </div>
        </div>

        <div className="usa-card margin-bottom-4">
          <div className="usa-card__container">
            <div className="usa-card__header">
              <h2 className="usa-card__heading">Delete and restart</h2>
            </div>
            <div className="usa-card__body">
              <p>
                If you can&apos;t use any recovery method, you can request to delete your account
                and start over. This process takes 24 hours for security.
              </p>
            </div>
            <div className="usa-card__footer">
              <Link href="/account-reset/request" className="usa-button usa-button--outline">
                Request account reset
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="margin-top-4">
        <Link href="/two-factor" className="usa-link">
          Back to sign in options
        </Link>
      </div>
    </div>
  );
}
