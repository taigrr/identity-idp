'use client';

/**
 * Sign Up Cancellation Page
 * Mirrors: app/controllers/sign_up/cancellations_controller.rb
 * Route: /signup/cancel
 */

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cancelRegistration } from '../actions';

export default function SignUpCancelPage() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const referer = searchParams.get('referer') || '/signup';

  const handleCancel = async () => {
    setIsSubmitting(true);
    await cancelRegistration();
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cancel account creation</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          Are you sure you want to cancel? Your account will not be created and any
          information you entered will be lost.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        If you cancel now, you will need to start over if you want to create an account
        in the future.
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Cancelling...' : 'Yes, cancel'}
        </button>

        <Link
          href={referer}
          className="flex-1 py-3 px-4 border border-gray-300 rounded text-center hover:bg-gray-50"
        >
          No, go back
        </Link>
      </div>
    </div>
  );
}
