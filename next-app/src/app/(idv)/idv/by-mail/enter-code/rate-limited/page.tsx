/**
 * Rate Limited Page
 * /idv/by-mail/enter-code/rate-limited
 * Displayed when user exceeds GPO code entry attempts
 * Mirrors: app/controllers/idv/by_mail/enter_code_rate_limited_controller.rb
 */

import Link from 'next/link';

export default function RateLimitedPage() {
  // In production, this would be calculated from the rate limiter
  const hoursUntilReset = 24;

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Too many attempts</h1>
        <p className="text-gray-600">
          You&apos;ve entered an incorrect code too many times.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <p className="text-yellow-800">
          For security, you won&apos;t be able to try again for <strong>{hoursUntilReset} hours</strong>.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
        <h2 className="font-semibold mb-3">What you can do</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Wait {hoursUntilReset} hours and try again with your existing code</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Request a new verification letter (if available)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Contact support if you continue having issues</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <Link
          href="/account"
          className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to your account
        </Link>

        <Link
          href="/help"
          className="block w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Get help
        </Link>
      </div>
    </div>
  );
}
