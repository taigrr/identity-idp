/**
 * Account Reset Pending Page
 * Mirrors: app/controllers/account_reset/pending_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPendingAccountReset, cancelPendingReset } from './actions';

interface PendingResetData {
  requestedAt: string;
  grantedAt: string | null;
  fraudWaitPeriodDays: number;
  isGranted: boolean;
  timeRemaining: string;
}

export default function AccountResetPendingPage() {
  const router = useRouter();
  const [data, setData] = useState<PendingResetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await getPendingAccountReset();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load reset status');
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  async function handleCancel() {
    setIsCancelling(true);
    setError(null);

    const result = await cancelPendingReset();
    if (result.success) {
      router.push('/two-factor?flash=reset_cancelled');
    } else {
      setError(result.error || 'Failed to cancel reset request');
    }
    setIsCancelling(false);
  }

  if (isLoading) {
    return (
      <div className="account-reset-pending">
        <h1>Account reset in progress</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="account-reset-pending">
        <h1>Account reset</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
        <Link href="/two-factor" className="usa-link">
          Return to sign in
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.isGranted) {
    return (
      <div className="account-reset-pending">
        <h1>Your account reset is ready</h1>

        <div className="usa-alert usa-alert--info margin-bottom-4">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              Check your email for a link to complete your account reset. The link will expire in 24
              hours.
            </p>
          </div>
        </div>

        <p>
          If you did not request this account reset, please{' '}
          <button
            type="button"
            className="usa-button usa-button--unstyled"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            cancel the request
          </button>
          .
        </p>

        <div className="margin-top-4">
          <Link href="/login" className="usa-button">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-reset-pending">
      <h1>Account reset in progress</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Waiting period in effect</h2>
          <p className="usa-alert__text">
            For your security, we require a {data.fraudWaitPeriodDays}-day waiting period before
            resetting your account. This helps protect you if someone else requested this reset.
          </p>
        </div>
      </div>

      <p className="text-bold">Time remaining: {data.timeRemaining}</p>

      <p>
        Once the waiting period ends, we&apos;ll send you an email with a link to complete your
        account reset.
      </p>

      <div className="usa-alert usa-alert--info margin-y-4">
        <div className="usa-alert__body">
          <h3 className="usa-alert__heading">What happens next?</h3>
          <ul className="usa-list">
            <li>Your account will be deleted</li>
            <li>You&apos;ll need to create a new account</li>
            <li>You&apos;ll need to re-verify your identity if you had done so previously</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      <div className="margin-top-4">
        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling...' : "Cancel reset (I didn't request this)"}
        </button>
      </div>

      <p className="margin-top-4">
        <Link href="/two-factor" className="usa-link">
          Try signing in a different way
        </Link>
      </p>
    </div>
  );
}
