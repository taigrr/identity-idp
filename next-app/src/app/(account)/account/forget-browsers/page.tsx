'use client';

/**
 * Forget All Browsers Page
 * Mirrors: app/controllers/users/forget_all_browsers_controller.rb
 * Route: /account/forget-browsers
 *
 * Allows user to clear the "remember device" setting on all browsers.
 */

import { useState } from 'react';
import Link from 'next/link';
import { forgetAllBrowsers } from './actions';

export default function ForgetAllBrowsersPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await forgetAllBrowsers();
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Forget all browsers</h1>

      <p className="text-gray-600 mb-6">
        This will require you to verify your identity with two-factor authentication
        the next time you sign in from any browser or device.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-medium text-blue-900 mb-2">What happens when you forget all browsers:</h2>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• All &quot;Remember this device&quot; settings will be cleared</li>
          <li>• You will need to complete 2FA the next time you sign in on any device</li>
          <li>• This does not sign you out of any active sessions</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Processing...' : 'Forget all browsers'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/account" className="text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </div>
  );
}
