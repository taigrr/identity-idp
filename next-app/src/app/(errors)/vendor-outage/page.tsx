'use client';

/**
 * Vendor Outage Page
 * Mirrors: app/controllers/vendor_outage_controller.rb
 * Route: /vendor-outage
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function VendorOutagePage() {
  const searchParams = useSearchParams();
  const vendor = searchParams.get('vendor') || 'identity verification';
  const showGpoOption = searchParams.get('gpo') === 'true';

  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="text-yellow-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">Service temporarily unavailable</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-yellow-800">
          Our {vendor} service is currently experiencing technical difficulties.
          We apologize for the inconvenience.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        Please try again later. This issue is usually resolved within a few hours.
      </p>

      {showGpoOption && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <h2 className="font-medium text-blue-900 mb-2">Alternative option</h2>
          <p className="text-blue-800 text-sm mb-3">
            You can verify your address by mail instead. We&apos;ll send a letter with a
            verification code to your address.
          </p>
          <Link
            href="/idv/by-mail/request-letter"
            className="text-blue-600 hover:underline text-sm"
          >
            Verify by mail instead
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>

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
