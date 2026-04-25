'use client';

/**
 * Device Profiling Failed Page
 * Mirrors: app/controllers/device_profiling_failed_controller.rb
 * Route: /device-profiling-failed
 */

import Link from 'next/link';
import { useEffect } from 'react';

export default function DeviceProfilingFailedPage() {
  useEffect(() => {
    // Clear any session data on this error page
    // User will be signed out when they navigate away
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">We couldn&apos;t verify your device</h1>

      <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <p className="text-red-700">
          For security reasons, we were unable to complete your request at this time.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        This can happen for several reasons, including:
      </p>

      <ul className="text-gray-600 mb-6 space-y-2">
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Using a VPN or proxy service
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Browser privacy settings blocking security checks
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Using a public or shared computer
        </li>
      </ul>

      <div className="space-y-3">
        <Link
          href="/sign-in"
          className="block w-full py-3 px-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Try signing in again
        </Link>

        <Link
          href="https://login.gov/help/"
          className="block text-center text-gray-600 hover:underline"
        >
          Get help
        </Link>
      </div>
    </div>
  );
}
