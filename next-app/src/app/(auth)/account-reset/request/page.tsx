'use client';

/**
 * Account Reset Request Page
 * /account-reset/request
 * User initiates account reset when they can't access MFA
 * Mirrors: app/controllers/account_reset/request_controller.rb
 */

import { useActionState } from 'react';
import Link from 'next/link';
import { requestAccountReset } from '../actions';

const initialState = {
  error: undefined,
  success: undefined,
};

// Account reset deletion period
const DELETION_PERIOD_HOURS = 24;

export default function AccountResetRequestPage() {
  const [state, formAction, isPending] = useActionState(requestAccountReset, initialState);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reset your account</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-900 mb-2">Warning: This will delete your account</h2>
        <p className="text-yellow-800 text-sm">
          If you can&apos;t access your authentication methods, you can request to delete your account.
          After {DELETION_PERIOD_HOURS} hours, your account and all associated data will be permanently deleted.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">What happens next?</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>We&apos;ll send a confirmation email to your email address</li>
          <li>You&apos;ll have {DELETION_PERIOD_HOURS} hours to cancel the request</li>
          <li>After {DELETION_PERIOD_HOURS} hours, your account will be deleted</li>
          <li>You can create a new account with the same email afterward</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">Before you proceed</h2>
        <p className="text-blue-800 text-sm mb-3">
          Have you tried these recovery options?
        </p>
        <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
          <li>
            <Link href="/two-factor/backup-codes" className="underline hover:no-underline">
              Use a backup code
            </Link>
          </li>
          <li>
            <Link href="/two-factor" className="underline hover:no-underline">
              Use a different authentication method
            </Link>
          </li>
          <li>
            <Link href="/help" className="underline hover:no-underline">
              Contact support for help
            </Link>
          </li>
        </ul>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Requesting...' : 'Request account deletion'}
        </button>

        <Link
          href="/two-factor"
          className="block w-full text-center border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Go back and try again
        </Link>
      </form>
    </div>
  );
}
