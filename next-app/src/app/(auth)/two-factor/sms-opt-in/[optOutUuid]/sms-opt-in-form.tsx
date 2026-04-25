'use client';

/**
 * SMS Opt-In Form Component
 */

import { useState } from 'react';
import Link from 'next/link';
import { optInToSms } from './actions';

interface SmsOptInFormProps {
  optOutUuid: string;
  formattedPhone: string;
  cancelUrl: string;
  hasOtherMethods: boolean;
}

export function SmsOptInForm({
  optOutUuid,
  formattedPhone,
  cancelUrl,
  hasOtherMethods,
}: SmsOptInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyOptedIn, setAlreadyOptedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await optInToSms(optOutUuid);
    if (!result.success) {
      setError(result.error || 'Failed to opt in');
      setAlreadyOptedIn(!!result.alreadyOptedIn);
      setIsSubmitting(false);
    }
    // If success, redirect happens server-side
  };

  if (alreadyOptedIn) {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <h2 className="font-medium text-yellow-900 mb-2">Already opted in</h2>
          <p className="text-yellow-800 text-sm">
            This phone number ({formattedPhone}) was recently opted in to receive text messages.
            Due to carrier restrictions, you may need to wait up to 30 days before opting in again.
          </p>
        </div>

        <div className="space-y-3">
          {hasOtherMethods && (
            <Link
              href="/two-factor"
              className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
            >
              Use a different authentication method
            </Link>
          )}

          <Link
            href="/two-factor/sms?delivery_preference=voice"
            className="block w-full py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
          >
            Receive a phone call instead
          </Link>

          <Link
            href={cancelUrl}
            className="block text-center text-gray-600 hover:underline text-sm"
          >
            Cancel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <p className="text-gray-700 mb-6">
        Click the button below to opt {formattedPhone} back in to receive text messages.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isSubmitting ? 'Processing...' : 'Opt in to text messages'}
      </button>

      <div className="text-center space-y-2">
        <Link
          href="/two-factor/sms?delivery_preference=voice"
          className="text-blue-600 hover:underline block"
        >
          Receive a phone call instead
        </Link>

        {hasOtherMethods && (
          <Link href="/two-factor" className="text-blue-600 hover:underline block">
            Use a different authentication method
          </Link>
        )}

        <Link href={cancelUrl} className="text-gray-600 hover:underline block text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
