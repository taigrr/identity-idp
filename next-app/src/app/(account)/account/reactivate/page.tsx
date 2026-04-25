'use client';

/**
 * Account Reactivation Page
 * Mirrors: app/controllers/users/reactivate_account_controller.rb
 * Route: /account/reactivate
 */

import Link from 'next/link';

export default function ReactivateAccountPage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Reactivate your account</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p className="text-blue-800">
          Your account needs to be reactivated to access your verified information.
          This can happen after resetting your password.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        Choose one of the options below to reactivate your account and restore access
        to your verified identity information.
      </p>

      <div className="space-y-4">
        <Link
          href="/account/reactivate/verify-password"
          className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <h2 className="font-semibold mb-1">Verify with password</h2>
          <p className="text-sm text-gray-600">
            Enter your current password to reactivate your account.
          </p>
        </Link>

        <Link
          href="/account/reactivate/verify-personal-key"
          className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <h2 className="font-semibold mb-1">Use personal key</h2>
          <p className="text-sm text-gray-600">
            Enter the personal key you saved when you created your account.
          </p>
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-medium mb-2">Don&apos;t have access to either?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you&apos;ve lost both your password and personal key, you can verify
          your identity again, but this will take longer.
        </p>
        <Link
          href="/idv"
          className="text-blue-600 hover:underline text-sm"
        >
          Verify your identity again
        </Link>
      </div>
    </div>
  );
}
