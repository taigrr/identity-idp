/**
 * Revoke Connected Account Page
 * Mirrors: app/views/users/service_provider_revoke/show.html.erb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getConnectedAccount, revokeConnectedAccount, type ConnectedAccount } from '../../actions';

export default function RevokeConnectedAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const result = await getConnectedAccount(accountId);
      if (result.success && result.account) {
        setAccount(result.account);
      } else {
        setError(result.error || 'Account not found');
      }
      setIsLoading(false);
    }
    loadAccount();
  }, [accountId]);

  async function handleRevoke() {
    setIsRevoking(true);
    setError(null);

    try {
      const result = await revokeConnectedAccount(accountId);
      if (result.success) {
        router.push('/account/connected-accounts?revoked=true');
      } else {
        setError(result.error || 'Failed to disconnect account');
      }
    } finally {
      setIsRevoking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="revoke-account">
        <h1>Disconnect account</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="revoke-account">
        <h1>Disconnect account</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error || 'Account not found'}</p>
          </div>
        </div>
        <Link href="/account/connected-accounts" className="usa-link">
          &larr; Back to connected accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="revoke-account">
      <h1>Disconnect from {account.friendlyName}</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Are you sure?</h2>
          <p className="usa-alert__text">
            If you disconnect from {account.friendlyName}, they will no longer be able to access
            your Login.gov information. You may need to sign in again and re-verify your identity
            if you want to use {account.friendlyName} in the future.
          </p>
        </div>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-base-lightest padding-3 margin-bottom-4">
        <h2 className="margin-top-0">{account.friendlyName}</h2>
        {account.description && <p>{account.description}</p>}
        <dl className="margin-bottom-0">
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
          {account.sharedEmail && (
            <div className="display-flex">
              <dt className="text-bold width-card">Email shared:</dt>
              <dd className="margin-0">{account.sharedEmail}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="display-flex flex-align-center">
        <button
          type="button"
          className="usa-button usa-button--secondary"
          onClick={handleRevoke}
          disabled={isRevoking}
        >
          {isRevoking ? 'Disconnecting...' : 'Yes, disconnect'}
        </button>

        <Link
          href="/account/connected-accounts"
          className="usa-button usa-button--unstyled margin-left-3"
        >
          No, keep connected
        </Link>
      </div>
    </div>
  );
}
