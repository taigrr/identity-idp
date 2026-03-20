/**
 * Account Dashboard Page
 * Mirrors: app/views/accounts/show.html.erb
 */

import Link from 'next/link';
import { getAccountInfo, AccountInfo } from './actions';

export default async function AccountPage() {
  const result = await getAccountInfo();

  if (!result.success || !result.account) {
    return (
      <div className="usa-alert usa-alert--error">
        <div className="usa-alert__body">
          <p className="usa-alert__text">Unable to load account information.</p>
        </div>
      </div>
    );
  }

  const account = result.account;

  return (
    <div className="account-dashboard">
      <h1>Your account</h1>

      {/* Email Section */}
      <EmailSection emails={account.confirmedEmails} />

      {/* Password Section */}
      <PasswordSection />

      {/* Two-Factor Authentication Section */}
      <MfaSection account={account} />

      {/* Identity Verification Section */}
      <IdentityVerificationSection
        verified={account.identityVerified}
        profile={account.verifiedProfile}
      />

      {/* Connected Accounts Section */}
      <ConnectedAccountsSection />

      {/* Account Management Section */}
      <AccountManagementSection createdAt={account.createdAt} />
    </div>
  );
}

function EmailSection({ emails }: { emails: string[] }) {
  return (
    <section className="account-section">
      <h2>Email addresses</h2>
      <ul className="email-list">
        {emails.map((email, index) => (
          <li key={email}>
            <span className="email">{email}</span>
            {index === 0 && (
              <span className="badge badge--primary">Primary</span>
            )}
          </li>
        ))}
      </ul>
      <div className="action-links">
        <Link href="/account/email/add" className="usa-link">
          Add email address
        </Link>
      </div>
    </section>
  );
}

function PasswordSection() {
  return (
    <section className="account-section">
      <h2>Password</h2>
      <p>••••••••••</p>
      <div className="action-links">
        <Link href="/account/password/edit" className="usa-link">
          Change password
        </Link>
      </div>
    </section>
  );
}

function MfaSection({ account }: { account: AccountInfo }) {
  const hasMfa =
    account.phoneConfigs.length > 0 ||
    account.totpConfigs.length > 0 ||
    account.webauthnConfigs.length > 0 ||
    account.backupCodesConfigured ||
    account.pivCacConfigs.length > 0;

  return (
    <section className="account-section">
      <h2>Two-factor authentication</h2>

      {!hasMfa && (
        <div className="usa-alert usa-alert--warning">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              You haven&apos;t set up any authentication methods yet.
            </p>
          </div>
        </div>
      )}

      {/* Phone MFA */}
      <div className="mfa-group">
        <h3>Phone</h3>
        {account.phoneConfigs.length === 0 ? (
          <p className="muted">Not configured</p>
        ) : (
          <ul className="mfa-list">
            {account.phoneConfigs.map((phone) => (
              <li key={phone.id}>
                <span>{phone.phone}</span>
                {phone.isDefault && (
                  <span className="badge badge--secondary">Default</span>
                )}
                <span className="muted">
                  ({phone.deliveryPreference === 'sms' ? 'Text message' : 'Phone call'})
                </span>
                <Link href={`/account/phone/${phone.id}/edit`} className="usa-link">
                  Edit
                </Link>
                <Link href={`/account/phone/${phone.id}/delete`} className="usa-link text-error">
                  Delete
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/phone/add" className="usa-link">
          Add phone
        </Link>
      </div>

      {/* Authentication Apps */}
      <div className="mfa-group">
        <h3>Authentication apps</h3>
        {account.totpConfigs.length === 0 ? (
          <p className="muted">Not configured</p>
        ) : (
          <ul className="mfa-list">
            {account.totpConfigs.map((totp) => (
              <li key={totp.id}>
                <span>{totp.name}</span>
                <Link href={`/account/totp/${totp.id}/edit`} className="usa-link">
                  Edit
                </Link>
                <Link href={`/account/totp/${totp.id}/delete`} className="usa-link text-error">
                  Delete
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/totp/add" className="usa-link">
          Add authentication app
        </Link>
      </div>

      {/* Security Keys / Face or Touch Unlock */}
      <div className="mfa-group">
        <h3>Security keys and biometrics</h3>
        {account.webauthnConfigs.length === 0 ? (
          <p className="muted">Not configured</p>
        ) : (
          <ul className="mfa-list">
            {account.webauthnConfigs.map((webauthn) => (
              <li key={webauthn.id}>
                <span>{webauthn.name}</span>
                <span className="badge">
                  {webauthn.platformAuthenticator ? 'Face/Touch unlock' : 'Security key'}
                </span>
                <Link href={`/account/webauthn/${webauthn.id}/edit`} className="usa-link">
                  Edit
                </Link>
                <Link
                  href={`/account/webauthn/${webauthn.id}/delete`}
                  className="usa-link text-error"
                >
                  Delete
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/webauthn/add" className="usa-link">
          Add security key or biometric
        </Link>
      </div>

      {/* Backup Codes */}
      <div className="mfa-group">
        <h3>Backup codes</h3>
        {!account.backupCodesConfigured ? (
          <p className="muted">Not configured</p>
        ) : (
          <p>
            {10 - account.backupCodeUsedCount} of 10 codes remaining
            <Link href="/account/backup-codes/regenerate" className="usa-link">
              Regenerate codes
            </Link>
          </p>
        )}
        {!account.backupCodesConfigured && (
          <Link href="/account/backup-codes/create" className="usa-link">
            Generate backup codes
          </Link>
        )}
      </div>

      {/* PIV/CAC */}
      <div className="mfa-group">
        <h3>PIV/CAC</h3>
        {account.pivCacConfigs.length === 0 ? (
          <p className="muted">Not configured</p>
        ) : (
          <ul className="mfa-list">
            {account.pivCacConfigs.map((piv) => (
              <li key={piv.id}>
                <span>{piv.name}</span>
                <Link href={`/account/piv-cac/${piv.id}/edit`} className="usa-link">
                  Edit
                </Link>
                <Link href={`/account/piv-cac/${piv.id}/delete`} className="usa-link text-error">
                  Delete
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/piv-cac/add" className="usa-link">
          Add PIV/CAC
        </Link>
      </div>
    </section>
  );
}

function IdentityVerificationSection({
  verified,
  profile,
}: {
  verified: boolean;
  profile: AccountInfo['verifiedProfile'];
}) {
  return (
    <section className="account-section">
      <h2>Identity verification</h2>

      {!verified ? (
        <div>
          <p className="muted">Not verified</p>
          <Link href="/idv" className="usa-button">
            Verify your identity
          </Link>
        </div>
      ) : (
        <div className="verified-profile">
          <span className="badge badge--success">Verified</span>
          {profile && (
            <dl className="profile-details">
              <dt>Name</dt>
              <dd>
                {profile.firstName} {profile.lastName}
              </dd>
              <dt>Address</dt>
              <dd>
                {profile.address1}
                {profile.address2 && <br />}
                {profile.address2}
                <br />
                {profile.city}, {profile.state} {profile.zipcode}
              </dd>
              <dt>Date of birth</dt>
              <dd>{profile.dateOfBirth}</dd>
              <dt>Social Security number</dt>
              <dd>•••-••-{profile.ssnLast4}</dd>
              {profile.phone && (
                <>
                  <dt>Phone</dt>
                  <dd>{profile.phone}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      )}
    </section>
  );
}

function ConnectedAccountsSection() {
  return (
    <section className="account-section">
      <h2>Connected accounts</h2>
      <p className="muted">
        View the government applications you&apos;ve signed in to with Login.gov.
      </p>
      <Link href="/account/connected-accounts" className="usa-link">
        View connected accounts
      </Link>
    </section>
  );
}

function AccountManagementSection({ createdAt }: { createdAt: Date }) {
  return (
    <section className="account-section">
      <h2>Account management</h2>
      <dl>
        <dt>Account created</dt>
        <dd>{createdAt.toLocaleDateString()}</dd>
      </dl>
      <div className="action-links">
        <Link href="/account/history" className="usa-link">
          Account history
        </Link>
        <Link href="/account/delete" className="usa-link text-error">
          Delete account
        </Link>
      </div>
    </section>
  );
}
