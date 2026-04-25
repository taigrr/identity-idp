/**
 * Account Deleted Confirmation Page
 * Mirrors: app/controllers/account_reset/confirm_delete_account_controller.rb
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountDeletedPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="account-deleted">
      <h1>Your account has been deleted</h1>

      <div className="usa-alert usa-alert--success margin-bottom-4">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            The Login.gov account for <strong>{email || 'your email'}</strong> has been successfully
            deleted.
          </p>
        </div>
      </div>

      <h2>What happens now?</h2>
      <ul className="usa-list">
        <li>Your Login.gov account and all associated data have been permanently deleted</li>
        <li>
          You will no longer be able to sign in to partner agencies using this Login.gov account
        </li>
        <li>Any verified identity information has been removed</li>
      </ul>

      <h2>Want to create a new account?</h2>
      <p>
        You can create a new Login.gov account at any time. If you need to verify your identity for
        a partner agency, you&apos;ll need to go through the verification process again.
      </p>

      <div className="margin-top-4">
        <Link href="/signup" className="usa-button">
          Create a new account
        </Link>
        <Link href="/" className="usa-button usa-button--outline margin-left-2">
          Go to Login.gov
        </Link>
      </div>
    </div>
  );
}
