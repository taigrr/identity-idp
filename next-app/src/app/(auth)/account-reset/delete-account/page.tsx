/**
 * Account Reset Delete Account Page
 * Mirrors: app/controllers/account_reset/delete_account_controller.rb
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateGrantedToken, deleteAccount, cancelDeleteFromGrant } from './actions';

export default function DeleteAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function validate() {
      const result = await validateGrantedToken(token!);
      if (result.success) {
        setIsValid(true);
        setEmail(result.email || null);
      } else {
        setError(result.error || 'Invalid token');
        setTimeout(() => {
          router.push('/login?error=invalid_reset_token');
        }, 3000);
      }
      setIsValidating(false);
    }
    validate();
  }, [token, router]);

  async function handleDelete() {
    if (!token) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteAccount(token);
    if (result.success) {
      // Redirect to confirmation page with email
      router.push(`/account-reset/deleted?email=${encodeURIComponent(result.email || '')}`);
    } else {
      setError(result.error || 'Failed to delete account');
    }
    setIsDeleting(false);
  }

  async function handleCancel() {
    if (!token) return;

    setIsCancelling(true);
    setError(null);

    const result = await cancelDeleteFromGrant(token);
    if (result.success) {
      router.push('/login?flash=reset_cancelled');
    } else {
      setError(result.error || 'Failed to cancel');
    }
    setIsCancelling(false);
  }

  // No token - show informational page
  if (!token) {
    return (
      <div className="delete-account">
        <h1>Delete your account</h1>

        <p>
          If you requested an account reset, check your email for a link to delete your account.
        </p>

        <p>
          The link is only valid for 24 hours after the waiting period ends. If your link has
          expired, you&apos;ll need to start a new account reset request.
        </p>

        <div className="margin-top-4">
          <Link href="/login" className="usa-button">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Validating
  if (isValidating) {
    return (
      <div className="delete-account">
        <h1>Delete your account</h1>
        <p>Validating your request...</p>
      </div>
    );
  }

  // Invalid token
  if (!isValid) {
    return (
      <div className="delete-account">
        <h1>Delete your account</h1>

        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              {error || 'This link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <p className="margin-top-2">Redirecting to sign in...</p>
      </div>
    );
  }

  // Valid - show confirmation
  return (
    <div className="delete-account">
      <h1>Delete your account</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">This action cannot be undone</h2>
          <p className="usa-alert__text">
            Your account and all associated data will be permanently deleted.
          </p>
        </div>
      </div>

      <p>
        You are about to delete the account associated with <strong>{email}</strong>.
      </p>

      <h2>What will be deleted:</h2>
      <ul className="usa-list">
        <li>Your Login.gov account</li>
        <li>All connected service provider accounts</li>
        <li>Your verified identity information (if applicable)</li>
        <li>All authentication methods (phone, security keys, etc.)</li>
      </ul>

      <p>
        After deletion, you can create a new Login.gov account, but you&apos;ll need to verify your
        identity again if required.
      </p>

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
          className="usa-button usa-button--secondary"
          onClick={handleDelete}
          disabled={isDeleting || isCancelling}
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
        </button>
        <button
          type="button"
          className="usa-button usa-button--outline margin-left-2"
          onClick={handleCancel}
          disabled={isDeleting || isCancelling}
        >
          {isCancelling ? 'Cancelling...' : 'No, keep my account'}
        </button>
      </div>
    </div>
  );
}
