'use client';

/**
 * Second MFA Reminder Page
 * Mirrors: app/controllers/users/second_mfa_reminder_controller.rb
 * Route: /account/mfa-reminder
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SecondMfaReminderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMethod = () => {
    setIsSubmitting(true);
    router.push('/signup/mfa');
  };

  const handleSkip = () => {
    setIsSubmitting(true);
    router.push('/account');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Add another authentication method</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p className="text-blue-800">
          Having multiple authentication methods helps ensure you can always access your account,
          even if you lose access to one method.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        You currently have one authentication method. We recommend adding at least one more
        to keep your account secure and accessible.
      </p>

      <div className="space-y-3 mb-6">
        <h2 className="font-medium">Recommended methods:</h2>
        <ul className="text-gray-700 space-y-2">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Authentication app</strong> - More secure than text messages</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Security key</strong> - Physical device for strongest security</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Face or touch unlock</strong> - Quick and convenient</span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleAddMethod}
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add another method
        </button>

        <button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="w-full py-3 px-4 border border-gray-300 rounded hover:bg-gray-50"
        >
          Skip for now
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        You can always add more authentication methods later from your account settings.
      </p>
    </div>
  );
}
