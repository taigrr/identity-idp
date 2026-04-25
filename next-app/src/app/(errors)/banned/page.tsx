'use client';

/**
 * Banned User Page
 * Mirrors: app/controllers/banned_user_controller.rb
 * Route: /banned
 */

import Link from 'next/link';

export default function BannedUserPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">Account suspended</h1>

      <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <p className="text-red-700">
          Your Login.gov account has been suspended. This may be due to a violation of
          our terms of service or suspicious activity.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        If you believe this is an error, please contact Login.gov support for assistance.
      </p>

      <div className="space-y-3">
        <Link
          href="https://login.gov/contact/"
          className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Contact support
        </Link>

        <Link
          href="/"
          className="block text-center text-gray-600 hover:underline"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}
