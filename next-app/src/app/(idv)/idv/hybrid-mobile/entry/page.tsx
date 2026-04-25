'use client';

/**
 * Hybrid Mobile Entry Page
 * Mirrors: app/controllers/idv/hybrid_mobile/entry_controller.rb
 * Route: /idv/hybrid-mobile/entry
 *
 * Entry point for the hybrid mobile document capture flow.
 * User arrives here from an SMS link on their mobile device.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initializeHybridSession } from './actions';

export default function HybridMobileEntryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const sessionUuid = searchParams.get('session');

  useEffect(() => {
    if (!sessionUuid) {
      setError('Invalid link. Please use the link from your text message.');
      setIsInitializing(false);
      return;
    }

    initializeHybridSession(sessionUuid).then((result: { success: boolean; sessionData?: { flowPath: string }; error?: string }) => {
      if (result.success && result.sessionData) {
        router.push('/idv/document-capture');
      } else {
        setError(result.error || 'Unable to continue. Please try again.');
        setIsInitializing(false);
      }
    });
  }, [sessionUuid, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold">Setting up document capture...</h1>
          <p className="text-gray-600 mt-2">Please wait while we prepare your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">Unable to continue</h1>

        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            If you continue to have problems, return to your computer and request a new link.
          </p>
        </div>
      </div>
    </div>
  );
}
