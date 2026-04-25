/**
 * WebAuthn Mismatch Page
 * Mirrors: app/controllers/users/webauthn_setup_mismatch_controller.rb
 */

import Link from 'next/link';

export default function WebAuthnMismatchPage() {
  return (
    <div className="webauthn-mismatch">
      <h1>Authentication method set up</h1>

      <div className="usa-alert usa-alert--info margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Different type detected</h2>
          <p className="usa-alert__text">
            We detected a different type of authenticator than expected. Your authentication method
            has been saved, but it may work differently than anticipated.
          </p>
        </div>
      </div>

      <p>
        You selected to set up a security key, but we detected a platform authenticator (like Face
        ID or Touch ID), or vice versa. This is okay - your authentication method will still work.
      </p>

      <p>
        You can rename this authentication method or set up additional methods in your account
        settings.
      </p>

      <div className="margin-top-4">
        <Link href="/signup/mfa" className="usa-button">
          Continue
        </Link>
      </div>
    </div>
  );
}
