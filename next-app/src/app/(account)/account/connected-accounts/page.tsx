/**
 * Connected Accounts Page
 * Mirrors: app/controllers/users/service_provider_revoke_controller.rb
 */

import Link from 'next/link';
import { getConnectedAccounts, type ConnectedAccount } from './actions';

export default async function ConnectedAccountsPage() {
  const result = await getConnectedAccounts();

  if (!result.success) {
    return (
      <div className="connected-accounts">
        <h1>Connected accounts</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Unable to load connected accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  const accounts = result.accounts || [];

  return (
    <div className="connected-accounts">
      <h1>Connected accounts</h1>

      <p className="usa-intro">
        These are the government applications you&apos;ve signed in to with Login.gov. You can
        disconnect any application at any time.
      </p>

      {accounts.length === 0 ? (
        <div className="usa-alert usa-alert--info">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              You haven&apos;t connected any accounts yet. When you sign in to a government
              application using Login.gov, it will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="connected-accounts-list">
          {accounts.map((account) => (
            <ConnectedAccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <div className="margin-top-4">
        <Link href="/account" className="usa-link">
          &larr; Back to account
        </Link>
      </div>
    </div>
  );
}

function ConnectedAccountCard({ account }: { account: ConnectedAccount }) {
  return (
    <div className="connected-account-card bg-white border-1px border-base-lighter padding-3 margin-bottom-3">
      <div className="display-flex flex-justify">
        <div className="flex-1">
          <h2 className="margin-0">{account.friendlyName}</h2>
          {account.description && (
            <p className="text-base margin-top-1 margin-bottom-0">{account.description}</p>
          )}
        </div>
        {account.logoUrl && (
          <div className="connected-account-logo margin-left-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={account.logoUrl}
              alt={`${account.friendlyName} logo`}
              width={48}
              height={48}
            />
          </div>
        )}
      </div>

      <dl className="margin-top-3 margin-bottom-0">
        <div className="display-flex margin-bottom-1">
          <dt className="text-bold width-card">Connected on:</dt>
          <dd className="margin-0">
            {new Date(account.connectedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </dd>
        </div>
        {account.lastUsedAt && (
          <div className="display-flex margin-bottom-1">
            <dt className="text-bold width-card">Last used:</dt>
            <dd className="margin-0">
              {new Date(account.lastUsedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        )}
        {account.sharedEmail && (
          <div className="display-flex margin-bottom-1">
            <dt className="text-bold width-card">Email shared:</dt>
            <dd className="margin-0">{account.sharedEmail}</dd>
          </div>
        )}
        {account.identityVerified && (
          <div className="display-flex margin-bottom-1">
            <dt className="text-bold width-card">Identity verified:</dt>
            <dd className="margin-0">
              <span className="usa-tag bg-success">Yes</span>
            </dd>
          </div>
        )}
      </dl>

      <div className="margin-top-3">
        <Link
          href={`/account/connected-accounts/${account.id}/revoke`}
          className="usa-button usa-button--outline usa-button--secondary"
        >
          Disconnect
        </Link>
      </div>
    </div>
  );
}
