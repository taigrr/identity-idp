/**
 * Account History Page
 * Mirrors: app/controllers/account_history_controller.rb
 */

import Link from 'next/link';
import { getAccountHistory, type AccountEvent } from './actions';

export default async function AccountHistoryPage() {
  const result = await getAccountHistory();

  if (!result.success) {
    return (
      <div className="account-history">
        <h1>Account history</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Unable to load account history.</p>
          </div>
        </div>
      </div>
    );
  }

  const events = result.events || [];

  return (
    <div className="account-history">
      <h1>Account history</h1>

      <p className="usa-intro">
        This is a record of changes and activity on your Login.gov account.
      </p>

      {events.length === 0 ? (
        <div className="usa-alert usa-alert--info">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No account activity recorded yet.</p>
          </div>
        </div>
      ) : (
        <table className="usa-table usa-table--borderless width-full">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Event</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <AccountEventRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      )}

      <div className="margin-top-4">
        <Link href="/account" className="usa-link">
          &larr; Back to account
        </Link>
      </div>
    </div>
  );
}

function AccountEventRow({ event }: { event: AccountEvent }) {
  const eventTypeLabels: Record<string, string> = {
    account_created: 'Account created',
    password_changed: 'Password changed',
    email_added: 'Email address added',
    email_deleted: 'Email address removed',
    phone_added: 'Phone number added',
    phone_deleted: 'Phone number removed',
    totp_enabled: 'Authentication app enabled',
    totp_disabled: 'Authentication app removed',
    webauthn_key_added: 'Security key added',
    webauthn_key_removed: 'Security key removed',
    backup_codes_created: 'Backup codes generated',
    backup_codes_regenerated: 'Backup codes regenerated',
    piv_cac_enabled: 'PIV/CAC enabled',
    piv_cac_disabled: 'PIV/CAC removed',
    identity_verified: 'Identity verified',
    sp_connected: 'Connected to application',
    sp_disconnected: 'Disconnected from application',
    sign_in: 'Signed in',
    sign_out: 'Signed out',
    account_reset_request: 'Account reset requested',
    account_reset_cancel: 'Account reset cancelled',
  };

  return (
    <tr>
      <td>
        {new Date(event.occurredAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </td>
      <td>{eventTypeLabels[event.eventType] || event.eventType}</td>
      <td>
        {event.details && (
          <span className="text-base-dark">{event.details}</span>
        )}
        {event.ipAddress && (
          <span className="display-block text-base font-body-2xs">
            IP: {event.ipAddress}
          </span>
        )}
      </td>
    </tr>
  );
}
