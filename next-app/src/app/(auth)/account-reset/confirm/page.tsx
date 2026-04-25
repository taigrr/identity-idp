/**
 * Account Reset Confirmation Page
 * /account-reset/confirm
 * Confirms that account reset has been requested
 * Mirrors: app/controllers/account_reset/confirm_request_controller.rb
 */

import Link from 'next/link';
import { cancelAccountReset } from '../actions';

// Account reset deletion period
const DELETION_PERIOD_HOURS = 24;

export default function AccountResetConfirmPage() {
  // In production, get user email from session
  const userEmail = 'user@example.com';

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-gray-600">
          We&apos;ve sent an email to <strong>{userEmail}</strong>
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
        <h2 className="font-semibold mb-3">What happens next?</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>
            Check your email for instructions
          </li>
          <li>
            Your account will be scheduled for deletion
          </li>
          <li>
            You have <strong>{DELETION_PERIOD_HOURS} hours</strong> to cancel this request
          </li>
          <li>
            After {DELETION_PERIOD_HOURS} hours, your account and data will be permanently deleted
          </li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          <strong>Changed your mind?</strong> You can cancel this request within the next {DELETION_PERIOD_HOURS} hours.
        </p>
      </div>

      <div className="space-y-4">
        <form action={cancelAccountReset}>
          <button
            type="submit"
            className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel account deletion
          </button>
        </form>

        <Link
          href="/"
          className="block w-full text-center text-gray-600 hover:text-gray-800"
        >
          Return to homepage
        </Link>
      </div>

      <p className="text-xs text-gray-500 mt-8">
        If you didn&apos;t request this account reset, please contact support immediately.
      </p>
    </div>
  );
}
