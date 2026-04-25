'use client';

/**
 * Sign-In Security Check Failed Page
 * Mirrors: app/controllers/sign_in_security_check_failed_controller.rb
 * Route: /sign-in-security-check-failed
 */

import Link from 'next/link';

export default function SignInSecurityCheckFailedPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">Security check failed</h1>

      <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <p className="text-red-700">
          We detected unusual activity and couldn&apos;t complete your sign-in request.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        This is a security measure to protect your account. Please wait a few minutes
        and try again.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-medium text-blue-900 mb-2">Tips for successful sign-in:</h2>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Disable any VPN or proxy services</li>
          <li>• Clear your browser cache and cookies</li>
          <li>• Try a different browser or device</li>
          <li>• Ensure JavaScript is enabled</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link
          href="/sign-in"
          className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Try again
        </Link>

        <Link
          href="https://login.gov/contact/"
          className="block text-center text-gray-600 hover:underline"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
