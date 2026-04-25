/**
 * Delete Email Confirmation Page
 * Mirrors: app/controllers/users/emails_controller.rb#confirm_delete
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { deleteEmail } from '../actions';

export default function DeleteEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = searchParams.get('id');
  const email = searchParams.get('email');

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!emailId) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteEmail(emailId);
    if (result.success) {
      router.push('/account?flash=email_deleted');
    } else {
      setError(result.error || 'Failed to delete email');
    }
    setIsDeleting(false);
  }

  if (!emailId || !email) {
    return (
      <div className="delete-email">
        <h1>Delete email</h1>
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Invalid email address.</p>
          </div>
        </div>
        <Link href="/account" className="usa-link">
          Back to account
        </Link>
      </div>
    );
  }

  return (
    <div className="delete-email">
      <h1>Delete email address</h1>

      <div className="usa-alert usa-alert--warning margin-bottom-4">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">Are you sure?</h2>
          <p className="usa-alert__text">
            You&apos;re about to remove <strong>{email}</strong> from your account.
          </p>
        </div>
      </div>

      <p>After deletion:</p>
      <ul className="usa-list">
        <li>You will no longer receive Login.gov notifications at this address</li>
        <li>Partner agencies will no longer see this email in your profile</li>
        <li>You cannot use this email to sign in</li>
      </ul>

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
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete this email'}
        </button>
        <Link href="/account" className="usa-button usa-button--outline margin-left-2">
          Cancel
        </Link>
      </div>
    </div>
  );
}
