'use client';

/**
 * PIV/CAC Setup Page
 * Mirrors: app/controllers/users/piv_cac_authentication_setup_controller.rb
 * Route: /account/piv-cac/add
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { submitPivCacSetup, processPivCacCallback } from './actions';

export default function PivCacSetupPage() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (token && !isSubmitting) {
      setIsSubmitting(true);
      processPivCacCallback(token).then((result) => {
        if (!result.success) {
          setError(result.error || 'Setup failed');
        }
        setIsSubmitting(false);
      });
    }
  }, [token, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('name', name);

    const result = await submitPivCacSetup(formData);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If success, redirect happens server-side
  };

  if (isSubmitting && token) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Setting up your PIV/CAC...</h1>
        <p className="text-gray-600 mt-2">Please wait while we verify your certificate.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Add a PIV/CAC card</h1>
      <p className="text-gray-600 mb-6">
        A PIV (Personal Identity Verification) or CAC (Common Access Card) card provides
        strong authentication using your government-issued smart card.
      </p>

      {(error || errorParam) && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error || `Setup error: ${errorParam}`}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-medium text-blue-900 mb-2">Before you begin:</h2>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Make sure you have your PIV/CAC card</li>
          <li>• Make sure you have a compatible card reader</li>
          <li>• Have your PIN ready</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name this PIV/CAC
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Work PIV card"
            className="w-full px-4 py-3 border border-gray-300 rounded"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Give this PIV/CAC a nickname to help you identify it later.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {isSubmitting ? 'Processing...' : 'Continue to PIV/CAC'}
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
