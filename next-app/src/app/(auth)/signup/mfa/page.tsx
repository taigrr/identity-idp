/**
 * MFA Setup Selection Page (during signup)
 * Mirrors: app/controllers/two_factor_authentication/two_factor_authentication_setup_controller.rb
 */

import Link from 'next/link';

export default function MfaSetupPage() {
  return (
    <div className="mfa-setup">
      <h1>Set up two-factor authentication</h1>

      <p className="usa-intro">
        Choose at least one method to secure your account. We recommend setting up more than one
        method in case you lose access to one.
      </p>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Two-factor authentication adds an extra layer of security by requiring a second form
            of verification when you sign in.
          </p>
        </div>
      </div>

      <h2>Recommended methods</h2>

      <div className="mfa-option-list">
        <MfaOption
          href="/signup/mfa/auth-app"
          title="Authentication app"
          description="Use an app like Google Authenticator, Authy, or 1Password to generate codes"
          recommended
        />

        <MfaOption
          href="/signup/mfa/webauthn?platform=true"
          title="Face or touch unlock"
          description="Use Face ID, Touch ID, Windows Hello, or another built-in authenticator"
          recommended
        />

        <MfaOption
          href="/signup/mfa/webauthn"
          title="Security key"
          description="Use a physical security key like YubiKey"
        />
      </div>

      <h2 className="margin-top-4">Other methods</h2>

      <div className="mfa-option-list">
        <MfaOption
          href="/signup/mfa/phone"
          title="Phone"
          description="Receive codes by text message or phone call"
        />

        <MfaOption
          href="/signup/mfa/backup-codes"
          title="Backup codes"
          description="Generate one-time codes to use if you lose access to other methods"
        />
      </div>

      <div className="margin-top-4">
        <p className="text-base">
          You can add more authentication methods later from your account settings.
        </p>
      </div>
    </div>
  );
}

function MfaOption({
  href,
  title,
  description,
  recommended,
}: {
  href: string;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  return (
    <Link
      href={href}
      className="mfa-option display-block padding-3 margin-bottom-2 border-1px border-base-lighter radius-md text-no-underline hover:border-primary"
    >
      <div className="display-flex flex-justify">
        <div>
          <h3 className="margin-0 text-primary">{title}</h3>
          <p className="margin-top-1 margin-bottom-0 text-base">{description}</p>
        </div>
        {recommended && (
          <span className="usa-tag bg-success-dark">Recommended</span>
        )}
      </div>
    </Link>
  );
}
