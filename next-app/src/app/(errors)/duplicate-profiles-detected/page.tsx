'use client';

/**
 * Duplicate Profiles Detected Page
 * Mirrors: app/controllers/duplicate_profiles_detected_controller.rb
 * Route: /duplicate-profiles-detected
 */

import Link from 'next/link';

export default function DuplicateProfilesDetectedPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="text-yellow-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">Multiple accounts detected</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          We found that your identity may be verified on multiple Login.gov accounts.
          Login.gov only allows one verified account per person.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        To continue, you&apos;ll need to contact Login.gov support to resolve this issue.
        We&apos;ll help you determine which account should remain verified.
      </p>

      <div className="bg-gray-50 rounded p-4 mb-6">
        <h2 className="font-medium mb-2">What happens next:</h2>
        <ul className="text-gray-700 text-sm space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">1.</span>
            Contact our support team
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">2.</span>
            Verify your identity with a support agent
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">3.</span>
            Choose which account to keep verified
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link
          href="https://login.gov/contact/"
          className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Contact support
        </Link>

        <Link
          href="/account"
          className="block text-center text-gray-600 hover:underline"
        >
          Return to your account
        </Link>
      </div>
    </div>
  );
}
